describe('getElementPath', function() {
    it('Should generate proper elements', function() {
        var parentElements = [
			"Company",
			"Company.Employees",
			"Company.Employees[0]"
		]
		
		var elements = [
			"Name",
			"Count",
			"Salary"
		]

        expect(ko.serverSideValidator.utils.getElementPath(parentElements[0], elements[0])).toBe("Company.Name");
		expect(ko.serverSideValidator.utils.getElementPath(parentElements[1], elements[1])).toBe("Company.Employees.Count");
		expect(ko.serverSideValidator.utils.getElementPath(parentElements[2], elements[2])).toBe("Company.Employees[0].Salary");
    });
}); 