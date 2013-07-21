describe('stringEndsWith', function() {
    it('Should ends with value', function() {
        var string = "Test string";

        expect(ko.serverSideValidator.utils.stringEndsWith(string, "string")).toBe(true);
		expect(ko.serverSideValidator.utils.stringEndsWith(string, " string")).toBe(true);
        expect(ko.serverSideValidator.utils.stringEndsWith(string, "string1")).toBe(false);
    });
});