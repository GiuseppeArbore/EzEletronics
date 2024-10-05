import {jest, test, expect, afterEach, describe } from "@jest/globals";
import { Database } from "sqlite3";
import db from "../../src/db/db"
import ReviewDAO from "../../src/dao/reviewDAO";
import dayjs from "dayjs";

jest.mock('sqlite3');
jest.setTimeout(100000);

const dao = new ReviewDAO();

afterEach(() => {
    jest.clearAllMocks();
});

describe("addReview (dao)", () => {

        const model = "test"
        const user =  "test"
        const score = 5
        const comment = "test"

    test("aggiunge una review a un prodotto, restituisce true", async () => {
           
        const dbRunMock = jest.spyOn(db, "run").mockImplementation((sql, params, callback) => {
            callback(null);
            return {} as Database;
        });

        await expect(dao.addReview(model, user, score, comment)).resolves.toBe(true);
       
        expect(dbRunMock).toHaveBeenCalledTimes(1); //verifico che db.run viene chiamato una volta

        expect(dbRunMock).toBeCalledWith("INSERT INTO reviews(model,user,score,review_date,comment) VALUES (?,?,?,?,?)",
        [model, user, score, dayjs().format('YYYY-MM-DD').toString(), comment],
        expect.any(Function));
    });

    test("errore nel database", async () => {
        
        const mockError = new Error('DB test error');

        const dbRunMock = jest.spyOn(db, "run").mockImplementation((sql, params, callback) => {
            callback(mockError); //QUESTO E' L'UNICO VERO CAMBIAMENTO
            return {} as Database;
        });

        await expect(dao.addReview(model, user, score, comment)).rejects.toThrow(mockError); //CAMBIAMENTO
    
        expect(dbRunMock).toHaveBeenCalledTimes(1);

        expect(dbRunMock).toBeCalledWith("INSERT INTO reviews(model,user,score,review_date,comment) VALUES (?,?,?,?,?)",
        [model, user, score, dayjs().format('YYYY-MM-DD').toString(), comment],
        expect.any(Function));
    });

    test("gestione eccezione nel blocco try", async () => {

        const mockError = "Unexpected error";

        const dbRunMock = jest.spyOn(db, "run").mockImplementation(() => {
            throw new Error(mockError); //QUESTO E' L'UNICO VERO CAMBIAMENTO
        });

        await expect(dao.addReview(model, user, score, comment)).rejects.toThrow(mockError); 
    
        expect(dbRunMock).toHaveBeenCalledTimes(1);

        expect(dbRunMock).toBeCalledWith("INSERT INTO reviews(model,user,score,review_date,comment) VALUES (?,?,?,?,?)",
        [model, user, score, dayjs().format('YYYY-MM-DD').toString(), comment],
        expect.any(Function));
    });
});

describe("isProductExist (dao)", () => {
    
    const testModel = "test";

    test("verifica se un prodotto esiste, ritorna true", async () => {

        const mockRow = { id: 1, selling_price: 99.99, model: 'test', category: 'SMARTPHONE', arrival_date: '2024-05-08', details: '...', quantity: 5 };

        const dbGetMock = jest.spyOn(db, "get").mockImplementation((sql, params, callback) => {
            callback(null, mockRow);
            return {} as Database;
        });

        await expect(dao.isProductExist(testModel)).resolves.toBe(true);
       
        expect(dbGetMock).toHaveBeenCalledTimes(1); //verifico che db.get viene chiamato una volta

        expect(dbGetMock).toBeCalledWith("SELECT * FROM products WHERE model = ?",
        [testModel],
        expect.any(Function));
    });

    test("verifica se un prodotto esiste, ritorna false", async () => {

        const dbGetMock = jest.spyOn(db, "get").mockImplementation((sql, params, callback) => {
            callback(null, null);
            return {} as Database;
        });

        await expect(dao.isProductExist(testModel)).resolves.toBe(false);
       
        expect(dbGetMock).toHaveBeenCalledTimes(1); //verifico che db.get viene chiamato una volta

        expect(dbGetMock).toBeCalledWith("SELECT * FROM products WHERE model = ?",
        [testModel],
        expect.any(Function));
    });

    test("errore nel database", async () => {

        const mockError = "Database error"

        const dbGetMock = jest.spyOn(db, "get").mockImplementation((sql, params, callback) => {
            callback(new Error(mockError), null);
            return {} as Database;
        });

        await expect(dao.isProductExist(testModel)).rejects.toThrow(mockError);
       
        expect(dbGetMock).toHaveBeenCalledTimes(1);

        expect(dbGetMock).toBeCalledWith("SELECT * FROM products WHERE model = ?",
        [testModel],
        expect.any(Function));
    });

    test("gestione eccezione nel blocco try", async () => {

        const mockError = "Unexpected error"

        const dbGetMock = jest.spyOn(db, "get").mockImplementation((sql, params, callback) => {
            throw new Error(mockError);
        });

        await expect(dao.isProductExist(testModel)).rejects.toThrow(mockError);
       
        expect(dbGetMock).toHaveBeenCalledTimes(1); 

        expect(dbGetMock).toBeCalledWith("SELECT * FROM products WHERE model = ?",
        [testModel],
        expect.any(Function));
    });
})

