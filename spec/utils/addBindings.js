describe('addBindings', function () {
    it('Should return value and checked by default and datetime custom binding when added custom binding using init', function () {
        var regexes = ko.serverSideValidator.utils.getRegexesForPropertyBinded();
        expect(regexes.length).toBe(2);

        ko.serverSideValidator.init({ bindings: [ "datetime"]});

        //Now it should be value and checked and datetime
        var regexes = ko.serverSideValidator.utils.getRegexesForPropertyBinded();
        expect(regexes.length).toBe(3);
    });

    it('Should return value and checked by default and datetime and radio custom bindings when adding custom binding using addBindings method', function () {
        var regexes = ko.serverSideValidator.utils.getRegexesForPropertyBinded();
        //datetime is already added so now we have count of 3
        expect(regexes.length).toBe(3);

        //Date time already added
        ko.serverSideValidator.utils.addBindings(["datetime", "radio"]);

        //Now it should be value, checked, datetime and radio. datetime is already added, so now only radio binding will be added
        var regexes = ko.serverSideValidator.utils.getRegexesForPropertyBinded();
        expect(regexes.length).toBe(4);
    });
}); 