describe('setUniqueId', function() {
    it('Should be unique x times in a row', function() {
        var objects = [];
        for (var i = 0; i < 100; i++) {
            var object = {};
            object.Index = i;
            ko.serverSideValidator.utils.setUniqueId(object);
            objects.push(object);
        }

        for (var i = 0; i < objects.length; i++) {
            var objectToCompare = objects[i];
            for (var j = 0; j < objects.length; j++) {
                if (i == j) {
                    expect(objectToCompare[ko.serverSideValidator.getConfigOptions().uniqueAttributeName]()).toBe(objects[j][ko.serverSideValidator.getConfigOptions().uniqueAttributeName]());
                } else {
                    expect(objectToCompare[ko.serverSideValidator.getConfigOptions().uniqueAttributeName]()).toNotBe(objects[j][ko.serverSideValidator.getConfigOptions().uniqueAttributeName]());
                }
            }
        }
    });
});