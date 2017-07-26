import { IConnection } from "mysql";
import { Observable } from "rxjs";
export declare const orderShipped: (connection: IConnection, orderId: number, orderDate: Date, paymentMethod: string, shipmentType: string) => Observable<{
    orderId: number;
    orderDate: Date;
    paymentMethod: string;
    shipDate: Date;
    shipmentType: string;
}>;
