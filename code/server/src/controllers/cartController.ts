import { User } from "../components/user";
import CartDAO from "../dao/cartDAO";
import ProductDAO from "../dao/productDAO";
import { Cart } from "../components/cart";
import { EmptyProductStockError, ProductNotFoundError } from "../errors/productError";
import { CartNotFoundError, EmptyCartError, ProductNotInCartError } from "../errors/cartError";

/**
 * Represents a controller for managing shopping carts.
 * All methods of this class must interact with the corresponding DAO class to retrieve or store data.
 */
class CartController {
    private dao: CartDAO
    private daoProd: ProductDAO

    constructor() {
        this.dao = new CartDAO
        this.daoProd = new ProductDAO
    }

    /**
     * Adds a product to the user's cart. If the product is already in the cart, the quantity should be increased by 1.
     * If the product is not in the cart, it should be added with a quantity of 1.
     * If there is no current unpaid cart in the database, then a new cart should be created.
     * @param user - The user to whom the product should be added.
     * @param productId - The model of the product to add.
     * @returns A Promise that resolves to `true` if the product was successfully added.
     */

    async addToCart(user: User, product: string): Promise<Boolean> {
        try{
            const prod = await this.daoProd.getProductByModel(product);
            if(!prod)
                return Promise.reject(new ProductNotFoundError());  //404 prodotto non esiste
                                                                                     
            if(prod.quantity===0)
                return Promise.reject(new EmptyProductStockError()); //409 prodotto esiste ma non è disponibile

            let cartId = await this.dao.getCartId(user.username, false);
            let b = true;
            if(cartId===null){//carrello corrente NON esiste
                await this.dao.newCart(user.username);
                cartId = await this.dao.getCartId(user.username, false);
                b = false;                                                  
            }
            else{
                const quantInCart = await this.dao.alreadyInCart(cartId, product);
                if(quantInCart===null) //carrello corrente esiste ma non ha il prodotto
                    b = false;
            }
            await this.dao.addToCart(product, cartId, b);
            await this.dao.updateTotal(cartId, prod.sellingPrice);
            return Promise.resolve(true);
        }catch(err){
            return Promise.reject(err);
        }
    }

    /**
     * Retrieves the current cart for a specific user.
     * @param user - The user for whom to retrieve the cart.
     * @returns A Promise that resolves to the user's cart or an empty one if there is no current cart.
     */
    async getCart(user: User): Promise<Cart> {
        try{
            let cart = await this.dao.getCart(user.username);
            if(cart.total!==0){
                const cartId = await this.dao.getCartId(user.username, false);
                cart.products = await this.dao.getProductsInCart(cartId);
            }
            return Promise.resolve(cart);
        }catch(err){
            return Promise.reject(err);
        }
    }

    /**
     * Checks out the user's cart. We assume that payment is always successful, there is no need to implement anything related to payment.
     * @param user - The user whose cart should be checked out.
     * @returns A Promise that resolves to `true` if the cart was successfully checked out.
     * 
     */
    async checkoutCart(user: User): Promise<Boolean> {
        try{
            //controllo sui carrelli
            const cartId = await this.dao.getCartId(user.username, false);
            if(!cartId)
                return Promise.reject(new CartNotFoundError());
            
            let cart = await this.dao.getCart(user.username);
            if(cart.total===0){
                return Promise.reject(new EmptyCartError()); //400
            }
            cart.products = await this.dao.getProductsInCart(cartId); //ottengo i prodotti in ordine temporale di inserimento nel carrello
            const newQuantity: number[] = await this.dao.checkQuantity(cartId); //quantità da aggiornare nello stock dopo il checkout
            if(newQuantity){
                for(let i=0; i<cart.products.length; i++)
                    this.daoProd.updateProductQuantity(cart.products[i].model, newQuantity[i]);
                await this.dao.setAsPaid(cartId); 
                return Promise.resolve(true);  
            }
        } catch(err){
            return Promise.reject(err);
        } 
    }

