import { generateRandomInt } from "./utils";
import { Observable, Observer } from "rxjs";
import { v1 as uuid } from "uuid";
import { RxSQL } from "rx-sql";
import { IConnection, format } from "mysql";


export class TransactionSystem {
    public lastOrderNumber: number
    public currentSysTime: Date
    public systemConfig: ITransactionSystemConfig
    public DbConnection: IConnection;
    constructor(systemConfig: ITransactionSystemConfig, DbConnection: IConnection) {
        this.systemConfig = systemConfig;
        this.currentSysTime = this.systemConfig.startSystemTime;
        this.lastOrderNumber = 0;
        this.DbConnection = DbConnection;
    }
    getOrderDate = () => {
        if (this.currentSysTime.getTime() < Date.now())
            this.currentSysTime = new Date(this.currentSysTime.getTime() + generateRandomInt(500, 5000))
        else
            this.currentSysTime = new Date(Date.now())
        return this.currentSysTime;
    }

    getOrderId = () => {
        this.lastOrderNumber = this.lastOrderNumber + 1;
        return "ORDER" + this.lastOrderNumber
    }

    getCustomer = () => {
        return new RxSQL(this.DbConnection).query<Customer[]>(format("SELECT * FROM customers WHERE customerId=?", [generateRandomInt(1, this.systemConfig.totalCustomer)]))
            .flatMap(result => result)
            .map(result => {
                let tempCustomer: Customer = {
                    ...result
                }
                return tempCustomer
            })
            .first()
    }

    private getProducts = () => {
        let listOfProducts = `(${this.generateRandomProducts().toString()})`
        return new RxSQL(this.DbConnection).query<ProductQueryResult[]>("SELECT * from products WHERE productId in " + listOfProducts)
            .flatMap(results => results)
            .map(result => {
                let tempProduct = {
                    categories: JSON.parse(result.categories),
                    productPrice: result.price,
                    productId: result.productId,
                    productName: result.name
                }
                return tempProduct
            })
    }

    getOrderItems = () =>
        this.getProducts().map(product => {
            let orderItem: OrderItem = {
                product: product,
                quantity: generateRandomInt(1, 5)
            }
            return orderItem
        }).toArray()

    getCustomerAndOrderItems = () => {
        return this.getCustomer()
            .mergeMap(customer => this.getOrderItems().map(orderItems => ({ orderItems, customer })))
    }

    private generateRandomProducts = () => {
        let arrayOfProducts = [];

        for (let i = 0; i < generateRandomInt(1, 5); i++) {
            arrayOfProducts.push(generateRandomInt(1, this.systemConfig.totalProducts))
        }

        return arrayOfProducts
    }

    orderReceived$ = () =>
        new Observable<Transaction>((observer: Observer<Transaction>) => {
                this.getCustomerAndOrderItems()
                .subscribe(result => {
                    let transaction: Transaction = {
                        transactionId: uuid(),
                        customer: result.customer,
                        order: {
                            orderItems: result.orderItems,
                            amount: result.orderItems.reduce((amount, orderItem) => amount + (orderItem.quantity * orderItem.product.productPrice), 0),
                            orderId: this.getOrderId(),
                            status: "RECEIVED",
                            timestamp: this.getOrderDate()
                        }
                    }
                    observer.next(transaction)
                    observer.complete()
                })
        })
}