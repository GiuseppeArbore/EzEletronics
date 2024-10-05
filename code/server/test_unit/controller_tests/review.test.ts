import {test, expect, jest, describe, afterEach} from "@jest/globals"
import ReviewController from "../../src/controllers/reviewController"
import ReviewDAO from "../../src/dao/reviewDAO"
import { Role } from "../../src/components/user"
import { ExistingReviewError, NoReviewProductError } from "../../src/errors/reviewError"
import { ProductNotFoundError } from "../../src/errors/productError"
import { Database } from "sqlite3"
import db from "../../src/db/db"
import { mock } from "node:test"
import dayjs from "dayjs"

jest.mock("../../src/dao/reviewDAO")
jest.mock('sqlite3');
jest.setTimeout(100000);

afterEach(() => {
    jest.clearAllMocks();
})
const controller = new ReviewController();

const testUser = { //Define a test user object
    username: "test",
    name: "test",
    surname: "test",
    password: "test",
    role: Role.CUSTOMER,
    address: "",
    birthdate: ""
}

describe("addReview (controller)", () => {
    test("aggiunge una review, ritorna void", async () => {

        const testReview = {
            model: "test",
            score: 5,
            comment: "test"
        };

        const spy1 = jest.spyOn(ReviewDAO.prototype, "isProductExist").mockResolvedValue(true);
        const spy2 = jest.spyOn(ReviewDAO.prototype, "isProductReviewed").mockResolvedValue(null);
        const spyAdd = jest.spyOn(ReviewDAO.prototype, "addReview").mockResolvedValue(true);

        const response = await controller.addReview(testReview.model, testUser, testReview.score, testReview.comment);

        expect(spy1).toHaveBeenCalledTimes(1);
        expect(spy1).toHaveBeenCalledWith(testReview.model);
        expect(spy2).toHaveBeenCalledTimes(1);
        expect(spy2).toHaveBeenCalledWith(testReview.model, testUser.username);

        expect(spyAdd).toHaveBeenCalledTimes(1);
        expect(spyAdd).toHaveBeenCalledWith(testReview.model, testUser.username, testReview.score, testReview.comment);
        expect(response).toBeUndefined(); //QUANDO UN METODO RESTITUISCE VOID, IN REALTA' STA RESTITUENDO UNDEFINED
    });

    test("aggiunge una review, restituisce errore (Existing Review)", async () => {

        // Crea un mock del DAO
        const mockedDAO = new ReviewDAO() as jest.Mocked<ReviewDAO>;
        mockedDAO.isProductExist.mockResolvedValue(true);
        mockedDAO.isProductReviewed.mockResolvedValue(1);

        // Crea un'istanza del controller utilizzando il mock del DAO
        controller['dao'] = mockedDAO;

        const testReview = {
            model: "test",
            score: 5,
            comment: "test"
        };

        await expect(controller.addReview(testReview.model, testUser, testReview.score, testReview.comment))
        .rejects.toThrow(ExistingReviewError);

        expect(mockedDAO.isProductExist).toHaveBeenCalledTimes(1);
        expect(mockedDAO.isProductExist).toHaveBeenCalledWith(testReview.model);
        expect(mockedDAO.isProductReviewed).toHaveBeenCalledTimes(1);
        expect(mockedDAO.isProductReviewed).toHaveBeenCalledWith(testReview.model, testUser.username);
    })

    test("aggiunge una review, restituisce errore (Product Not Found)", async () => {

        const mockedDAO = new ReviewDAO() as jest.Mocked<ReviewDAO>;
        mockedDAO.isProductExist.mockResolvedValue(false);
        mockedDAO.isProductReviewed.mockResolvedValue(1);

        controller['dao'] = mockedDAO;

        const testReview = {
            model: "test",
            score: 5,
            comment: "test"
        };

        await expect(controller.addReview(testReview.model, testUser, testReview.score, testReview.comment))
        .rejects.toThrow(ProductNotFoundError);

        expect(mockedDAO.isProductExist).toHaveBeenCalledTimes(1);
        expect(mockedDAO.isProductExist).toHaveBeenCalledWith(testReview.model);
        expect(mockedDAO.isProductReviewed).toHaveBeenCalledTimes(0);
    })
});