    /**
     * Retrieves all paid carts for a specific customer.
     * @param user - The customer for whom to retrieve the carts.
     * @returns A Promise that resolves to an array of carts belonging to the customer.
     * Only the carts that have been checked out should be returned, the current cart should not be included in the result.
     */
    async getCustomerCarts(user: User): Promise<Cart[]> {
        try{
            let cart: Cart[] = await this.dao.getCostumerCarts(user.username); //vettore di carrelli OK
            const cartId: number[] = await this.dao.getCartsIds(user.username, true); //cartId è un vettore di id (più carrelli)
                for(let i=0; i<cart.length; i++){
                    cart[i].products = await this.dao.getProductsInCart(cartId[i]);
                }              
            return Promise.resolve(cart);
        }catch(error){
            return Promise.reject(error)
        } 
    } 

    /**
     * Removes one product unit from the current cart. In case there is more than one unit in the cart, only one should be removed.
     * @param user The user who owns the cart.
     * @param product The model of the product to remove.
     * @returns A Promise that resolves to `true` if the product was successfully removed.
     */
    async removeProductFromCart(user: User, product: string): Promise<Boolean>{
        try{
            let price = await this.dao.productExists(product);
            price = -price;
            if(!price)                                              //1 cotrollo se prodotto esiste
                return Promise.reject(new ProductNotFoundError());  //404 (prodotto non esiste)

            const cartId = await this.dao.getCartId(user.username, false);
            if(!cartId)                                             //2 controllo che il carrello corrente esista
                return Promise.reject(new CartNotFoundError());     //404 (carrello non esiste)

            const total = await this.dao.cartIsEmpty(cartId);
            if(total)                                              //2 controllo che il carrello corrente non sia vuoto
                return Promise.reject(new CartNotFoundError());        //404 (carrello vuoto)
        
            const quantity = await this.dao.alreadyInCart(cartId, product);
            if(!quantity || quantity===0)                           //3 controllo se il prodotto è già nel carrello
                return Promise.reject(new ProductNotInCartError()); //404 (prodotto NON E' NEL CARRELLO)

            //prodotto esiste ed è in un carrello corrente esistente
            await this.dao.removeProductFromCart(cartId, product, quantity); //se quantity=1 --> cancella il record, se quantity>1 decrementa il campo del record
            await this.dao.updateTotal(cartId, price);

                return Promise.resolve(true);
        }catch(error){
            return Promise.reject(error);
        }
    }


    /**
     * Removes all products from the current cart.
     * @param user - The user who owns the cart.
     * @returns A Promise that resolves to `true` if the cart was successfully cleared.
     */
    async clearCart(user: User):Promise<Boolean> {
        try{
            const cartId = await this.dao.getCartId(user.username, false);
            await this.dao.delProdsFromCart(cartId);
            return this.dao.clearCart(cartId);
        }catch(error){
            return Promise.reject(error);
        }
    }

    /**
     * Deletes all carts of all users.
     * @returns A Promise that resolves to `true` if all carts were successfully deleted.
     */
    async deleteAllCarts():Promise<Boolean> {
        try{
            return this.dao.deleteAllCarts();
        }catch(error){
            return Promise.reject(error);
        }
    }

    /**
     * Retrieves all carts in the database.
     * @returns A Promise that resolves to an array of carts.
     */
    async getAllCarts():Promise<Cart[]>{
        try{
            let carts: Cart[] = await this.dao.getAllCarts();
            const cartId = await this.dao.getAllCartsIds();
            for(let i=0; i<carts.length; i++){
                if(carts[i].total > 0)
                    carts[i].products = await this.dao.getProductsInCart(cartId[i]);
            }
            return Promise.resolve(carts);
        }catch(error){
            return Promise.reject(error);
        }       
    }
}

export default CartController