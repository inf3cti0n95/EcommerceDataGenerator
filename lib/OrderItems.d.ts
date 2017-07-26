import { Observable } from "rxjs";
import { IConnection } from "mysql";
export declare const generateRandomOrderItems: (connection: IConnection) => Observable<{
    orderId: any;
    totalPrice: number;
}>;
