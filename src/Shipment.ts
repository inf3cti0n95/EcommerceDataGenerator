import { IConnection, format } from "mysql";
import { generateRandomInt } from "./utils"
import { RxSQL } from "rx-sql";
import { Observable } from "rxjs";
import { CustomerID } from "./interfaces/Customer";
import { v1 } from "uuid";

export const orderShipped = ( connection: IConnection, orderId: number, orderDate: Date, paymentMethod: string, shipmentType: string ) => {
    let shipDate = new Date(orderDate.getTime() + generateRandomInt(1,3)*24*60*60*1000)
    let trackNo = v1().split("-").pop()
    Observable.of([])
    return new RxSQL(connection).query(format("INSERT into shipments (shipment_order_id_fk, shipment_tracking_number, shipment_timestamp, shipment_type ) values (?,?,?,?) ",[orderId,trackNo,shipDate,shipmentType]))
            .mergeMap(data => new RxSQL(connection).query(""))        
    .mapTo({orderId,orderDate,paymentMethod,shipDate,shipmentType})
}   