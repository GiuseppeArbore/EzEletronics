import ProductDAO from "../dao/productDAO";
import { EmptyProductStockError, LowProductStockError, ProductAlreadyExistsError, ProductNotFoundError, ProposedDateTooEarlyError } from "../errors/productError"
import { Product } from "../components/product";
const moment = require("moment");

/**
 * Represents a controller for managing products.
 * All methods of this class must interact with the corresponding DAO class to retrieve or store data.
 */
class ProductController {
    private dao: ProductDAO

    constructor() {
        this.dao = new ProductDAO
    }

    /**
     * Registers a new product concept (model, with quantity defining the number of units available) in the database.
     * @param model The unique model of the product.
     * @param category The category of the product.
     * @param quantity The number of units of the new product.
     * @param details The optional details of the product.
     * @param sellingPrice The price at which one unit of the product is sold.
     * @param arrivalDate The optional date in which the product arrived.
     * @returns A Promise that resolves to nothing.
     */
    async registerProducts(model: string, category: string, quantity: number, details: string | null, sellingPrice: number, arrivalDate: string | null): Promise<void> {
        try {
            const product = await this.dao.getProductByModel(model);
            if (product) {
                //Model already present, reject promise with error
                return Promise.reject(new ProductAlreadyExistsError());
            } else {
                //save new product and resolve promise
                await this.dao.registerProduct(model, category, quantity, details, sellingPrice, arrivalDate);
                Promise.resolve();
            }
        } catch (err) {
            //reject promise with generic error
            return Promise.reject(err);
        }
    }

    /**
     * Increases the available quantity of a product through the addition of new units.
     * @param model The model of the product to increase.
     * @param newQuantity The number of product units to add. This number must be added to the existing quantity, it is not a new total.
     * @param changeDate The optional date in which the change occurred.
     * @returns A Promise that resolves to the new available quantity of the product.
     */
    async changeProductQuantity(model: string, newQuantity: number, changeDate: string | null): Promise<number> {
        try {
            const product = await this.dao.getProductByModel(model);
            if (product != null) {
                //perform additional checks, on changeDate
                if (moment(product.arrivalDate).isAfter(moment(changeDate)))
                    return Promise.reject(new ProposedDateTooEarlyError());
                else {
                    const updatedQuantity = await this.dao.updateProductQuantity(model, product.quantity + newQuantity);
                    return Promise.resolve(updatedQuantity);
                }
            } else {
                return Promise.reject(new ProductNotFoundError());
            }
        } catch (err) {
            return Promise.reject(err);
        }
    }

    /**
     * Decreases the available quantity of a product through the sale of units.
     * @param model The model of the product to sell
     * @param quantity The number of product units that were sold.
     * @param sellingDate The optional date in which the sale occurred.
     * @returns A Promise that resolves to the new available quantity of the product.
     */
    async sellProduct(model: string, quantity: number, sellingDate: string | null): Promise<number> { 
        try {
            const product = await this.dao.getProductByModel(model);

            if(product == null)
                return Promise.reject(new ProductNotFoundError());
            else if(moment(product.arrivalDate).isAfter(moment(sellingDate)))
                return Promise.reject(new ProposedDateTooEarlyError() );
            else if(product.quantity == 0)
                return Promise.reject(new EmptyProductStockError());
            else if(product.quantity < quantity)
                return Promise.reject(new LowProductStockError());

            else return this.dao.sellProduct(model, product.quantity-quantity)
                .then(newQuantity => Promise.resolve(newQuantity))
                .catch(err => Promise.reject(err))

        } catch(err) {
            return Promise.reject(err);
        }
    }

    /**
     * Returns all products in the database, with the option to filter them by category or model.
     * @param grouping An optional parameter. If present, it can be either "category" or "model".
     * @param category An optional parameter. It can only be present if grouping is equal to "category" (in which case it must be present) and, when present, it must be one of "Smartphone", "Laptop", "Appliance".
     * @param model An optional parameter. It can only be present if grouping is equal to "model" (in which case it must be present and not empty).
     * @returns A Promise that resolves to an array of Product objects.
     */
    async getProducts(grouping: string | null, category: string | null, model: string | null): Promise<Product[]> {
        if (grouping == null) {
            return this.dao.getAllProducts()
                .then(res => Promise.resolve(res))
                .catch(err => Promise.reject(err));
        }

        if (model != null) {
            return this.dao.getProductsByModel(model)
                .then(res => Promise.resolve(res))
                .catch(err => Promise.reject(err));
        }

        return this.dao.getProductsByCategory(category)
            .then(res => Promise.resolve(res))
            .catch(err => Promise.reject(err));
    }

    /**
     * Returns all available products (with a quantity above 0) in the database, with the option to filter them by category or model.
     * @param grouping An optional parameter. If present, it can be either "category" or "model".
     * @param category An optional parameter. It can only be present if grouping is equal to "category" (in which case it must be present) and, when present, it must be one of "Smartphone", "Laptop", "Appliance".
     * @param model An optional parameter. It can only be present if grouping is equal to "model" (in which case it must be present and not empty).
     * @returns A Promise that resolves to an array of Product objects.
     */
    async getAvailableProducts(grouping: string | null, category: string | null, model: string | null): Promise<Product[]> {
        if (grouping == null) {
            return this.dao.getAllAvaliableProducts()
                .then(res => Promise.resolve(res))
                .catch(err => Promise.reject(err));
        }

        if (model != null) {
            return this.dao.getAvaliableProductsByModel(model)
                .then(res => Promise.resolve(res))
                .catch(err => Promise.reject(err));
        }

        return this.dao.getAvaliableProductsByCategory(category)
            .then(res => Promise.resolve(res))
            .catch(err => Promise.reject(err));
    }

    /**
     * Deletes all products.
     * @returns A Promise that resolves to `true` if all products have been successfully deleted.
     */
    async deleteAllProducts(): Promise <Boolean> {
        return this.dao.deleteAllProducts()
            .then( _ => Promise.resolve(true))
            .catch(err => Promise.reject(err)) 
    }


    /**
     * Deletes one product, identified by its model
     * @param model The model of the product to delete
     * @returns A Promise that resolves to `true` if the product has been successfully deleted.
     */
    async deleteProduct(model: string): Promise <Boolean> {
        try {
            const product = await this.dao.getProductByModel(model);
            if(product == null)
                return Promise.reject(new ProductNotFoundError());

            else {
                return this.dao.deleteProductsByModel(model)
                .then( _ => Promise.resolve(true))
                .catch(err => Promise.reject(err)) 
            }
        } catch(err) {
            return Promise.reject(err);
        }
     }
}

export default ProductController;