describe("isProductReviewed (dao)", () => {

    const testModel = "test";
    const testUser = "test";

    test("il prodotto non ha già una review, ritorna null", async () => {

        const dbGetMock = jest.spyOn(db, "get").mockImplementation((sql, params, callback) => {
            callback(null, null);
            return {} as Database;
        });

        await expect(dao.isProductReviewed(testModel, testUser)).resolves.toBe(null);

        expect(dbGetMock).toHaveBeenCalledTimes(1); 

        expect(dbGetMock).toBeCalledWith("SELECT * FROM reviews WHERE model=? AND user=?",
        [testModel, testUser],
        expect.any(Function));
    });

    test("il prodotto ha già una review, ritorna l'id della review", async () => {
        const mockRow = { id: 1, model: 'test', user: 'test', score: 5, review_date: '2024-05-08', comment: "cool"};

        const dbGetMock = jest.spyOn(db, "get").mockImplementation((sql, params, callback) => {
            callback(null, mockRow);
            return {} as Database;
        });

        await expect(dao.isProductReviewed(testModel, testUser)).resolves.toBe(1);

        expect(dbGetMock).toHaveBeenCalledTimes(1); 

        expect(dbGetMock).toBeCalledWith("SELECT * FROM reviews WHERE model=? AND user=?",
        [testModel, testUser],
        expect.any(Function));
    });

    test("errore nel database", async () => {

        const mockError = "Database error"

        const dbGetMock = jest.spyOn(db, "get").mockImplementation((sql, params, callback) => {
            callback(new Error(mockError), null);
            return {} as Database;
        });

        await expect(dao.isProductReviewed(testModel, testUser)).rejects.toThrow(mockError);
       
        expect(dbGetMock).toHaveBeenCalledTimes(1);

        expect(dbGetMock).toBeCalledWith("SELECT * FROM reviews WHERE model=? AND user=?",
        [testModel, testUser],
        expect.any(Function));
    });

    test("gestione eccezione nel blocco try", async () => {

        const mockError = "Unexpected error"

        const dbGetMock = jest.spyOn(db, "get").mockImplementation((sql, params, callback) => {
            throw new Error(mockError);
        });

        await expect(dao.isProductReviewed(testModel, testUser)).rejects.toThrow(mockError);
       
        expect(dbGetMock).toHaveBeenCalledTimes(1); 

        expect(dbGetMock).toBeCalledWith("SELECT * FROM reviews WHERE model=? AND user=?",
        [testModel, testUser],
        expect.any(Function));
    });
});

describe("deleteReview (dao)", () => {
    //NOTA: NON TESTO IL CASO IN CUI NON CI SIA "MATCH" NEL DB perchè se ci viene passato l'id della review vuol dire che esiste per forza
    //infatti l'id della review si ottiene da isProductReviewd che in caso di "mancata corrispondenza" col db, ritorna null
    const testRewId = 1;

    test("elimina una review di un prodotto, ritorna true ", async() => {

        const dbRunMock = jest.spyOn(db, "run").mockImplementation((sql, params, callback) => {
            callback(null);
            return {} as Database;
        });

        await expect(dao.deleteReview(testRewId)).resolves.toBe(true);
       
        expect(dbRunMock).toHaveBeenCalledTimes(1); 

        expect(dbRunMock).toBeCalledWith("DELETE FROM reviews WHERE id = ?",
        [testRewId],
        expect.any(Function));
    });

    test("errore nel database", async () => {
        
        const mockError = new Error('DB test error');

        const dbRunMock = jest.spyOn(db, "run").mockImplementation((sql, params, callback) => {
            callback(mockError);
            return {} as Database;
        });

        await expect(dao.deleteReview(testRewId)).rejects.toThrow(mockError); 
    
        expect(dbRunMock).toHaveBeenCalledTimes(1);

        expect(dbRunMock).toBeCalledWith("DELETE FROM reviews WHERE id = ?",
        [testRewId],
        expect.any(Function));
    });

    test("gestione eccezione nel blocco try", async () => {

        const mockError = "Unexpected error";

        const dbRunMock = jest.spyOn(db, "run").mockImplementation(() => {
            throw new Error(mockError); 
        });

        await expect(dao.deleteReview(testRewId)).rejects.toThrow(mockError); 
    
        expect(dbRunMock).toHaveBeenCalledTimes(1);

        expect(dbRunMock).toBeCalledWith("DELETE FROM reviews WHERE id = ?",
        [testRewId],
        expect.any(Function));
    });
});

describe("deleteReviewsOfProduct (dao)", () => {
    const testModel = "test";

    test("elimina tutte le review di un prodotto, ritorna true ", async() => {

        const dbRunMock = jest.spyOn(db, "run").mockImplementation((sql, params, callback) => {
            callback(null);
            return {} as Database;
        });

        await expect(dao.deleteReviewsOfProduct(testModel)).resolves.toBe(true);
       
        expect(dbRunMock).toHaveBeenCalledTimes(1); 

        expect(dbRunMock).toBeCalledWith("DELETE FROM reviews WHERE model = ?",
        [testModel],
        expect.any(Function));
    });

    test("errore nel database", async () => {
        
        const mockError = new Error('DB test error');

        const dbRunMock = jest.spyOn(db, "run").mockImplementation((sql, params, callback) => {
            callback(mockError);
            return {} as Database;
        });

        await expect(dao.deleteReviewsOfProduct(testModel)).rejects.toThrow(mockError); 
    
        expect(dbRunMock).toHaveBeenCalledTimes(1);

        expect(dbRunMock).toBeCalledWith("DELETE FROM reviews WHERE model = ?",
        [testModel],
        expect.any(Function));
    });

    test("gestione eccezione nel blocco try", async () => {

        const mockError = "Unexpected error";

        const dbRunMock = jest.spyOn(db, "run").mockImplementation(() => {
            throw new Error(mockError); 
        });

        await expect(dao.deleteReviewsOfProduct(testModel)).rejects.toThrow(mockError); 
    
        expect(dbRunMock).toHaveBeenCalledTimes(1);

        expect(dbRunMock).toBeCalledWith("DELETE FROM reviews WHERE model = ?",
        [testModel],
        expect.any(Function));
    });
})
