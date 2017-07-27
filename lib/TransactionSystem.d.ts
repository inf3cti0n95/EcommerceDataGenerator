import { Observable } from "rxjs";
import { IConnection } from "mysql";
export declare class TransactionSystem {
    lastOrderNumber: number;
    currentSysTime: Date;
    systemConfig: ITransactionSystemConfig;
    DbConnection: IConnection;
    constructor(systemConfig: ITransactionSystemConfig, DbConnection: IConnection);
    getOrderDate: () => Date;
    getOrderId: () => string;
    getCustomer: () => Observable<Customer>;
    private getProducts;
    getOrderItems: () => Observable<OrderItem[]>;
    getCustomerAndOrderItems: () => Observable<{
        orderItems: OrderItem[];
        customer: Customer;
    }>;
    private generateRandomProducts;
    orderReceived$: () => Observable<Transaction>;
}