describe("getProductReviews (controller)", () => {
    const testModel = "test";

    test("restituisce un vettore di reviews di un dato prodotto", async () => {
        const mockedDAO = new ReviewDAO() as jest.Mocked<ReviewDAO>;
        mockedDAO.isProductExist.mockResolvedValue(true);
        controller['dao'] = mockedDAO;
        const mockRow = [{
             model: "test",
             user:  "test1",
             date: dayjs().format('YYYY-MM-DD'),
             score: 5,
             comment: "test1",
        },
        {
            model: "test",
            user:  "test2",
            date: dayjs().format('YYYY-MM-DD'),
            score: 5,
            comment: "test2",
       }];

        const dbGetMock = jest.spyOn(db, "all").mockImplementation((sql, params, callback) => {
            callback(null, mockRow);
            return {} as Database;
        });

        await expect(controller.getProductReviews(testModel)).resolves.toEqual(mockRow);
        expect(dbGetMock).toHaveBeenCalledTimes(1);
        expect(dbGetMock).toBeCalledWith(" SELECT * FROM reviews WHERE model = ?",
            [testModel],
            expect.any(Function));
    });

    test("errore nel database", async () => {

        const mockError = "Database error";
        const dbGetMock = jest.spyOn(db, "all").mockImplementation((sql, params, callback) => {
            callback(new Error(mockError), null);
            return {} as Database;
        });

        await expect(controller.getProductReviews(testModel)).rejects.toThrow(mockError);
        expect(dbGetMock).toHaveBeenCalledTimes(1);
        expect(dbGetMock).toBeCalledWith(" SELECT * FROM reviews WHERE model = ?",
            [testModel],
            expect.any(Function));
    });

    test("gestione eccezione nel blocco try", async () => {

        const mockError = "Unexpected error";
        const dbGetMock = jest.spyOn(db, "all").mockImplementation((sql, params, callback) => {
            throw new Error(mockError);
        });

        await expect(controller.getProductReviews(testModel)).rejects.toThrow(mockError);
        expect(dbGetMock).toHaveBeenCalledTimes(1);
        expect(dbGetMock).toBeCalledWith(" SELECT * FROM reviews WHERE model = ?",
            [testModel],
            expect.any(Function));
    });
});

describe("deleteReview (controller)", () => {
    test("elimina una review", async () => {

        const mockedDAO = new ReviewDAO() as jest.Mocked<ReviewDAO>;
        mockedDAO.isProductExist.mockResolvedValue(true);
        mockedDAO.isProductReviewed.mockResolvedValue(1);

        controller['dao'] = mockedDAO;

        const model = "test";

        const response = await controller.deleteReview(model, testUser);
        

        expect(mockedDAO.isProductExist).toHaveBeenCalledTimes(1);
        expect(mockedDAO.isProductExist).toHaveBeenCalledWith(model);
        expect(mockedDAO.isProductReviewed).toHaveBeenCalledTimes(1);
        expect(mockedDAO.isProductReviewed).toHaveBeenCalledWith(model, testUser.username);
        expect(response).toBeUndefined();
        //NOTA: NON PUOI USARE METODI TIPO toHaveBeenCalledTimes ecc. su response, perchè response non è una mock o una spy!
    })
    
    test("prova a eliminare una review, restituisce errore (NoReviewProduct)", async () => {

        const mockedDAO = new ReviewDAO() as jest.Mocked<ReviewDAO>;
        mockedDAO.isProductExist.mockResolvedValue(true);
        mockedDAO.isProductReviewed.mockResolvedValue(null);

        controller['dao'] = mockedDAO;

        const model= "test";

        await expect(controller.deleteReview(model, testUser))
        .rejects.toThrow(NoReviewProductError);

        expect(mockedDAO.isProductExist).toHaveBeenCalledTimes(1);
        expect(mockedDAO.isProductExist).toHaveBeenCalledWith(model);
        expect(mockedDAO.isProductReviewed).toHaveBeenCalledTimes(1);
        expect(mockedDAO.isProductReviewed).toHaveBeenCalledWith(model, testUser.username);
    })

    test("prova a eliminare una review, restituisce errore (ProductNotFound)", async () => {

        // Crea un mock del DAO
        const mockedDAO = new ReviewDAO() as jest.Mocked<ReviewDAO>;
        mockedDAO.isProductExist.mockResolvedValue(false);
        mockedDAO.isProductReviewed.mockResolvedValue(null);

        // Crea un'istanza del controller utilizzando il mock del DAO
        controller['dao'] = mockedDAO;

        const model = "test";
    
        await expect(controller.deleteReview(model, testUser))
        .rejects.toThrow(ProductNotFoundError);

        expect(mockedDAO.isProductExist).toHaveBeenCalledTimes(1);
        expect(mockedDAO.isProductExist).toHaveBeenCalledWith(model);
        expect(mockedDAO.isProductReviewed).toHaveBeenCalledTimes(0);
    })
});

