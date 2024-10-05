import {test, describe, jest, expect} from "@jest/globals";
import request from 'supertest'
import {app} from "../../index"

import ReviewController from "../../src/controllers/reviewController";
import Authenticator from "../../src/routers/auth";

import { UnauthorizedUserError } from "../../src/errors/userError";
import { ExistingReviewError, NoReviewProductError } from "../../src/errors/reviewError";
import { ProductNotFoundError } from "../../src/errors/productError";

const baseURL = "/ezelectronics/reviews"

jest.mock("../../src/controllers/reviewController");
jest.mock("../../src/routers/auth");
jest.setTimeout(100000);

describe("GET /:model", () => {
    test("Ritorna un array di reviews e restituisce 200", async () => {

        const reviews = [
            {model: "iPhone 13 Pro", user: "john.doe", score: 5, date: "2023-02-15", comment: "Best phone I ever had! Amazing camera and performance."},
            {model: "iPhone 13 Pro", user: "john.doe", score: 5, date: "2023-02-15", comment: "Best phone I ever had! Amazing camera and performance."}
        ];
        const spyGetRew = jest.spyOn(ReviewController.prototype, "getProductReviews").mockResolvedValue(reviews);

        jest.spyOn(Authenticator.prototype, "isLoggedIn").mockImplementation((req, res, next) => {
            return next();
        })

        const response = await request(app).get(baseURL + "/iPhone 13 Pro");
        expect(response.status).toBe(200);
        expect(spyGetRew).toHaveBeenCalled();
        expect(spyGetRew).toHaveBeenCalledWith("iPhone 13 Pro");
        expect(response.body).toEqual(reviews);
    });

    test("utente non loggato", async () => {
        jest.spyOn(Authenticator.prototype, "isLoggedIn").mockImplementation((req, res, next) => {
            res.status(401).json({message: UnauthorizedUserError.prototype.customMessage});
        })

        const response = await request(app).get(baseURL + "/test");
        expect(response.status).toBe(401);
        expect(response.body.message).toBe(UnauthorizedUserError.prototype.customMessage);
    })

    test("Gestisce gli errori nel metodo getProductReviews e restituisce errore", async () => {
        jest.spyOn(ReviewController.prototype, "getProductReviews").mockRejectedValue({
            message: "Internal Server Error",
            statusCode: 503
        });
    
        jest.spyOn(Authenticator.prototype, "isLoggedIn").mockImplementation((req, res, next) => {
            return next();
        });
    
        const response = await request(app).get(baseURL + "/iPhone 13 Pro");
        expect(response.status).toBe(503);
        expect(response.body).toStrictEqual({"error": "Internal Server Error", "status": 503});
    });
});

describe("POST /:model", () => {
    test("Aggiunge una review a un prodotto e restituisce 200", async () => {
        const inputReview = {model: "iPhone 13 Pro", user: "sandra", score: 4, comment: "Cool"};

        const spyAdd = jest.spyOn(ReviewController.prototype, "addReview").mockResolvedValue();

        jest.spyOn(Authenticator.prototype, "isCustomer").mockImplementation((req, res, next) => {
            req.user = "sandra"; //è il customer che vuole aggiungere una recensione
            return next();
        });

        const response = await request(app).post(baseURL + "/iPhone 13 Pro").send(inputReview);
        expect(response.status).toBe(200);
        expect(spyAdd).toHaveBeenCalled();
        expect(spyAdd).toHaveBeenCalledWith(inputReview.model, inputReview.user, inputReview.score, inputReview.comment);
    });

    test("restituisce errore per parametri sbagliati", async () => {
        const inputReview = {
            score: 6,
            comment: ""
        }

        const response = await request(app).post(baseURL + "/iPhone 13 Pro").send(inputReview);

        expect(response.status).toBe(422);
    });

    test("Gestisce gli errori nel metodo addReview e restituisce errore", async () => {
        const inputReview = {model: "iPhone 13 Pro", user: "sandra", score: 4, comment: "Cool"};

        jest.spyOn(ReviewController.prototype, "addReview").mockRejectedValue(new ExistingReviewError());
    
        jest.spyOn(Authenticator.prototype, "isLoggedIn").mockImplementation((req, res, next) => {
            return next();
        });
    
        const response = await request(app).post(baseURL + "/test").send(inputReview);
        expect(response.status).toBe(409);
        expect(response.body).toEqual({
            error: "You have already reviewed this product",
            status: 409
        });
    });
});

