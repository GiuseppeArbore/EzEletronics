"use strict";

import { Cart, ProductInCart } from "../components/cart";
import db from "../db/db";
import { EmptyProductStockError, LowProductStockError, ProductNotFoundError } from "../errors/productError";
import { CartNotFoundError, ProductNotInCartError } from "../errors/cartError";
import dayjs from "dayjs";

/**
 * A class that implements the interaction with the database for all cart-related operations.
 * You are free to implement any method you need here, as long as the requirements are satisfied.
 */

class CartDAO {
    //5.1 (api 1) mostra carrello corrente
    getCart(userId: string): Promise<Cart> {
        return new Promise<Cart>((resolve, reject) => {
            try {
                const query = `SELECT customer, paid, payment_date, total
                               FROM carts
                               WHERE paid = false AND customer=? AND total > 0`;
                db.get(query, [userId], (err: Error | null, row: any) => {
                    if (err)
                        reject(err)
                    else {
                        let c: Cart;
                        if (row)
                            c = new Cart(row.customer, row.paid ? true : false, row.payment_date, row.total, []);
                        else
                            c = new Cart(userId, false, null, 0, []);
                        resolve(c);
                    }
                });
            } catch (error) {
                reject(error);
            }
        });
    }

    //5.4 (api 4) mostra storico carrelli
    getCostumerCarts(userId: string): Promise<Cart[]> {
        return new Promise<Cart[]>((resolve, reject) => {
            try {
                const query = 'SELECT * FROM carts WHERE paid = true AND customer=?';
                db.all(query, [userId], (err: Error | null, rows: any[]) => {
                    if (err)
                        reject(err);
                    else {
                       if (rows.length === 0)
                            resolve([])
                        else {
                            const carts: Cart[] = rows.map(row => new Cart(row.customer, row.paid ? true : false, row.payment_date = dayjs(row.payment_date).format("YYYY-MM-DD"), row.total, []));
                            resolve(carts);
                        }
                    }
                });
            } catch (error) {
                reject(error);
            }
        });
    }

    getCartId(userId: string, b: boolean): Promise<number | null> {
        return new Promise<number>((resolve, reject) => {
            try {
                const query = 'SELECT * FROM carts WHERE paid = ? AND customer = ?';
                db.get(query, [b, userId], (err: Error | null, row: any) => {
                    if (err)
                        reject(err);
                    if (!row)
                        resolve(null);
                    else
                        resolve(row.id);
                }
                );
            } catch (error) {
                reject(error);
            }
        });
    }

    getCartsIds(userId: string, b: boolean): Promise<number[]> {
        return new Promise<number[]>((resolve, reject) => {
            try {
                const query = 'SELECT id FROM carts WHERE paid = ? AND customer = ?';
                db.all(query, [b, userId], (err: Error | null, rows: any[]) => {
                    if (err)
                        reject(err);
                    else {
                        const cartIds: number[] = rows.map(row => row.id);
                        resolve(cartIds);
                    }
                });
            } catch (error) {
                reject(error);
            }
        });
    }

    //(api 8) ritorna tutti i carrelli di tutti gli users
    getAllCarts(): Promise<Cart[]> {
        return new Promise<Cart[]>((resolve, reject) => {
            const query = 'SELECT * FROM carts';
            db.all(query, [], (err: Error | null, rows: any[]) => {
                if (err)
                    reject(err);
                else {
                    const carts: Cart[] = rows.map(row => new Cart(row.customer, row.paid ? true : false, row.payment_date, row.total, []));
                    resolve(carts);
                }
            });
        });
    }

    getAllCartsIds(): Promise<number[]> {
        return new Promise<number[]>((resolve, reject) => {
            try {
                const query = 'SELECT id FROM carts';
                db.all(query, [], (err: Error | null, rows: any[]) => {
                    if (err)
                        reject(err);
                    else {
                        const cartIds: number[] = rows.map(row => row.id);
                        resolve(cartIds);
                    }
                });
            } catch (error) {
                reject(error);
            }
        });
    }