describe("deleteReviewsOfProduct (controller)", () => {
    test("elimina tutte le review per un prodotto, restituisce void", async () => {
        const mockedDAO = new ReviewDAO() as jest.Mocked<ReviewDAO>;
        mockedDAO.isProductExist.mockResolvedValue(true);
        controller['dao'] = mockedDAO;

        const model = "iPhone 13 Pro";

        const response = await controller.deleteReviewsOfProduct(model);

        expect(mockedDAO.isProductExist).toHaveBeenCalledTimes(1);
        expect(mockedDAO.isProductExist).toHaveBeenCalledWith(model);
        expect(mockedDAO.isProductReviewed).toHaveBeenCalledTimes(0);
        expect(response).toBeUndefined();
    });

    test("prova a eliminare le reviews, restituisce errore (ProductNotFound)", async () => {
        const mockedDAO = new ReviewDAO() as jest.Mocked<ReviewDAO>;
        mockedDAO.isProductExist.mockResolvedValue(false);
        controller['dao'] = mockedDAO;

        const model = "iPhone 13 Pro";

        await expect(controller.deleteReviewsOfProduct(model))
        .rejects.toThrow(ProductNotFoundError);

        expect(mockedDAO.isProductExist).toHaveBeenCalledTimes(1);
        expect(mockedDAO.isProductExist).toHaveBeenCalledWith(model);
        expect(mockedDAO.isProductReviewed).toHaveBeenCalledTimes(0);
    });
});

describe("deleteAllReviews (controller)", () => {

    test("elimina tutte le reviews presenti nel database", async() => {

        const dbRunMock = jest.spyOn(db, "run").mockImplementation((sql, params, callback) => {
            callback(null);
            return {} as Database;
        });

        await expect(controller.deleteAllReviews()).resolves.toBeUndefined();
       
        expect(dbRunMock).toHaveBeenCalledTimes(1); 

        expect(dbRunMock).toBeCalledWith("DELETE FROM reviews",
        [],
        expect.any(Function));
    });

    test("errore nel database", async() => {

        const mockError = new Error("Database error");

        const dbRunMock = jest.spyOn(db, "run").mockImplementation((sql, params, callback) => {
            callback(mockError);
            return {} as Database;
        });

        await expect(controller.deleteAllReviews()).rejects.toThrow(mockError);
       
        expect(dbRunMock).toHaveBeenCalledTimes(1); 

        expect(dbRunMock).toBeCalledWith("DELETE FROM reviews",
        [],
        expect.any(Function));
    });

    test("gestione eccezione nel blocco try", async() => {

        const mockError = new Error("Unexpected error");

        const dbRunMock = jest.spyOn(db, "run").mockImplementation((sql, params, callback) => {
            throw mockError
        });

        await expect(controller.deleteAllReviews()).rejects.toThrow(mockError);
       
        expect(dbRunMock).toHaveBeenCalledTimes(1); 

        expect(dbRunMock).toBeCalledWith("DELETE FROM reviews",
        [],
        expect.any(Function));
    });
});