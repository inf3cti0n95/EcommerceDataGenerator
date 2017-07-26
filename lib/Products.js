"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
var utils_1 = require("./utils");
exports.generateRandomProducts = function () {
    var arrayOfProducts = [];
    for (var i = 0; i < utils_1.generateRandomInt(1, 5); i++) {
        arrayOfProducts.push(utils_1.generateRandomInt(1, 52010));
    }
    return arrayOfProducts;
};
//# sourceMappingURL=Products.js.map