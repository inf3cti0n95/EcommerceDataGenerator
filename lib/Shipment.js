"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
var mysql_1 = require("mysql");
var utils_1 = require("./utils");
var rx_sql_1 = require("rx-sql");
var rxjs_1 = require("rxjs");
var uuid_1 = require("uuid");
exports.orderShipped = function (connection, orderId, orderDate, paymentMethod, shipmentType) {
    var shipDate = new Date(orderDate.getTime() + utils_1.generateRandomInt(1, 3) * 24 * 60 * 60 * 1000);
    var trackNo = uuid_1.v1().split("-").pop();
    rxjs_1.Observable.of([]);
    return new rx_sql_1.RxSQL(connection).query(mysql_1.format("INSERT into shipments (shipment_order_id_fk, shipment_tracking_number, shipment_timestamp, shipment_type ) values (?,?,?,?) ", [orderId, trackNo, shipDate, shipmentType]))
        .mergeMap(function (data) { return new rx_sql_1.RxSQL(connection).query(""); })
        .mapTo({ orderId: orderId, orderDate: orderDate, paymentMethod: paymentMethod, shipDate: shipDate, shipmentType: shipmentType });
};
//# sourceMappingURL=Shipment.js.map