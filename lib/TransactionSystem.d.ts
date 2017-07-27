import { Observable } from "rxjs";
import { IConnection } from "mysql";
export declare class TransactionSystem {
    lastOrderNumber: number;
    currentSysTime: Date;
    systemConfig: ITransactionSystemConfig;
    DbConnection: IConnection;
    constructor(systemConfig: ITransactionSystemConfig, DbConnection: IConnection);
    private getOrderDate;
    private getOrderId;
    private getCustomer;
    private getProducts;
    private getOrderItems;
    private getCustomerAndOrderItems;
    private generateRandomProducts;
    orderReceived$: () => Observable<Transaction>;
    orderProcessed$: (transaction: Transaction) => Observable<Transaction>;
    orderShipped$: (transaction: Transaction) => Observable<Transaction>;
    orderDelivered$: (transaction: Transaction) => Observable<Transaction>;
    orderCancelled$: (transaction: Transaction) => Observable<Transaction>;
    orderReturned$: (transaction: Transaction) => Observable<Transaction>;
}
