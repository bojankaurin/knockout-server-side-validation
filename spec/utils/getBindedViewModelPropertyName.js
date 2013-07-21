describe('getBindedViewModelPropertyName', function () {
    it('Should return binded property name', function () {
        var attrValue = "attr { value: Name }";
        expect(ko.serverSideValidator.utils.getBindedViewModelPropertyName(attrValue)).toBe("Name");
    });

    it('Should return null because there is no binded property name on this attribute value', function () {
        var attrValue = "attr { data-test-attribute: getTestAttribute }";
        expect(ko.serverSideValidator.utils.getBindedViewModelPropertyName(attrValue)).toBe(null);
    });
});