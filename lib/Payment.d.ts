import { IConnection } from "mysql";
import { Observable } from "rxjs";
export declare const orderPayed: (connection: IConnection, orderId: number, orderDate: Date) => Observable<{
    paymentMethod: string;
    orderId: number;
    orderDate: Date;
}>;
