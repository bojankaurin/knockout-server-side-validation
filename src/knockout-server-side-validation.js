/*
===============================================================================
    Author:     Bojan Kaurin - @bojankaurin                              
    License:    MIT (http://opensource.org/licenses/mit-license.php)           
                                                                               
    Description: Validation of errors on server with KnockoutJS                             
===============================================================================
*/

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
}(ko || {}));

//Validate
(function (koValidate) {
    var self = koValidate;
    self.serverSideValidator = self.serverSideValidator || {};
    self.serverSideValidator.showValidationMessageHandler = null;

    //Name of field to add to each observable
    var uniqueIdField = "uniqueid";
    //This attribute will be added to element on GUI with guid associated with it
    var dataValidateUniqueAttribute = "data-validate-uniqueid";
   
    //Regex to find attr with value inside data-bind.
    //For example inside data-bind="value:Name, attr : { class = 'class' }", should return attr : { class = 'class' }
    var regexForAttr = /attr\s*?:\s*?\{.+?\}/;

    var regexesForPropertyBinded = [
        //When binded with value
        /value\s*?:\s*?.+?(?=\s|,|$)/,
        //When binded with checked
        /checked\s*?:\s*?.+?(?=\s|,|$)/
    ];

    var regexUniqueid = /uniqueid\s*?:\s*?.+?(?=\s|,|$)/;
    
    var dataBind = "data-bind";

    /*
    Update each element with data-bind attribute to add uniqueid.
    For example. If there is attribute data-bind="value: Name" it will be replaced with data-bind="value:Name, attr{ Name.uniqueid() }"
    */
    function updateView() {
        //Go through each element with data-bind attribute
        $("*[" + dataBind + "]").each(function(index, elem) {
            var element = $(elem);
            //data-bind value
            var attrValue = element.attr(dataBind);
            var tmp;
            var name = null;
            
            var uniqueidMatch = attrValue.match(regexUniqueid);
            if (uniqueidMatch && $.trim(uniqueidMatch[0].split(":")[0]) == uniqueIdField) {
                return;
            }
            
            //Go trough regexes for finding binding viewmodel property name.
            //For example data-bind="value:Name" should find Name, or data-bind="checked:RememberMe, should find RememberMe
            $(regexesForPropertyBinded).each(function(index, elem) {
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
                    var appendValue = uniqueIdField + " : " + name + "." + uniqueIdField + "() }";
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
        $("*[" + dataValidateUniqueAttribute + "]").remove();
        $("*[uniqueid]").removeClass("ko-input-validation-error");
        if (data && data.KoValid == false && data.ModelState instanceof Array) {
            //Traverse through view model js object, and foreach elementName(generated based on self.serverSideValidator.getElement)
            //that is equal to Key that is returned from server in object in format { KoValid, ModelState }, where ModelState is array of errors,
            //where each Key from this array item is string that needs to be equal to return from self.serverSideValidator.getElement. If this is equal, then validation message is set,
            //or handler is called, if any. If handler is set, then logic that displays validation messages is ignored.
            self.serverSideValidator.traverseJSObject(ko.mapping.toJS(viewModel), function (elementName) {
                $.each(data.ModelState, function (index, element) {
                    if (element.Key == elementName) {
                        try {
                            var id = eval("viewModel." + elementName.replace(/\[/g, "()[") + "." + uniqueIdField + "()");
                        }
                        catch(ex){
                            if (unhandledMessagesHandler && typeof(unhandledMessagesHandler) == "function") {
                                unhandledMessagesHandler(element.Key, element.Value);
                            }
                            return;
                        }
                        var elem = $("*[" + uniqueIdField + "=" + id + "]");
                        var message = '<span class="ko-field-validation-error" ' + dataValidateUniqueAttribute + '="' + id + '">' + element.Value + '</span>';
                        if (typeof(element.Value) == "string" && element.Value.length) {
                            elem.addClass("ko-input-validation-error");
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
}(ko || {}));


//Traverse stuff
(function (koValidate) {
    var self = koValidate;
    self.serverSideValidator = self.serverSideValidator || {};
    
    /*
    Set unique id (guid) to observable property,
    so each property can be identified on gui (each GUI data-binded element will have uniqueid on that property, so it will be bounded)
    */
    self.serverSideValidator.setUniqueId = function (object) {
        if (object && !ko.isObservable(object.uniqueid)) {
            object.uniqueid = ko.observable(self.serverSideValidator.guid());
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
}(ko || {}));


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
}(ko || {}));

