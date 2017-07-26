import { RxSQL } from "rx-sql";
import {Observable} from "rxjs";
import {IConnection} from "mysql";
import { generateRandomProducts } from "./Products";
import { generateRandomInt } from "./utils"


export const generateRandomOrderItems = ( connection: IConnection ) =>
    new RxSQL(connection).query("SELECT order_id FROM orders ORDER BY order_id DESC LIMIT 1; ")
    .mergeMap((data) => {
        let orderId = data.length === 0 ? 1 : data[0].order_id+1;
        let products = generateRandomProducts();
        return Observable.of(products)
            .flatMap(products => products)
            .mergeMap(productId => new RxSQL(connection).query("SELECT product_price from products where product_id="+productId)
                                    .map(result => ({
                                        productId: productId,
                                        productPrice: result[0].product_price,
                                        quantity: generateRandomInt(1,5)})
                                    )
                    )
            .mergeMap(product => new RxSQL(connection).query("INSERT INTO order_items (`order_item_product_id_fk`,`order_item_order_id_fk`,`order_item_quantity`,`order_item_price`) VALUES ('"+product.productId+"','"+orderId+"',"+product.quantity+","+(product.productPrice*product.quantity)+")").mapTo(product))
            .toArray()
            .map(array => array.reduce((total, product) => total+(product.productPrice*product.quantity), 0))
            .map(totalPrice => ({orderId :orderId,totalPrice: totalPrice }))
    })