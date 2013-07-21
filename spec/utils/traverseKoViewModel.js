describe('traverseKoViewModel', function () {
    it('Should traverse ko object and add test propery on object', function() {
        var company = {
            Name: "TestCompany",
            Employees: [{ Name: "Employee1", Salary: 1000 }, { Name: "Employee2", Salary: 1300 }, { Name: "Employee1", Salary: 1700 }]
        };

        var koCompany = ko.mapping.fromJS(company);

        var elements = [];
        ko.serverSideValidator.utils.traverseKoViewModel(koCompany, function (element) {
            if (ko.isObservable(element)) {
                element.test = ko.observable("test");
            }
        });

        expect(koCompany.Name.test()).toBe("test");
        expect(koCompany.Employees.test).toBe(undefined);
        expect(koCompany.Employees()[0].test).toBe(undefined);
        expect(koCompany.Employees()[0].Name.test()).toBe("test");
        expect(koCompany.Employees()[0].Salary.test()).toBe("test");
        expect(koCompany.Employees()[1].test).toBe(undefined);
        expect(koCompany.Employees()[1].Name.test()).toBe("test");
        expect(koCompany.Employees()[1].Salary.test()).toBe("test");
        expect(koCompany.Employees()[2].test).toBe(undefined);
        expect(koCompany.Employees()[2].Name.test()).toBe("test");
        expect(koCompany.Employees()[2].Salary.test()).toBe("test");
        
    });
}); 