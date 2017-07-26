"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.generateRandomInt = function (start, end) {
    return typeof end === "undefined" ? Math.floor(Math.random() * start) : Math.floor(Math.random() * (end - start) + start);
};
//# sourceMappingURL=utils.js.map