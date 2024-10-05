import db from "../db/db"
import { Product } from "../components/product"
import { EmptyProductStockError, EmptyProductStockForCategoryError, ProductNotFoundError } from "../errors/productError"
/**
 * A class that implements the interaction with the database for all product-related operations.
 * You are free to implement any method you need here, as long as the requirements are satisfied.
 */
class ProductDAO {
    deleteProductsByModel(model: string): Promise<Boolean> {
        return new Promise<Boolean>((resolve, reject) => {
            const sql = 'DELETE FROM products where model=?';
            db.run(sql, [model], (err) => {
                if (err) {
                    reject(err);
                } else {
                    resolve(true);
                }
            });
        });
    }

    deleteAllProducts(): Promise<Boolean> {
        return new Promise<Boolean>((resolve, reject) => {
            const sql = 'DELETE FROM products'
            db.run(sql, [], (err) => {
                if (err) {
                    reject(err);
                } else {
                    resolve(true);
                }
            });
        });
    }

    sellProduct(model: string, newQuantity: number): Promise<number> {
        return new Promise<number>((resolve, reject) => {
            try {
                const sql = "UPDATE products SET quantity=? where model=?"
                db.run(sql, [newQuantity, model], (err: Error | null) => {
                    if (err) {
                        reject(err)
                    }
                    resolve(newQuantity);
                })
            } catch (error) {
                reject(error)
            }
        });
    }

    getAvaliableProductsByCategory(category: string): Promise<Product[]> {
        return new Promise<Product[]>((resolve, reject) => {
            try {
                const sql = "SELECT * FROM products where category=?";
                db.all(sql, [category], (err: Error | null, rows: any[]) => {
                    if (err) {
                        reject(err);
                        return;
                    }
                    if (rows.length == 0)
                        resolve([]);

                    const products: Product[] = rows.filter(row => row.quantity > 0).map(row => new Product(row.selling_price, row.model, row.category, row.arrival_date, row.details, row.quantity));
                    resolve(products);
                });
            } catch (error) {
                reject(error);
            }
        });
    }

    getAvaliableProductsByModel(model: string): Promise<Product[]> {
        return new Promise<Product[]>((resolve, reject) => {
            try {
                const sql = "SELECT * FROM products where model=?";
                db.all(sql, [model], (err: Error | null, rows: any[]) => {
                    if (err) {
                        reject(err);
                        return;
                    }
                    if (rows.length == 0)
                        reject(new ProductNotFoundError())

                    const products: Product[] = rows.filter(row => row.quantity > 0).map(row => new Product(row.selling_price, row.model, row.category, row.arrival_date, row.details, row.quantity));
                    resolve(products);
                });
            } catch (error) {
                reject(error);
            }
        });
    }

    getAllAvaliableProducts(): Promise<Product[]> {
        return new Promise<Product[]>((resolve, reject) => {
            try {
                const sql = "SELECT * FROM products where quantity>0";
                db.all(sql, (err: Error | null, rows: any[]) => {
                    if (err) {
                        reject(err);
                        return;
                    }
                    if (rows.length == 0)
                        resolve([]);

                    const products: Product[] = rows.map(row => new Product(row.selling_price, row.model, row.category, row.arrival_date, row.details, row.quantity));
                    resolve(products);
                });
            } catch (error) {
                reject(error);
            }
        });
    }
    getProductsByCategory(category: string): Promise<Product[]> {
        return new Promise<Product[]>((resolve, reject) => {
            try {
                const sql = "SELECT * FROM products where category=?";
                db.all(sql, [category], (err: Error | null, rows: any[]) => {
                    if (err) {
                        reject(err);
                        return;
                    }
                    if (rows.length == 0)
                        resolve([]);

                    const products: Product[] = rows.map(row => new Product(row.selling_price, row.model, row.category, row.arrival_date, row.details, row.quantity));
                    resolve(products);
                });
            } catch (error) {
                reject(error);
            }
        });
    }

    getProductsByModel(model: string): Promise<Product[]> {
        return new Promise<Product[]>((resolve, reject) => {
            try {
                const sql = "SELECT * FROM products where model=?";
                db.all(sql, [model], (err: Error | null, rows: any[]) => {
                    if (err) {
                        reject(err);
                        return;
                    }
                    if (rows.length == 0)
                        reject(new ProductNotFoundError())

                    const products: Product[] = rows.map(row => new Product(row.selling_price, row.model, row.category, row.arrival_date, row.details, row.quantity));
                    resolve(products);
                });
            } catch (error) {
                reject(error);
            }
        });
    }

    getAllProducts(): Promise<Product[]> {
        return new Promise<Product[]>((resolve, reject) => {
            try {
                const sql = "SELECT * FROM products";
                db.all(sql, (err: Error | null, rows: any[]) => {
                    if (err) {
                        reject(err);
                        return;
                    }
                    if (rows.length == 0)
                        resolve([]);

                    const products: Product[] = rows.map(row => new Product(row.selling_price, row.model, row.category, row.arrival_date, row.details, row.quantity));
                    resolve(products);
                });
            } catch (error) {
                reject(error);
            }
        });
    }

    updateProductQuantity(model: string, newQuantity: number): Promise<number> {
        return new Promise<number>((resolve, reject) => {
            try {
                const sql = "UPDATE products SET quantity=? where model=?"
                db.run(sql, [newQuantity, model], (err: Error | null) => {
                    if (err) {
                        reject(err)
                    }
                    resolve(newQuantity);
                })
            } catch (error) {
                reject(error)
            }
        });
    }

    getProductByModel(model: String | null): Promise<Product | null> {
        return new Promise<Product | null>((resolve, reject) => {
            try {
                const sql = "SELECT * FROM products WHERE model = ?"
                db.get(sql, [model], (err: Error | null, row: any) => {
                    if (err) {
                        reject(err)
                        return
                    }
                    //returns null to signal that product doesn't exist
                    const p: Product = row ? new Product(row.selling_price, row.model, row.category, row.arrival_date, row.details, row.quantity) : null;
                    resolve(p);
                    return;
                })
            } catch (error) {
                reject(error);
                return;
            }
        });
    }

    registerProduct(model: string, category: string, quantity: number, details: string, sellingPrice: number, arrivalDate: string): Promise<void> {
        return new Promise<void>((resolve, reject) => {
            try {
                const sql = "INSERT into products(selling_price, model, category, arrival_date, details, quantity) values(?,?,?,?,?,?)"
                db.run(sql, [sellingPrice, model, category, arrivalDate, details, quantity], (err: Error | null) => {
                    if (err) {
                        reject(err)
                    }
                    resolve()
                });
            } catch (error) {
                reject(error);
            }
        });
    }
}

export default ProductDAO