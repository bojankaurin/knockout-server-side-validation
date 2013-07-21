describe('getNewAttrValue', function () {
    it('Should return data-bind attribute value updated with uniqueid', function () {
        var attrValue = "attr : { value: Name }";
        var expected = "attr : { value: Name , "
                        + ko.serverSideValidator.getConfigOptions().uniqueAttributeName
                        + ": Name."
                        + ko.serverSideValidator.getConfigOptions().uniqueAttributeName
                        + "() }";
        var propertyName = ko.serverSideValidator.utils.getBindedViewModelPropertyName(attrValue);
        expect(ko.serverSideValidator.utils.getNewAttrValue(attrValue, propertyName)).toBe(expected);
    });

    it('Should return data-bind attribute without any update because there is already uniqueid added', function () {
        var attrValue = "attr : { value: Name , "
                        + ko.serverSideValidator.getConfigOptions().uniqueAttributeName
                        + ": Name."
                        + ko.serverSideValidator.getConfigOptions().uniqueAttributeName
                        + "() }";
        expect(ko.serverSideValidator.utils.getNewAttrValue(attrValue, "Name")).toBe(attrValue);
    });
});