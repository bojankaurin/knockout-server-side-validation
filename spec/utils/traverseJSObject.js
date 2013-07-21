describe('traverseJSObject', function() {
    it('Should traverse JS object with callback as how receives generated name as a string', function() {
        var company = {
            Name: "TestCompany",
            Employees: [{ Name: "Employee1", Salary: 1000 }, { Name: "Employee2", Salary: 1300 }, { Name: "Employee1", Salary: 1700 }]
        };

        var elements = [];
        ko.serverSideValidator.utils.traverseJSObject(company, function(currentElement){
            elements.push(currentElement);
        });
        //Elements should contains
        //Name, Employees, Employees[0], Employees[0].Name, Employees[0].Salary,
        //Employees[1], Employees[1].Name, Employees[1].Salary,
        //Employees[2], Employees[2].Name, Employees[2].Salary,
        expect(elements.length).toBe(11);
        expect(elements[0]).toBe("Name");
        expect(elements[1]).toBe("Employees");
        expect(elements[2]).toBe("Employees[0]");
        expect(elements[3]).toBe("Employees[0].Name");
        expect(elements[4]).toBe("Employees[0].Salary");
        expect(elements[5]).toBe("Employees[1]");
        expect(elements[6]).toBe("Employees[1].Name");
        expect(elements[7]).toBe("Employees[1].Salary");
        expect(elements[8]).toBe("Employees[2]");
        expect(elements[9]).toBe("Employees[2].Name");
        expect(elements[10]).toBe("Employees[2].Salary");
    });
}); 