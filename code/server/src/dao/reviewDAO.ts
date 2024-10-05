import { NoReviewProductError } from "../errors/reviewError";
import { ProductReview } from "../components/review";
import { User } from "../components/user";
import db from "../db/db"
import dayjs from 'dayjs'


/**
 * A class that implements the interaction with the database for all review-related operations.
 * You are free to implement any method you need here, as long as the requirements are satisfied.
 */





class ReviewDAO {

    /**
     *  Adds a new review for a product and saves their information in the database
     *  @param model The model of the product to review
     *  @param user The username of the user who made the review
     *  @param score The score assign to the product
     *  @param comment The comment made by user
    */

    addReview(model: string, username:string, score:number, comment:string): Promise<boolean>{
        return new Promise<boolean>((resolve,reject)=>{
            try{
                const dateR = dayjs().format('YYYY-MM-DD').toString();
                const sql = "INSERT INTO reviews(model,user,score,review_date,comment) VALUES (?,?,?,?,?)";
                db.run(sql,[model,username,score,dateR,comment], (err: Error | null) => {
                    if(err){
                       reject(err); 
                       return;
                    }
                    resolve(true);
                    return;
                })  
            }
            catch (error) {
                reject(error);
                return;
            }
        })
    }

    isProductExist(model: String): Promise<Boolean> {
        return new Promise<Boolean>((resolve, reject) => {
            try {
                const sql = "SELECT * FROM products WHERE model = ?"
                db.get(sql, [model], (err: Error | null, row: any) => {
                    if (err) {
                        reject(err);
                        return;
                    }
                    if (!row) {
                        resolve(false);
                        return;
                    }
                    resolve(true);
                    return;
                })
            } catch (error) {
                reject(error);
                return;
            }
        })
    }

    isProductReviewed(model: string, username: string): Promise<number | null >{ //modifica (da string a number)
        return new Promise<number | null>((resolve,reject)=>{
            try{
                const query = "SELECT * FROM reviews WHERE model=? AND user=?";
                db.get(query,[model,username],(err: Error | null, row: any) =>{ 
                    if(err){
                        reject(err);
                        return;
                    }
                    //user hasn't review this product
                    if(!row){
                        resolve(null);
                        return;
                    }
                    resolve(row.id);
                })
            }
            catch(error){
                reject(error);
                return;
            }
        })
    }  

    deleteReview(idReview: number): Promise<boolean>{ 
        return new Promise<boolean>((resolve,reject)=>{
            try{
                const sql = "DELETE FROM reviews WHERE id = ?";
                db.run(sql,[idReview],(err: Error | null) =>{ //modifica (eliminato parametro row perchè non esite)
                    if(err){
                        reject(err);
                        return;
                    }
                    resolve(true);
                    return;
                })
            }
            catch(error){
                reject(error);
                return;

            }
        })
    }

    deleteReviewsOfProduct(model:string){
        return new Promise<boolean>((resolve,reject)=>{
            try{
                const sql = "DELETE FROM reviews WHERE model = ?";
                db.run(sql,[model],(err: Error | null) =>{ //modifica (eliminato parametro row perchè non esite)
                    if(err){
                        reject(err);
                        return;
                    }
                    resolve(true);
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
export default ReviewDAO;