"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
var rx_sql_1 = require("rx-sql");
var rxjs_1 = require("rxjs");
var Products_1 = require("./Products");
var utils_1 = require("./utils");
exports.generateRandomOrderItems = function (connection) {
    return new rx_sql_1.RxSQL(connection).query("SELECT order_id FROM orders ORDER BY order_id DESC LIMIT 1; ")
        .mergeMap(function (data) {
        var orderId = data.length === 0 ? 1 : data[0].order_id + 1;
        var products = Products_1.generateRandomProducts();
        return rxjs_1.Observable.of(products)
            .flatMap(function (products) { return products; })
            .mergeMap(function (productId) { return new rx_sql_1.RxSQL(connection).query("SELECT product_price from products where product_id=" + productId)
            .map(function (result) { return ({
            productId: productId,
            productPrice: result[0].product_price,
            quantity: utils_1.generateRandomInt(1, 5)
        }); }); })
            .mergeMap(function (product) { return new rx_sql_1.RxSQL(connection).query("INSERT INTO order_items (`order_item_product_id_fk`,`order_item_order_id_fk`,`order_item_quantity`,`order_item_price`) VALUES ('" + product.productId + "','" + orderId + "'," + product.quantity + "," + (product.productPrice * product.quantity) + ")").mapTo(product); })
            .toArray()
            .map(function (array) { return array.reduce(function (total, product) { return total + (product.productPrice * product.quantity); }, 0); })
            .map(function (totalPrice) { return ({ orderId: orderId, totalPrice: totalPrice }); });
    });
};
//# sourceMappingURL=OrderItems.js.map