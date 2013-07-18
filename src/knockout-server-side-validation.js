/*
===============================================================================
Author:     Bojan Kaurin - @bojankaurin                              
License:    MIT (http://opensource.org/licenses/mit-license.php)           
                                                                               
Description: Validation of errors on server with KnockoutJS                             
===============================================================================
*/
if (typeof (ko) === undefined) { throw 'Knockout is required, please ensure it is loaded before loading this server side validation plug-in'; }

//Guid helper
(function (koValidate) {
    var self = koValidate;
    self.serverSideValidator = self.serverSideValidator || {};

    var s4 = function () {
        return Math.floor((1 + Math.random()) * 0x10000)
                   .toString(16)
                   .substring(1);
    };

    //Generate guid
    self.serverSideValidator.guid = function () {
        return s4() + s4() + '-' + s4() + '-' + s4() + '-' +
            s4() + '-' + s4() + s4() + s4();
    };

    function init() {
    }
    $(document).ready(init);
    return self;
} (ko || {}));

//Options
(function (koValidate) {
    var self = koValidate;
    self.serverSideValidator = self.serverSideValidator || {};

    var defaults = {
        bindings: [],
        //Name of unique attribute name to add to each observable
        uniqueAttributeName: "uniqueid",
        //This attribute will be added to element on GUI with guid associated with it
        dataValidateUniqueAttribute: "data-validate-uniqueid",
        //Class to be added to input on validation error
        inputValidationErrorClass: "ko-input-validation-error",
        //Class to be added to message container on validation error
        fieldValidationErrorClass: "ko-field-validation-error"
    };

    // make a copy  so we can use 'reset' later
    var options = ko.utils.extend({}, defaults);

    self.serverSideValidator.getConfigOptions = function () {
        return options;
    };

    self.serverSideValidator.resetConfigOptions = function () {
        options = jQuery.extend(options, defaults);
    };

    self.serverSideValidator.init = function(opt) {
        opt = opt || {};
        if (opt.bindings && !(opt.bindings instanceof Array)) {
            throw "options.bindings must be an Array";
        }
        ko.utils.extend(options, opt);
    };
    
    function init() {
        
    }
    
    $(document).ready(init);
    return self;
} (ko || {}));

