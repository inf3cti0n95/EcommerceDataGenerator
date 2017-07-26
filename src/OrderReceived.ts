import { IConnection, format } from "mysql";
import { generateRandomInt } from "./utils"
import { RxSQL } from "rx-sql";
import { Observable } from "rxjs";
import { CustomerID } from "./interfaces/Customer";



export const orderReceived = ( connection: IConnection, orderId: number, orderAmount: number ) => {
    let customerId = generateRandomInt(1,10000);
    let timeStamp = new Date((1469532278 + (orderId+10))*1000)
    return new RxSQL(connection).query(format("INSERT INTO `ecomm`.`orders`(`order_order_status_id_fk`,`order_customer_id_fk`,`order_timestamp`,`order_amount`) VALUES (?,?,?,?);",['1',customerId, timeStamp,orderAmount]))
        .mapTo({date: timeStamp, orderId: orderId});
}