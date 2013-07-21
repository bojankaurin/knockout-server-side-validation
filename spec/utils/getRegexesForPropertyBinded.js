describe('getRegexesForPropertyBinded', function () {
    it('Should return value and checked by default', function() {
        var regexes = ko.serverSideValidator.utils.getRegexesForPropertyBinded();
        expect(regexes.length).toBe(2);
    });
}); 