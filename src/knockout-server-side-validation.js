/*
===============================================================================
Author:     Bojan Kaurin - @bojankaurin                              
License:    MIT (http://opensource.org/licenses/mit-license.php)           
                                                                               
Description: Validation of errors on server with KnockoutJS                             
===============================================================================
*/
if (typeof (ko) === undefined) { throw 'Knockout is required, please ensure it is loaded before loading this server side validation plug-in'; }

//Options
(function (koValidate) {
    var self = koValidate;
    self.serverSideValidator = self.serverSideValidator || {};

    var defaults = {
        bindings: [],
        //Name of unique attribute name to add to each observable
        uniqueAttributeName: "uniqueid",
        //Server validation binding
        serverValidationBinding: "serverValidation",
        //If true, messages will be insert automatically, otherwise, messages will be set in serverValidation bindings
        automaticallyInsertValidationMessages: true,
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

    self.serverSideValidator.init = function (opt) {
        opt = opt || {};
        if (opt.bindings !== undefined && !(opt.bindings instanceof Array)) {
            throw "knockout serverside validation bindings options must be an Array";
        }
        self.serverSideValidator.utils.addBindings(opt.bindings);
        ko.utils.extend(options, opt);
    };

    self.bindingHandlers[self.serverSideValidator.getConfigOptions().serverValidationBinding] = {
        init: function (element, valueAccessor) {
            valueAccessor().serverMessage = ko.observable();
        },
        update: function (element, valueAccessor, allBindingsAccessor) {
            $(element).html(valueAccessor().serverMessage()).addClass(self.serverSideValidator.getConfigOptions().fieldValidationErrorClass);
        }
    };

    return self;
}(ko || {}));

//Utils
(function (koValidate) {
    var self = koValidate;
    self.serverSideValidator = self.serverSideValidator || {};
    self.serverSideValidator.utils = self.serverSideValidator.utils || {};

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
    ];

    self.serverSideValidator.utils.stringEndsWith = function (string, startsWith) {
        string = string || "";
        if (startsWith.length > string.length)
            return false;
        return string.substring(string.length - startsWith.length, string.length) === startsWith;
    };

    self.serverSideValidator.utils.addBindings = function(bindings) {
        bindings = bindings || [];
        //Merge custom bindings with knockout default bindings value and checked
        for (var i = 0; i < bindings.length; i++) {
            var regex = new RegExp(bindings[i] + bindingRegexSufix);
            //If item is not already added to array (Prevent duplicates)
            var alreadyInArrayItem = ko.utils.arrayFirst(regexesForPropertyBinded, function(item) {
                //Convert regex to string and then compare
                return String(regex) === String(item);
            });
            if (alreadyInArrayItem === null) {
                regexesForPropertyBinded.push(regex);
            }
        }
    };

    self.serverSideValidator.utils.getRegexesForPropertyBinded = function () {
        return regexesForPropertyBinded;
    };

    /*
    Get element from parent and current object name.
    For MVC, if there is object Company with list of Emplyees, where each employee have name.
    Then, getElementPath should return Company.Emplyees[index].Name, where index is numeric index of employee in list.  
    */
    self.serverSideValidator.utils.getElementPath = function (parent, j) {
        var sufix = "";
        if (parent != undefined && parent != null) {
            if (self.serverSideValidator.utils.stringEndsWith(parent, "]")) sufix = ".";
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

    //Seed
    var seedId = new Date().getTime();

    var nextId = function () {
        return seedId += 1;
    };

    /*
    Set unique id (guid) to observable property,
    so each property can be identified on gui (each GUI data-binded element will have uniqueid on that property, so it will be bounded)
    */
    self.serverSideValidator.utils.setUniqueId = function (object) {
        if (object && !ko.isObservable(object[self.serverSideValidator.getConfigOptions().uniqueAttributeName])) {
            object[self.serverSideValidator.getConfigOptions().uniqueAttributeName] = ko.observable(nextId());
        }
    };

    self.serverSideValidator.utils.uniqueIdAlreadyExists = function(attrValue) {
        var attrAttrValue = attrValue.match(regexForAttr);
        if (attrAttrValue) {
            var uniqueidMatch = attrAttrValue[0].match(regexUniqueid);
            if (uniqueidMatch) {
                var uniqueIdValue = self.serverSideValidator.utils.getBindedViewModelPropertyName(attrAttrValue[0]) + "." + self.serverSideValidator.getConfigOptions().uniqueAttributeName;
                if (//Unique attribute name is same as in options
                    $.trim(uniqueidMatch[0].split(":")[0]) == self.serverSideValidator.getConfigOptions().uniqueAttributeName
                        //Unique attribute is readed from property binded to this attribute or property()
                        && ($.trim(uniqueidMatch[0].split(":")[1]) == uniqueIdValue || $.trim(uniqueidMatch[0].split(":")[1]) == (uniqueIdValue + "()"))) {
                    return true;
                }
            }
        }
        return false;
    };

    self.serverSideValidator.utils.getBindedViewModelPropertyName = function(attrValue) {
        var name = null;
        //Go trough regexes for finding binding viewmodel property name.
        //For example data-bind="value:Name" should find Name, or data-bind="checked:RememberMe, should find RememberMe
        var regexes = self.serverSideValidator.utils.getRegexesForPropertyBinded();
        $.each(regexes, function(index, elem) {
            var valueMatch = attrValue.match(elem);
            if (name == null) {
                if (valueMatch) {
                    name = $.trim(valueMatch[0].split(":")[1]);
                }
            }
        });
        return name;
    };

    //Create new attribute value based on old attribute by adding unuque id attribute
    self.serverSideValidator.utils.getNewAttrValue = function(oldAttrValue, bindedViewModelPropertyName) {
        //If unique id attribute already exists break
        if (self.serverSideValidator.utils.uniqueIdAlreadyExists(oldAttrValue)) return oldAttrValue;

        //set attr unique id
        var match = oldAttrValue.match(regexForAttr);
        //Renders ": Name.uniqueid() }"
        var appendValue = self.serverSideValidator.getConfigOptions().uniqueAttributeName + ": " + bindedViewModelPropertyName + "." + self.serverSideValidator.getConfigOptions().uniqueAttributeName + "() }";
        var newAttrValue;
        //If we founded knockout attr value, then append to end
        if (match) {
            newAttrValue = oldAttrValue.replace(match[0], match[0].replace("}", ", " + appendValue));
        }
            //Else if there is no knockout attr value, add 
        else {
            newAttrValue = oldAttrValue + ", attr : { " + appendValue;
        }
        return newAttrValue;
    };

    /*
    Update each element with data-bind attribute to add uniqueid.
    For example. If there is attribute data-bind="value: Name" it will be replaced with data-bind="value:Name, attr{ Name.uniqueid() }"
    */
    self.serverSideValidator.utils.updateView = function (rootNode) {
        rootNode = rootNode || document;
        //Go through each element with data-bind attribute
        $(rootNode).find("*[" + dataBind + "]").each(function (index, elem) {
            var element = $(elem);
            //data-bind value
            var attrValue = element.attr(dataBind);

            //If attr does not exists break
            if (!attrValue) return;
            //If unique id attribute already exists break
            if (self.serverSideValidator.utils.uniqueIdAlreadyExists(attrValue)) return;

            var name = self.serverSideValidator.utils.getBindedViewModelPropertyName(attrValue);

            //If we determined name of viewmodel property
            if (name != null) {
                var newAttrValue = self.serverSideValidator.utils.getNewAttrValue(attrValue, name);
                //Update attr, by removing old one and adding new
                element.removeAttr(dataBind);
                element.attr(dataBind, newAttrValue);
            }
        });
    };

    self.serverSideValidator.utils.getDOMElement = function(uniqueId) {
        return $("*[" + self.serverSideValidator.getConfigOptions().uniqueAttributeName + "=" + uniqueId + "]");
    };

    self.serverSideValidator.utils.generateMessageElement = function(uniqueId, message) {
        var messageElement = '<span class="'
            + self.serverSideValidator.getConfigOptions().fieldValidationErrorClass
            + '" '
            + self.serverSideValidator.getConfigOptions().dataValidateUniqueAttribute + '="' + uniqueId
            + '">' + message
            + '</span>';
        return messageElement;
    };

    /*
    Recursive function to traverse ko object, and when property is observable, call callback with observable object
    */
    self.serverSideValidator.utils.traverseKoViewModel = function (obj, callback) {
        for (j in obj) {
            if (typeof (obj[j]) == "function") {
                //If it is observable array
                if (ko.isObservable(obj[j]) && obj[j]() && obj[j]() instanceof Array) {
                    if (callback) callback(obj[j]());
                    self.serverSideValidator.utils.traverseKoViewModel(obj[j](), callback);
                } else if (ko.isObservable(obj[j])) {
                    if (callback) callback(obj[j]);
                }
                //check if is array by checking the length
            } else if (typeof (obj[j]) == "object") {
                self.serverSideValidator.utils.traverseKoViewModel(obj[j], callback);
            }
        }
    };

    /*Recursive function to traverse object, and foreach node, call callback with element,
    where current element is path to element. See serverSideValidator.utils.getElementPath. */
    self.serverSideValidator.utils.traverseJSObject = function (obj, callback, parent) {
        for (j in obj) {
            var currentElement = self.serverSideValidator.utils.getElementPath(parent, j);
            if (typeof (obj[j]) == "object") {
                // so this is an object
                // Mark an array
                if (obj[j] instanceof Array) {
                    if (callback) callback(currentElement);
                    self.serverSideValidator.utils.traverseJSObject(obj[j], callback, currentElement);
                } else {
                    if (callback) callback(currentElement);
                    self.serverSideValidator.utils.traverseJSObject(obj[j], callback, currentElement);
                }
            } else {
                // We are at an endpoint 
                if (callback) callback(currentElement);
            }
        }
    };

    return self;
}(ko || {}));

//Validate
(function (koValidate) {
    var self = koValidate;
    self.serverSideValidator = self.serverSideValidator || {};
    self.serverSideValidator.showValidationMessageHandler = null;

    /*
    Start traverse ko viewmodel to generate uniqueid on all observables
    with callback self.serverSideValidator.utils.setUniqueId
    */
    function startTraverseKoModel(model) {
        self.serverSideValidator.utils.traverseKoViewModel(model, self.serverSideValidator.utils.setUniqueId);
    }

    self.applyValidation = function (viewModel, rootNode) {
        self.serverSideValidator.utils.updateView(rootNode);
        startTraverseKoModel(viewModel);
    };

    self.applyBindingsWithValidation = function (viewModel, rootNode) {
        self.serverSideValidator.utils.updateView(rootNode);
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
        //Remove all automatically added messages and classes from elements
        $("*[" + self.serverSideValidator.getConfigOptions().dataValidateUniqueAttribute + "]").remove();
        $("*[" + self.serverSideValidator.getConfigOptions().uniqueAttributeName + "]").removeClass(self.serverSideValidator.getConfigOptions().inputValidationErrorClass);
        $("*[data-bind^=" + self.serverSideValidator.getConfigOptions().serverValidationBinding + "]").removeClass(self.serverSideValidator.getConfigOptions().fieldValidationErrorClass);
        //Traverse through view model js object, and foreach elementName(generated based on self.serverSideValidator.utils.getElementPath)
        //that is equal to Key that is returned from server in object in format { KoValid, ModelState }, where ModelState is array of errors,
        //where each Key from this array item is string that needs to be equal to return from self.serverSideValidator.utils.getElementPath. If this is equal, then validation message is set,
        //or handler is called, if any. If handler is set, then logic that displays validation messages is ignored.
        self.serverSideValidator.utils.traverseJSObject(ko.mapping.toJS(viewModel), function (elementName) {
            var viewModelElement = eval("viewModel" + "." + elementName.replace(/\[/g, "()["));
            //If this element have serverMessage binding, clear message
            if (viewModelElement && viewModelElement.serverMessage) {
                viewModelElement.serverMessage(null);
            }
            //If data is not valid
            if (data && data.KoValid == false && data.ModelState instanceof Array) {
                $.each(data.ModelState, function (index, element) {
                    if (element.Key == elementName) {
                        var message = element.Value;
                        //It there is server message binding, set message and break
                        if (viewModelElement && viewModelElement.serverMessage) {
                            viewModelElement.serverMessage(message);
                            return;
                        }
                        var uniqueId = viewModelElement !== undefined ? viewModelElement[self.serverSideValidator.getConfigOptions().uniqueAttributeName] : undefined;
                        //If there is no unique id, then call unhandled message handler if any
                        if (uniqueId === undefined) {
                            if (unhandledMessagesHandler && typeof (unhandledMessagesHandler) == "function") {
                                unhandledMessagesHandler(element.Key, message);
                            }
                            return;
                        }
                        //Get element with validation error
                        var elem = self.serverSideValidator.utils.getDOMElement(uniqueId());
                        //If there is custom message handler for this key, then call it, otherwise insert automatic validation message.
                        if (self.serverSideValidator.showValidationMessageHandler && typeof (self.serverSideValidator.showValidationMessageHandler) == "function") {
                            self.serverSideValidator.showValidationMessageHandler(elem, message);
                        } else if (self.serverSideValidator.getConfigOptions().automaticallyInsertValidationMessages == true) {
                            var messageElement = self.serverSideValidator.utils.generateMessageElement(uniqueId(), message);
                            if (typeof (message) == "string" && message.length >= 0) {
                                elem.addClass(self.serverSideValidator.getConfigOptions().inputValidationErrorClass);
                                $(messageElement).insertAfter(elem);
                            }
                        }
                    }
                });
            }
        });
        return valid;
    };

    return self;
}(ko || {}));