//Validate
(function (koValidate) {
    var self = koValidate;
    self.serverSideValidator = self.serverSideValidator || {};
    self.serverSideValidator.showValidationMessageHandler = null;

    //Regex to find attr with value inside data-bind.
    //For example inside data-bind="value:Name, attr : { class = 'class' }", should return attr : { class = 'class' }
    var regexForAttr = /attr\s*?:\s*?\{.+?\}/;
    var bindingRegexSufix = "\\s*?:\\s*?.+?(?=\\s|,|$)";
    var dataBind = "data-bind";
    var regexUniqueid = new RegExp(self.serverSideValidator.getConfigOptions().uniqueAttributeName + bindingRegexSufix);
    var regexesForPropertyBinded = [
    //When binded with value
		new RegExp("value" + bindingRegexSufix),
    //When binded with checked
		new RegExp("checked" + bindingRegexSufix)
    //value\s*?:\s*?.+?(?=\s|,|$)/,
    //checked\s*?:\s*?.+?(?=\s|,|$)/
    ];

    function refreshRegexesForPropertyBinded() {
        //Merge custom bindings with knockout default bindings value and checked
        for (var i = 0; i < self.serverSideValidator.getConfigOptions().bindings.length; i++) {
            var regex = new RegExp(self.serverSideValidator.getConfigOptions().bindings[i] + bindingRegexSufix);
            //If item is not already added to array (Prevent duplicates)
            if ($.inArray(regex, regexesForPropertyBinded) == -1) {
                regexesForPropertyBinded.push(regex);
            }
        }
    }

    /*
    Update each element with data-bind attribute to add uniqueid.
    For example. If there is attribute data-bind="value: Name" it will be replaced with data-bind="value:Name, attr{ Name.uniqueid() }"
    */
    function updateView() {
        refreshRegexesForPropertyBinded();
        //Go through each element with data-bind attribute
        $("*[" + dataBind + "]").each(function (index, elem) {
            var element = $(elem);
            //data-bind value
            var attrValue = element.attr(dataBind);
            var tmp;
            var name = null;

            var uniqueidMatch = attrValue.match(regexUniqueid);
            if (uniqueidMatch && $.trim(uniqueidMatch[0].split(":")[0]) == self.serverSideValidator.getConfigOptions().uniqueAttributeName) {
                return;
            }

            //Go trough regexes for finding binding viewmodel property name.
            //For example data-bind="value:Name" should find Name, or data-bind="checked:RememberMe, should find RememberMe
            $.each(regexesForPropertyBinded, function (index, elem) {
                var valueMatch = attrValue.match(elem);
                if (name == null) {
                    if (valueMatch) {
                        name = $.trim(valueMatch[0].split(":")[1]);
                    }
                }
            });

            //If we determined name of viewmodel property
            if (name) {
                //set attr unique id
                if (attrValue) {
                    var match = attrValue.match(regexForAttr);
                    //Renders ": Name.uniqueid() }"
                    var appendValue = self.serverSideValidator.getConfigOptions().uniqueAttributeName + " : " + name + "." + self.serverSideValidator.getConfigOptions().uniqueAttributeName + "() }";
                    //If we founded knockout attr value, then append to end
                    if (match) {
                        tmp = attrValue.replace(match[0], match[0].replace("}", " ," + appendValue));
                    }
                    //Else if there is no knockout attr value, add 
                    else {
                        tmp = attrValue + ", attr : { " + appendValue;
                    }
                    //Update attr, by removing old one and adding new
                    element.removeAttr(dataBind);
                    element.attr(dataBind, tmp);
                }
            }
        });
    };

    self.applyValidation = function (viewModel) {
        updateView();
        startTraverseKoModel(viewModel);
    };

    self.applyBindingsWithValidation = function (viewModel, rootNode) {
        updateView();
        startTraverseKoModel(viewModel);
        ko.applyBindings(viewModel, rootNode);
    };

    self.serverSideValidator.updateKoModel = startTraverseKoModel;

    /*
    Validate model and generate span bellow item with class ko-validate-error. 
    If self.serverSideValidator.showValidationMessageHandler(elem, message) is set, then this handler is used to put appropriate messages.
    This handler passes two parameters. Elem - jQuery element in DOM, and message - validation message.
    If handler is set, then user needs to take care to remove all previous validation messages.
    */
    self.serverSideValidator.validateModel = function (viewModel, data, unhandledMessagesHandler) {
        var valid = data && !(data.KoValid == false);
        //
        $("*[" + self.serverSideValidator.getConfigOptions().dataValidateUniqueAttribute + "]").remove();
        $("*[" + self.serverSideValidator.getConfigOptions().uniqueAttributeName + "]").removeClass(self.serverSideValidator.getConfigOptions().inputValidationErrorClass);
        if (data && data.KoValid == false && data.ModelState instanceof Array) {
            //Traverse through view model js object, and foreach elementName(generated based on self.serverSideValidator.getElement)
            //that is equal to Key that is returned from server in object in format { KoValid, ModelState }, where ModelState is array of errors,
            //where each Key from this array item is string that needs to be equal to return from self.serverSideValidator.getElement. If this is equal, then validation message is set,
            //or handler is called, if any. If handler is set, then logic that displays validation messages is ignored.
            self.serverSideValidator.traverseJSObject(ko.mapping.toJS(viewModel), function (elementName) {
                $.each(data.ModelState, function (index, element) {
                    if (element.Key == elementName) {
                        try {
                            var id = eval("viewModel." + elementName.replace(/\[/g, "()[") + "." + self.serverSideValidator.getConfigOptions().uniqueAttributeName + "()");
                        }
                        catch (ex) {
                            if (unhandledMessagesHandler && typeof (unhandledMessagesHandler) == "function") {
                                unhandledMessagesHandler(element.Key, element.Value);
                            }
                            return;
                        }
                        var elem = $("*[" + self.serverSideValidator.getConfigOptions().uniqueAttributeName + "=" + id + "]");
                        var message = '<span class="' + self.serverSideValidator.getConfigOptions().fieldValidationErrorClass + '" ' + self.serverSideValidator.getConfigOptions().dataValidateUniqueAttribute + '="' + id + '">' + element.Value + '</span>';
                        if (typeof (element.Value) == "string" && element.Value.length) {
                            elem.addClass(self.serverSideValidator.getConfigOptions().inputValidationErrorClass);
                        }
                        if (self.serverSideValidator.showValidationMessageHandler && typeof (self.serverSideValidator.showValidationMessageHandler) == "function") {
                            self.serverSideValidator.showValidationMessageHandler(elem, message);
                        } else {
                            $(message).insertAfter(elem);
                        }
                    }
                });
            });
        }
        return valid;
    };

    /*
    Start traverse ko viewmodel to generate uniqueid on all observables
    with callback self.serverSideValidator.setUniqueId
    */
    function startTraverseKoModel(model) {
        self.serverSideValidator.traverseKoViewModel(model, self.serverSideValidator.setUniqueId);
    }

    function init() {
        String.prototype.endsWith = function (suffix) {
            return this.indexOf(suffix, this.length - suffix.length) !== -1;
        };
    }
    $(document).ready(init);
    return self;
} (ko || {}));


//Traverse stuff
(function (koValidate) {
    var self = koValidate;
    self.serverSideValidator = self.serverSideValidator || {};

    /*
    Set unique id (guid) to observable property,
    so each property can be identified on gui (each GUI data-binded element will have uniqueid on that property, so it will be bounded)
    */
    self.serverSideValidator.setUniqueId = function (object) {
        if (object && !ko.isObservable(object[self.serverSideValidator.getConfigOptions().uniqueAttributeName])) {
            object[self.serverSideValidator.getConfigOptions().uniqueAttributeName] = ko.observable(self.serverSideValidator.guid());
        }
    };

    /*
    Recursive function to traverse ko object, and when property is observable, call callback with observable object
    */
    self.serverSideValidator.traverseKoViewModel = function (obj, callback) {
        for (j in obj) {
            if (typeof (obj[j]) == "function") {
                //If it is observable array
                if (ko.isObservable(obj[j]) && obj[j]() && obj[j]() instanceof Array) {
                    if (callback) callback(obj[j]());
                    self.serverSideValidator.traverseKoViewModel(obj[j](), callback);
                } else if (ko.isObservable(obj[j])) {
                    if (callback) callback(obj[j]);
                }
                //check if is array by checking the length
            } else if (typeof (obj[j]) == "object") {
                self.serverSideValidator.traverseKoViewModel(obj[j], callback);
            }
        }
    };

    /*Recursive function to traverse object, and foreach node, call callback with element,
    where current element is path to element. See serverSideValidator.getElement. */
    self.serverSideValidator.traverseJSObject = function (obj, callback, parent) {
        for (j in obj) {
            var currentElement = self.serverSideValidator.getElement(parent, j);
            if (typeof (obj[j]) == "object") {
                // so this is an object
                // Mark an array
                if (obj[j] instanceof Array) {
                    if (callback) callback(currentElement);
                    self.serverSideValidator.traverseJSObject(obj[j], callback, currentElement);
                } else {
                    if (callback) callback(currentElement);
                    self.serverSideValidator.traverseJSObject(obj[j], callback, currentElement);
                }
            } else {
                // We are at an endpoint 
                if (callback) callback(currentElement);
            }
        }
    };

    function init() {
    }
    $(document).ready(init);
    return self;
} (ko || {}));


//MVC way of generating field names
(function (koValidate) {
    var self = koValidate;
    self.serverSideValidator = self.serverSideValidator || {};

    /*
    Get element from parent and current object name.
    For MVC, if there is object Company with list of Emplyees, where each employee have name.
    Then, getElement should return Company.Emplyees[index].Name, where index is numeric index of employee in list.  
    */
    self.serverSideValidator.getElement = function (parent, j) {
        var sufix = "";
        if (parent != undefined && parent != null) {
            if (parent.endsWith("]")) sufix = ".";
            if (!isNaN(j)) {
                return parent + sufix + "[" + j + "]";
            } else {
                //For case when parent object exists but it is not an array
                if (parent != undefined) sufix = ".";
                return parent + sufix + j;
            }
        }
        return j;
    };

    function init() {
    }
    $(document).ready(init);
    return self;
} (ko || {}));

