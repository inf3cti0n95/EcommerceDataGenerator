"use strict";
var __assign = (this && this.__assign) || Object.assign || function(t) {
    for (var s, i = 1, n = arguments.length; i < n; i++) {
        s = arguments[i];
        for (var p in s) if (Object.prototype.hasOwnProperty.call(s, p))
            t[p] = s[p];
    }
    return t;
};
Object.defineProperty(exports, "__esModule", { value: true });
var utils_1 = require("./utils");
var rxjs_1 = require("rxjs");
var uuid_1 = require("uuid");
var rx_sql_1 = require("rx-sql");
var moment = require("moment");
var TransactionSystem = (function () {
    function TransactionSystem(systemConfig, DbConnection) {
        var _this = this;
        this.getOrderDate = function () {
            var dayFactor = parseInt(moment(_this.currentSysTime).format("DDD"), 10);
            dayFactor += 366 * parseInt(moment(_this.currentSysTime).format("YY"), 10) - parseInt(moment(_this.systemConfig.startSystemTime).format("YY"), 10);
            if (_this.currentSysTime.getTime() < Date.now())
                _this.currentSysTime = new Date(_this.currentSysTime.getTime() + (utils_1.generateRandomInt(60000, 300000) * 1080 / dayFactor));
            else
                _this.currentSysTime = new Date(Date.now());
            return _this.currentSysTime;
        };
        this.getOrderId = function () {
            _this.lastOrderNumber = _this.lastOrderNumber + 1;
            return _this.lastOrderNumber;
        };
        this.getCustomer = function () {
            return new rx_sql_1.RxSQL(_this.DbConnection).query("SELECT * FROM customers WHERE customerId=" + utils_1.generateRandomInt(1, _this.systemConfig.totalCustomer))
                .flatMap(function (result) { return result; })
                .map(function (result) {
                var tempCustomer = __assign({}, result, { birthday: new Date(result.birthday) });
                return tempCustomer;
            })
                .take(1);
        };
        this.getProducts = function () {
            var listOfProducts = "(" + _this.generateRandomProducts().toString() + ")";
            return new rx_sql_1.RxSQL(_this.DbConnection).query("SELECT * from products WHERE productId in " + listOfProducts)
                .flatMap(function (results) { return results; })
                .map(function (result) {
                var tempProduct = {
                    categories: JSON.parse(result.categories),
                    productPrice: result.price,
                    productId: result.productId,
                    productName: result.title
                };
                return tempProduct;
            });
        };
        this.getOrderItems = function () {
            return _this.getProducts().map(function (product) {
                var orderItem = {
                    product: product,
                    quantity: utils_1.generateRandomInt(1, 5)
                };
                return orderItem;
            }).toArray();
        };
        this.getCustomerAndOrderItems = function () {
            return _this.getCustomer()
                .mergeMap(function (customer) { return _this.getOrderItems().map(function (orderItems) { return ({ orderItems: orderItems, customer: customer }); }); });
        };
        this.generateRandomProducts = function () {
            var arrayOfProducts = [];
            for (var i = 0; i < utils_1.generateRandomInt(1, 3); i++) {
                arrayOfProducts.push(utils_1.generateRandomInt(1, _this.systemConfig.totalProducts));
            }
            return arrayOfProducts;
        };
        this.orderReceived$ = function () {
            return new rxjs_1.Observable(function (observer) {
                _this.getCustomerAndOrderItems()
                    .subscribe(function (result) {
                    var transaction = {
                        _id: uuid_1.v1(),
                        customer: result.customer,
                        order: {
                            orderItems: result.orderItems,
                            amount: result.orderItems.reduce(function (amount, orderItem) { return amount + (orderItem.quantity * orderItem.product.productPrice); }, 0),
                            orderId: _this.getOrderId(),
                            status: "RECEIVED"
                        },
                        timestamp: _this.getOrderDate()
                    };
                    observer.next(transaction);
                    observer.complete();
                });
            });
        };
        this.orderProcessed$ = function (transaction) {
            return new rxjs_1.Observable(function (observer) {
                var processedTransaction = __assign({}, transaction, { _id: uuid_1.v1(), order: __assign({}, transaction.order, { status: "PROCESSED" }), timestamp: utils_1.generateRandomDate(transaction.timestamp, 0, 1) });
                observer.next(processedTransaction);
                observer.complete();
            });
        };
        this.orderShipped$ = function (transaction) {
            return new rxjs_1.Observable(function (observer) {
                var shippedTransaction = __assign({}, transaction, { _id: uuid_1.v1(), order: __assign({}, transaction.order, { status: "SHIPPED" }), timestamp: utils_1.generateRandomDate(new Date(transaction.timestamp), 1, 3) });
                observer.next(shippedTransaction);
                observer.complete();
            });
        };
        this.orderDelivered$ = function (transaction) {
            return new rxjs_1.Observable(function (observer) {
                var deliveredTransaction = __assign({}, transaction, { _id: uuid_1.v1(), order: __assign({}, transaction.order, { status: "DELIVERED" }), timestamp: utils_1.generateRandomDate(new Date(transaction.timestamp), 2, 7) });
                observer.next(deliveredTransaction);
                observer.complete();
            });
        };
        this.orderCancelled$ = function (transaction) {
            return new rxjs_1.Observable(function (observer) {
                var cancelledTransaction = __assign({}, transaction, { _id: uuid_1.v1(), order: __assign({}, transaction.order, { status: "CANCELLED" }), timestamp: utils_1.generateRandomDate(new Date(transaction.timestamp), 1, 3) });
                observer.error(cancelledTransaction);
                observer.complete();
            });
        };
        this.orderReturned$ = function (transaction) {
            return new rxjs_1.Observable(function (observer) {
                var returnedTransaction = __assign({}, transaction, { _id: uuid_1.v1(), order: __assign({}, transaction.order, { status: "RETURNED" }), timestamp: utils_1.generateRandomDate(new Date(transaction.timestamp), 2, 7) });
                observer.error(returnedTransaction);
                observer.complete();
            });
        };
        this.systemConfig = systemConfig;
        this.currentSysTime = this.systemConfig.startSystemTime;
        this.lastOrderNumber = this.systemConfig.startOrderNumber;
        this.DbConnection = DbConnection;
    }
    return TransactionSystem;
}());
exports.TransactionSystem = TransactionSystem;
//# sourceMappingURL=TransactionSystem.js.map