"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.generateRandomInt = function (start, end) {
    return typeof end === "undefined" ? Math.floor(Math.random() * start) : Math.floor(Math.random() * (end - start) + start);
};
exports.generateRandomDate = function (currentDate, start, end) {
    return new Date(exports.generateRandomInt(new Date(currentDate).getTime() + start * 24 * 60 * 60 * 1000, new Date(currentDate).getTime() + end * 24 * 60 * 60 * 1000));
};
//# sourceMappingURL=utils.js.map