    getProductsInCart(cartId: number): Promise<ProductInCart[]> {
        return new Promise<ProductInCart[]>((resolve, reject) => {
            try {
                const query = `SELECT model, quantInCart AS quantity, category, selling_price AS price
                                FROM products
                                JOIN (SELECT product_model, cart_id, quantity AS quantInCart
                                      FROM products_in_carts
                                      WHERE cart_id = ?)
                                WHERE product_model = model`
                db.all(query, [cartId], (err: Error | null, rows: ProductInCart[]) => { //PUOI FARE MEGLIO DI COSì, PROVA A CAMBIARE IL TIPO DI ROWS
                    if (err) {                                                            //potresti evitarti il metodo checkQuantity
                        reject(err)
                    } else {
                        const prods: ProductInCart[] = rows.map(row => new ProductInCart(row.model, row.quantity, row.category, row.price));
                        resolve(prods);
                    }
                });
            } catch (error) {
                reject(error);
            }
        });
    }

    //5.7 (api 7) cancella tutti i carrelli
    deleteAllCarts(): Promise<Boolean> {
        return new Promise<Boolean>((resolve, reject) => {
            try {
                const query = 'DELETE FROM Carts';
                db.run(query, [], function (err: Error) { //per usare this.changes non puoi usare arrow function
                    if (err)
                        reject(err)
                    else {
                        const result = this.changes;
                        if (result)
                            resolve(true);
                        else
                            resolve(false);
                    }
                });
            } catch (error) {
                reject(error)
            }
        });
    }

    //5.6 (api 6) svuota carrello: togli tutti i prodotti, non cancelli il carrello corrente
    clearCart(cartId: number): Promise<Boolean> {
        return new Promise<Boolean>((resolve, reject) => {
            try {
                const query = `UPDATE carts SET total = 0 WHERE id = ?`;
                db.run(query, [cartId], function (err: Error) {
                    if (err)
                        reject(err);
                    else {
                        const result = this.changes;
                        if (result)
                            resolve(true);
                        else
                            reject(new CartNotFoundError());
                    }
                })
            } catch (error) {
                reject(error)
            }
        });
    }

    delProdsFromCart(cartId: number): Promise<void> {
        return new Promise<void>((resolve, reject) => {
            try {
                const query = `DELETE FROM products_in_carts WHERE cart_id = ?`;
                db.run(query, [cartId], function (err) {
                    if (err)
                        reject(err);
                    else
                        resolve();
                })
            } catch (error) {
                reject(error);
            }
        });
    }

    //5.5 (api 5) rimuovi UN prodotto dal carrello corrente
    removeProductFromCart(cartId: number, model: string, b: number): Promise<void> {
        return new Promise<void>((resolve, reject) => {
            try {
                let query;
                if (b === 1)
                    query = `DELETE FROM products_in_carts WHERE cart_id = ? AND product_model = ?`;
                else
                    query = `UPDATE products_in_carts SET quantity = quantity - 1 WHERE cart_id = ? AND product_model = ?`;
                db.run(query, [cartId, model], function (err) {
                    if (err)
                        reject(err)
                    else
                        resolve()
                })
            } catch (error) {
                reject(error)
            }
        });
    }

    productExists(model: string): Promise<number> {
        return new Promise<number>((resolve, reject) => {
            try {
                const query = 'SELECT * FROM products WHERE model = ?';
                db.get(query, [model], function (err: Error | null, row: any) {
                    if (err)
                        reject(err)
                    if (!row) //il prodotto non esiste
                        reject(new ProductNotFoundError());
                    else
                        resolve(row.selling_price)
                });
            } catch (error) {
                reject(error);
            }
        });
    }

