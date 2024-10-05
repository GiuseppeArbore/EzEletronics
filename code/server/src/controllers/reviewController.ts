import { User } from "../components/user";
import { ProductReview } from "../components/review";
import ReviewDAO from "../dao/reviewDAO";
import db from "../db/db";
import { ExistingReviewError, NoReviewProductError } from "../errors/reviewError";
import { ProductNotFoundError } from "../errors/productError";
import dayjs from "dayjs";

class ReviewController {
    private dao: ReviewDAO

    constructor() {
        this.dao = new ReviewDAO
    }

    /**
     * Adds a new review for a product
     *  @param model The model of the product to review. It must not be null and the product must exist
     *  @param user The username of the user who made the review. The user must exist
     *  @param score The score assign to the product. The score can't be null and in the range [1, 5]
     *  @param comment The comment made by user.  The comment cant' be null
     * @returns A Promise that resolves to nothing
     */
    async addReview(model: string, user: User, score: number, comment: string): Promise<void> { 
        const isProductExist = await this.dao.isProductExist(model);
        if(isProductExist){
            const isProductReviewed = await this.dao.isProductReviewed(model, user.username);
            if(isProductReviewed === null){
                await this.dao.addReview(model, user.username, score, comment);
                Promise.resolve();
            }
            else{
                return Promise.reject(new ExistingReviewError);
            }
        }
        else{
            return Promise.reject(new ProductNotFoundError);
        }
    }

    /**
     * Returns all reviews for a product
     * @param model The model of the product to get reviews from
     * @returns A Promise that resolves to an array of ProductReview objects
     */
    async getProductReviews(model: string): Promise<ProductReview[]> {
        if(! await this.dao.isProductExist(model)) return Promise.reject(new NoReviewProductError);
        return new Promise<ProductReview[]>((resolve,reject)=>{
            try{
                const query = " SELECT * FROM reviews WHERE model = ?" 
                db.all(query,[model],(err: Error, rows: any[]) => {
                    if(err){
                        reject(err);
                    }else{
                        const rev: ProductReview[] = rows.map(row => new ProductReview(row.model, row.user, row.score, dayjs(row.date).format('YYYY-MM-DD'), row.comment));
                        resolve(rev);
                    }
                })
            }
            catch (error) {
                reject(error);
            }
        })
     }

    /**
     * Deletes the review made by a user for a product
     * @param model The model of the product to delete the review from
     * @param user The user who made the review to delete
     * @returns A Promise that resolves to nothing
     */

    async deleteReview(model: string, user: User): Promise<void> { 
        const isProductExist = await this.dao.isProductExist(model);
        if(isProductExist){
            const idReview = await this.dao.isProductReviewed(model, user.username);
            if(idReview !== null){
                await this.dao.deleteReview(idReview);
                Promise.resolve();
            }
            else{
                return Promise.reject(new NoReviewProductError);
            }
        }
        else{
            return Promise.reject(new ProductNotFoundError);
        }
    }

    /**
     * Deletes all reviews for a product
     * @param model The model of the product to delete the reviews from
     * @returns A Promise that resolves to nothing
     */
    async deleteReviewsOfProduct(model: string): Promise<void> {
        const isProductExist = await this.dao.isProductExist(model);
        if(isProductExist){
            await this.dao.deleteReviewsOfProduct(model);
            Promise.resolve();
        }
        else{
            return Promise.reject(new ProductNotFoundError);
        }
    }

    /**
     * Deletes all reviews of all products
     * @returns A Promise that resolves to nothing
     */
    async deleteAllReviews():Promise<void> { 
        return new Promise<void>((resolve,reject)=>{
            try{
                const sql = "DELETE FROM reviews";
                db.run(sql,[], (err: Error) =>{ //modifica (eliminato parametro row perchè inesistente + aggiunte [])
                    if(err){
                        reject(err);
                        return;
                    }
                    resolve();
                    return;
                })
            }
            catch(error){
                reject(error);
                return;
            }
        })       
    }
}

export default ReviewController;