describe("DELETE /:model", () => {
    test("Elimina una review di un prodotto e restituisce 200", async () => {
        const reviewId = "test";

        const spyDel = jest.spyOn(ReviewController.prototype, "deleteReview").mockResolvedValue();

        jest.spyOn(Authenticator.prototype, "isCustomer").mockImplementation((req, res, next) => {
            req.user = "carlo";
            return next();
        });

        const response = await request(app).delete(baseURL + "/" + reviewId);

        expect(response.status).toBe(200);
        expect(spyDel).toHaveBeenCalled();
        expect(spyDel).toHaveBeenLastCalledWith(reviewId, "carlo");
    })

    test("Gestisce gli errori nel metodo deleteReview e restituisce errore", async () => {
        jest.spyOn(ReviewController.prototype, "deleteReview").mockRejectedValue(new NoReviewProductError());
    
        jest.spyOn(Authenticator.prototype, "isCustomer").mockImplementation((req, res, next) => {
            return next();
        });
    
        const response = await request(app).delete(baseURL + "/test");
        expect(response.status).toBe(404);
        expect(response.body).toEqual({
            error: "You have not reviewed this product",
            status: 404
        });
    });
});

describe("DELETE /:model/all", () => {
    
    test("Elimina tutte le review di un prodotto e restituisce 200", async () => {
        const reviewId = "test";

        const spyDel = jest.spyOn(ReviewController.prototype, "deleteReviewsOfProduct").mockResolvedValue();

        jest.spyOn(Authenticator.prototype, "isAdminOrManager").mockImplementation((req, res, next) => {
            req.user = "carlo";
            return next();
        });

        const response = await request(app).delete(baseURL + "/" + "test" + "/all");
        expect(spyDel).toHaveBeenCalledTimes(1);
        expect(spyDel).toHaveBeenLastCalledWith(reviewId);
        expect(response.status).toBe(200);
        
        spyDel.mockRestore();
    })


    test("Gestisce gli errori nel metodo deleteReviewsOfProduct e restituisce errore", async () => {
        const testRev = "test";
        const spy = jest.spyOn(ReviewController.prototype, "deleteReviewsOfProduct").mockRejectedValue(new ProductNotFoundError());
    
        jest.spyOn(Authenticator.prototype, "isAdminOrManager").mockImplementation((req, res, next) => {
            return next();
        });
    
        const response = await request(app).delete(baseURL + "/"+ testRev +"/all");
        expect(response.status).toBe(404);
        expect(response.body).toEqual({
            error: "Product not found",
            status: 404
        });
        spy.mockRestore();
    });

});

describe("DELETE /", () => {
    test("Elimina tutte le review e restituisce 200", async () => {
        const spyDel = jest.spyOn(ReviewController.prototype, "deleteAllReviews").mockResolvedValue();

        jest.spyOn(Authenticator.prototype, "isAdminOrManager").mockImplementation((req, res, next) => {
            return next();
        });

        const response = await request(app).delete(baseURL);

        expect(response.status).toBe(200);
        expect(spyDel).toHaveBeenCalled();
        expect(spyDel).toHaveBeenLastCalledWith();
    });

    test("Gestisce gli errori nel metodo deleteAllReviews e restituisce errore", async () => {
        jest.spyOn(ReviewController.prototype, "deleteAllReviews").mockRejectedValue(Error());
    
        jest.spyOn(Authenticator.prototype, "isAdminOrManager").mockImplementation((req, res, next) => {
            return next();
        });
    
        const response = await request(app).delete(baseURL);
       expect(response.status).toBe(503);
    });
})