    alreadyInCart(cartId: number, model: string): Promise<number | null> { //il prodotto che vogliamo aggiungere è già in carrello? sì/no
        return new Promise<number>((resolve, reject) => {
            try {
                const query = `SELECT * FROM products_in_carts WHERE product_model = ? AND cart_id = ?`;
                db.get(query, [model, cartId], (err: Error | null, row: any) => {
                    if (err)
                        reject(err)
                    else {
                        resolve(row ? row.quantity : null)
                    }
                });
            } catch (error) {
                reject(error);
            }
        });
    }

    cartIsEmpty(cartId: number): Promise<boolean> {
        return new Promise<boolean>((resolve, reject) => {
            try {
                const query = `SELECT * FROM carts WHERE id = ? AND paid = false AND total > 0`;
                db.get(query, [cartId], (err: Error | null, row: any) => {
                    if (err)
                        reject(err)
                    if (!row)
                        resolve(true)
                    else
                        resolve(false)
                })
            } catch (error) {
                reject(error)
            }
        })
    }

    //5.2 add to cart
    addToCart(product: string, cartId: number, bool: boolean): Promise<void> {
        return new Promise<void>((resolve, reject) => {
            try {
                let query;
                if (!bool) { //(bool = false) se non c'era il carrello/carrello c'è ma non contiene il prodotto
                    query = 'INSERT INTO products_in_carts (product_model, cart_id, quantity) VALUES (?, ?, 1)';
                }
                else { //c'era già il carrello contenente il prodotto
                    query = 'UPDATE products_in_carts SET quantity = quantity + 1 WHERE product_model = ? AND cart_id = ?';
                }
                db.run(query, [product, cartId], function (err) {
                    if (err)
                        reject(err);
                    else
                        resolve();
                });
            } catch (error) {
                reject(error);
            }
        });
    }

    newCart(userId: string): Promise<void> {
        return new Promise<void>((resolve, reject) => {
            try {
                const query = 'INSERT INTO carts (customer, paid, payment_date, total) VALUES (?, ?, ?, ?)';
                db.run(query, [userId, false, null, 0], function (err) {
                    if (err)
                        reject(err)
                    else
                        resolve()
                });
            } catch (error) {
                reject(error);
            }
        });
    }

    updateTotal(cartId: number, price: number): Promise<void> {
        return new Promise<void>((resolve, reject) => {
            try {
                const query = 'UPDATE carts SET total = total+? WHERE id = ?';
                db.run(query, [price, cartId], function (err) {
                    if (err)
                        reject(err)
                    else
                        resolve()
                });
            } catch (error) {
                reject(error);
            }
        });
    }

    //API 3
    checkQuantity(cartId: number): Promise<number[]> {
        return new Promise<number[]>((resolve, reject) => {
            try {
                const query = `SELECT products.quantity AS quantityInStock,
                                      products_in_carts. quantity AS quantityInCart
                                FROM products
                                JOIN products_in_carts
                                WHERE products.model = products_in_carts.product_model
                                AND cart_id = ?`
                db.all(query, [cartId], (err: Error | null, rows: any[]) => {
                    if (err)
                        reject(err)

                    let p = [];
                    for (let i = 0; i < rows.length; i++) {
                        let row = rows[i];
                        let qs = row.quantityInStock;
                        let qc = row.quantityInCart;
                        if (qs === 0)
                            reject(new EmptyProductStockError())
                        else if (qs < qc)
                            reject(new LowProductStockError());
                        p[i] = qs - qc;
                    }
                    resolve(p)
                });
            } catch (error) {
                reject(error)
            }
        });
    }

    setAsPaid(cartId: number): Promise<void> {
        return new Promise<void>((resolve, reject) => {
            try {
                const date = dayjs().format('YYYY-MM-DD').toString();
                const query = `UPDATE carts
                               SET paid = true, payment_date = ?
                               WHERE id=?`;
                db.run(query, [date, cartId], function (err) {
                    if (err)
                        reject(err)
                    else
                        resolve()
                });
            } catch (error) {
                reject(error)
            }
        });
    }
}

export default CartDAO