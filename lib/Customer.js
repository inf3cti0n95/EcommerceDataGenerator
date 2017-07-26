"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
var utils_1 = require("./utils");
var Customer = (function () {
    function Customer() {
    }
    Customer.getRandomCustomer = function () {
        return utils_1.generateRandomInt(0, 10000);
    };
    return Customer;
}());
exports.default = Customer;
//# sourceMappingURL=Customer.js.map