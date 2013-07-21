describe('uniqueIdAlreadyExists', function() {
    it('Should check if uniqueid binding already exists in case when it does not exits', function () {
        var attrValue = "attr: { data-test-attribute: getTestAttribute }";
        expect(ko.serverSideValidator.utils.uniqueIdAlreadyExists(attrValue)).toBe(false);
    });

    it('Should check if uniqueid binding already exists in case then it does exists and binded unique propery matches with property binded with this element ending with ()', function () {
        var attrValue = "attr: { value: Name, " + ko.serverSideValidator.getConfigOptions().uniqueAttributeName + ": Name.uniqueid }";
        expect(ko.serverSideValidator.utils.uniqueIdAlreadyExists(attrValue)).toBe(true);
    });

    it('Should check if uniqueid binding already exists in case then it does exists and binded unique propery matches with property binded with this element ending without ()', function () {
        var attrValue = "attr: { value: Name, " + ko.serverSideValidator.getConfigOptions().uniqueAttributeName + ": Name.uniqueid() }";
        expect(ko.serverSideValidator.utils.uniqueIdAlreadyExists(attrValue)).toBe(true);
    });

    it('Should check if uniqueid binding already exists in case then it does exists but binded unique propery does not match with property binded with this element', function () {
        var attrValue = "attr: { data-test-attribute: getTestAttribute, " + ko.serverSideValidator.getConfigOptions().uniqueAttributeName + ": someTestValue }";
        expect(ko.serverSideValidator.utils.uniqueIdAlreadyExists(attrValue)).toBe(false);
    });
});