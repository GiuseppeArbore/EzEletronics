import { test, expect, jest, describe } from "@jest/globals"
import ProductController from "../../src/controllers/productController"
import Authenticator from "../../src/routers/auth"
import request from "supertest"
const baseURL = "/ezelectronics/products"
import { app } from "../../index"
import { Category, Product } from "../../src/components/product"
import { DateError } from "../../src/utilities"
import { EmptyProductStockForCategoryError, LowProductStockError, ProductAlreadyExistsError, ProductNotFoundError, ProposedDateTooEarlyError } from "../../src/errors/productError"
import ProductDAO from "../../src/dao/productDAO"
import exp from "node:constants"
import e from "express"


// Mock the necessary dependencies
jest.mock("../../src/controllers/productController");
jest.mock("../../src/routers/auth");
jest.setTimeout(100000);

//Product tests
//Parameters checks are done in the Routes, so here I should not pass wrong parameters

//Insert a new product that is not in db yet. Should return an empty promise
describe("Product route unit tests", () => {
    const category = Category.SMARTPHONE;
    const quantity = 6;
    const details = "blue, 128Gb";
    const sellingPrice = 800.00;
    const arrivalDate = "2023-12-12";
    const model = "iPhone15";

    const category2 = Category.LAPTOP;
    const quantity2 = 3;
    const details2 = "blue, 1Tb";
    const sellingPrice2 = 1500.00;
    const arrivalDate2 = "2022-12-12";
    const model2 = "AsusPc";

    const category3 = Category.SMARTPHONE;
    const quantity3 = 3;
    const details3 = "blue, 1Tb";
    const sellingPrice3 = 1500.00;
    const arrivalDate3 = "2022-12-12";
    const model3 = "GalaxyS20";

    let testProducts = [
        new Product(sellingPrice, model, category, arrivalDate, details, quantity),
        new Product(sellingPrice2, model2, category2, arrivalDate2, details2, quantity2),
        new Product(sellingPrice3, model3, category3, arrivalDate3, details3, quantity3)
    ];

    let testSmartphone = [
        new Product(sellingPrice, model, category, arrivalDate, details, quantity),
        new Product(sellingPrice3, model3, category3, arrivalDate3, details3, quantity3)
    ];

    let testProduct = new Product(sellingPrice, model, category, arrivalDate, details, quantity);
    describe("POST /products", () => {
        test("It should return a 200 success code", async () => {
            jest.spyOn(Authenticator.prototype, "isLoggedIn").mockImplementation((req, res, next) => next())
            jest.spyOn(Authenticator.prototype, "isAdminOrManager").mockImplementation((req, res, next) => next())
            jest.spyOn(ProductController.prototype, "registerProducts").mockResolvedValueOnce()
            const response = await request(app).post(baseURL).send(testProduct);
            expect(response.status).toBe(200);
            expect(ProductController.prototype.registerProducts).toHaveBeenCalled();
            expect(ProductController.prototype.registerProducts).toHaveBeenCalledWith(
                testProduct.model,
                testProduct.category,
                testProduct.quantity,
                testProduct.details,
                testProduct.sellingPrice,
                testProduct.arrivalDate
            );
            jest.clearAllMocks();
        });


        test("It should return a 400 error when arrivalDate is after the current date", async () => {
            var today = new Date();

            var arrivalDate = (today.getFullYear() + 2) + "-10-10";

            const invalidProduct = { ...testProduct, arrivalDate: arrivalDate };
            jest.spyOn(Authenticator.prototype, "isLoggedIn").mockImplementation((req, res, next) => next())
            jest.spyOn(Authenticator.prototype, "isAdminOrManager").mockImplementation((req, res, next) => next())

            const response = await request(app).post(baseURL).send(invalidProduct);
            expect(response.status).toBe(400);
            jest.clearAllMocks();

        });

        test("It should return a 403 error for unauthorized access", async () => {
            jest.spyOn(Authenticator.prototype, "isLoggedIn").mockImplementation((req, res, next) => res.status(403).send({ error: "Unauthorized" }));

            const response = await request(app).post(baseURL).send(testProduct);
            expect(response.status).toBe(403);
            jest.clearAllMocks();

        });

        test("It should return a 409 error when product is alredy in the db", async () => {

            var arrivalDate = "2024-01-10";
            const invalidProduct = { ...testProduct, arrivalDate: arrivalDate };
            jest.spyOn(Authenticator.prototype, "isLoggedIn").mockImplementation((req, res, next) => next())
            jest.spyOn(Authenticator.prototype, "isAdminOrManager").mockImplementation((req, res, next) => next())
            jest.spyOn(ProductController.prototype, "registerProducts").mockRejectedValueOnce(new ProductAlreadyExistsError())
            const response = await request(app).post(baseURL).send(invalidProduct);
            expect(response.status).toBe(409);
            expect(ProductController.prototype.registerProducts).toHaveBeenCalled();
            expect(ProductController.prototype.registerProducts).toHaveBeenCalledWith(
                testProduct.model,
                testProduct.category,
                testProduct.quantity,
                testProduct.details,
                testProduct.sellingPrice,
                invalidProduct.arrivalDate
            );
            jest.clearAllMocks();

        });

    });


    describe("PATCH /products/:model", () => {
        test("It should increase the product quantity and return 200 with new quantity", async () => {
            const inputUpdate = { quantity: 5, changeDate: "2024-06-01" }
            const newQuantity = testProduct.quantity + inputUpdate.quantity

            jest.spyOn(ProductController.prototype, "changeProductQuantity").mockResolvedValueOnce(newQuantity)
            jest.spyOn(Authenticator.prototype, "isLoggedIn").mockImplementation((req, res, next) => next())
            jest.spyOn(Authenticator.prototype, "isAdminOrManager").mockImplementation((req, res, next) => next())

            const response = await request(app).patch(`${baseURL}/${testProduct.model}`).send(inputUpdate)
            expect(response.status).toBe(200)
            expect(response.body.quantity).toBe(newQuantity)
            expect(ProductController.prototype.changeProductQuantity).toHaveBeenCalled()
            expect(ProductController.prototype.changeProductQuantity).toHaveBeenCalledWith(testProduct.model, inputUpdate.quantity, inputUpdate.changeDate)
            jest.clearAllMocks();

        });

        test("update in the future -It should return an error 400", async () => {
            var today = new Date();
            var changeDate = (today.getFullYear() + 2) + "-10-10";


            const inputUpdate = { quantity: 5, changeDate: changeDate };
            const newQuantity = testProduct.quantity + inputUpdate.quantity;

            jest.spyOn(Authenticator.prototype, "isLoggedIn").mockImplementation((req, res, next) => next());
            jest.spyOn(Authenticator.prototype, "isAdminOrManager").mockImplementation((req, res, next) => next());

            const response = await request(app).patch(`${baseURL}/${testProduct.model}`).send(inputUpdate);
            expect(response.status).toBe(400);
            expect(ProductController.prototype.changeProductQuantity).toHaveBeenCalledTimes(0);
            jest.clearAllMocks();

        });

        test("update before arrival -It should return an error 400", async () => {

            var changeDate = "2019-10-10";
            const inputUpdate = { quantity: 5, changeDate: changeDate };


            jest.spyOn(ProductController.prototype, "changeProductQuantity").mockRejectedValueOnce(new ProposedDateTooEarlyError())
            jest.spyOn(Authenticator.prototype, "isLoggedIn").mockImplementation((req, res, next) => next());
            jest.spyOn(Authenticator.prototype, "isAdminOrManager").mockImplementation((req, res, next) => next());

            const response = await request(app).patch(`${baseURL}/${testProduct.model}`).send(inputUpdate);
            expect(response.status).toBe(400);
            expect(ProductController.prototype.changeProductQuantity).toHaveBeenCalled();
            expect(ProductController.prototype.changeProductQuantity).toHaveBeenCalledWith(testProduct.model, inputUpdate.quantity, inputUpdate.changeDate);

            jest.clearAllMocks();

        });
        test("model not in db -It should return an error 404", async () => {
            var changeDate = "2024-03-10";
            const inputUpdate = { quantity: 5, changeDate: changeDate };

            jest.spyOn(Authenticator.prototype, "isLoggedIn").mockImplementation((req, res, next) => next());
            jest.spyOn(Authenticator.prototype, "isAdminOrManager").mockImplementation((req, res, next) => next());
            jest.spyOn(ProductController.prototype, "changeProductQuantity").mockRejectedValueOnce(new ProductNotFoundError());


            const response = await request(app).patch(`${baseURL}/${testProduct.model}`).send(inputUpdate);
            expect(response.status).toBe(404);
            expect(ProductController.prototype.changeProductQuantity).toHaveBeenCalled();
            expect(ProductController.prototype.changeProductQuantity).toHaveBeenCalledWith(testProduct.model, inputUpdate.quantity, inputUpdate.changeDate);
            jest.clearAllMocks();

        });

    });

    describe("PATCH /products/:model/sell", () => {

        test("It should sell the product and return 200 ", async () => {
            const inputDate = { quantity: 1, sellingDate: "2024-06-01" }
            const newQuantity = testProduct.quantity - inputDate.quantity

            jest.spyOn(Authenticator.prototype, "isLoggedIn").mockImplementation((req, res, next) => next())
            jest.spyOn(Authenticator.prototype, "isAdminOrManager").mockImplementation((req, res, next) => next())
            jest.spyOn(ProductController.prototype, "sellProduct").mockResolvedValueOnce(newQuantity)


            const response = await request(app).patch(`${baseURL}/${testProduct.model}/sell`).send(inputDate)
            expect(response.status).toBe(200)
            expect(response.body.quantity).toBe(newQuantity)
            expect(ProductController.prototype.sellProduct).toHaveBeenCalled()
            expect(ProductController.prototype.sellProduct).toHaveBeenCalledWith(testProduct.model, inputDate.quantity, inputDate.sellingDate)
            jest.clearAllMocks();

        });

        test("sell in the future -It should return an error 400", async () => {
            var today = new Date();

            const inputDate = { quantity: 1, sellingDate: "2036-10-10" };

            //const newQuantity = testProduct.quantity + inputUpdate.quantity;

            jest.spyOn(Authenticator.prototype, "isLoggedIn").mockImplementation((req, res, next) => next());
            jest.spyOn(Authenticator.prototype, "isAdminOrManager").mockImplementation((req, res, next) => next());

            const response = await request(app).patch(`${baseURL}/${testProduct.model}/sell`).send(inputDate);
            expect(response.status).toBe(400);
            expect(ProductController.prototype.sellProduct).toHaveBeenCalledTimes(0)

            jest.clearAllMocks();

        });

        test("sell before arrival -It should return an error 400", async () => {
            var today = new Date();

            var sellDate = "2019-10-10";
            const inputUpdate = { quantity: 1, sellingDate: sellDate };
            const newQuantity = testProduct.quantity - inputUpdate.quantity;

            jest.spyOn(ProductController.prototype, "sellProduct").mockRejectedValueOnce(new ProposedDateTooEarlyError())
            jest.spyOn(Authenticator.prototype, "isLoggedIn").mockImplementation((req, res, next) => next());
            jest.spyOn(Authenticator.prototype, "isAdminOrManager").mockImplementation((req, res, next) => next());

            const response = await request(app).patch(`${baseURL}/${testProduct.model}/sell`).send(inputUpdate);
            expect(response.status).toBe(400);
            expect(ProductController.prototype.sellProduct).toHaveBeenCalledTimes(1);
            expect(ProductController.prototype.sellProduct).toHaveBeenCalledWith(testProduct.model, inputUpdate.quantity, inputUpdate.sellingDate);
            jest.clearAllMocks();

        });

        test("sell model not in db -It should return an error 404", async () => {
            var changeDate = "2024-03-10";
            const inputUpdate = { quantity: 5, sellingDate: changeDate };

            jest.spyOn(Authenticator.prototype, "isLoggedIn").mockImplementation((req, res, next) => next());
            jest.spyOn(Authenticator.prototype, "isAdminOrManager").mockImplementation((req, res, next) => next());
            jest.spyOn(ProductController.prototype, "sellProduct").mockRejectedValueOnce(new ProductNotFoundError());

            const response = await request(app).patch(`${baseURL}/${testProduct.model}/sell`).send(inputUpdate);
            expect(response.status).toBe(404);
            expect(ProductController.prototype.sellProduct).toHaveBeenCalled();
            expect(ProductController.prototype.sellProduct).toHaveBeenCalledWith(testProduct.model, inputUpdate.quantity, inputUpdate.sellingDate);
            jest.clearAllMocks();

        });

        test("sell model with quantity 0 -It should return an error 409", async () => {
            var changeDate = "2024-03-10";
            const inputUpdate = { quantity: 5, sellingDate: changeDate };

            jest.spyOn(Authenticator.prototype, "isLoggedIn").mockImplementation((req, res, next) => next());
            jest.spyOn(Authenticator.prototype, "isAdminOrManager").mockImplementation((req, res, next) => next());
            jest.spyOn(ProductController.prototype, "sellProduct").mockRejectedValueOnce(new EmptyProductStockForCategoryError());

            const response = await request(app).patch(`${baseURL}/${testProduct.model}/sell`).send(inputUpdate);
            expect(response.status).toBe(409);
            expect(ProductController.prototype.sellProduct).toHaveBeenCalled();
            expect(ProductController.prototype.sellProduct).toHaveBeenCalledWith(testProduct.model, inputUpdate.quantity, inputUpdate.sellingDate);
            jest.clearAllMocks();

        });

        test("sell model with not enough quantity -It should return an error 409", async () => {
            var changeDate = "2024-03-10";
            const inputUpdate = { quantity: 5, sellingDate: changeDate };

            jest.spyOn(Authenticator.prototype, "isLoggedIn").mockImplementation((req, res, next) => next());
            jest.spyOn(Authenticator.prototype, "isAdminOrManager").mockImplementation((req, res, next) => next());
            jest.spyOn(ProductController.prototype, "sellProduct").mockRejectedValueOnce(new LowProductStockError());

            const response = await request(app).patch(`${baseURL}/${testProduct.model}/sell`).send(inputUpdate);
            expect(response.status).toBe(409);
            expect(ProductController.prototype.sellProduct).toHaveBeenCalled();
            expect(ProductController.prototype.sellProduct).toHaveBeenCalledWith(testProduct.model, inputUpdate.quantity, inputUpdate.sellingDate);
            jest.clearAllMocks();

        });

    });



    describe("GET /products", () => {
        test("It should return all the products", async () => {
            jest.spyOn(Authenticator.prototype, "isLoggedIn").mockImplementation((req, res, next) => next())
            jest.spyOn(Authenticator.prototype, "isAdminOrManager").mockImplementation((req, res, next) => next())
            jest.spyOn(ProductController.prototype, "getProducts").mockResolvedValueOnce(testProducts)
            let grouping = null;
            let category = null;
            let model = null;
            const response = await request(app).get(baseURL);
            expect(response.status).toBe(200);
            expect(response.body).toEqual(testProducts);
            expect(ProductController.prototype.getProducts).toHaveBeenCalled();
            jest.clearAllMocks();
        });

        test("It should return all the smartphone with status 200", async () => {
            jest.spyOn(Authenticator.prototype, "isLoggedIn").mockImplementation((req, res, next) => next())
            jest.spyOn(Authenticator.prototype, "isAdminOrManager").mockImplementation((req, res, next) => next())
            jest.spyOn(ProductController.prototype, "getProducts").mockResolvedValueOnce(testSmartphone)
            let grouping = "category";
            let category = Category.SMARTPHONE;
            let model = null;
            const response = await request(app).get(baseURL).query({ grouping: grouping, category: category, model: model });
            expect(response.status).toBe(200);
            expect(response.body).toEqual(testSmartphone);
            expect(ProductController.prototype.getProducts).toHaveBeenCalled();

            jest.clearAllMocks();
        });

        test("It should return all the iphone15 with status 200", async () => {
            jest.spyOn(Authenticator.prototype, "isLoggedIn").mockImplementation((req, res, next) => next())
            jest.spyOn(Authenticator.prototype, "isAdminOrManager").mockImplementation((req, res, next) => next())
            jest.spyOn(ProductController.prototype, "getProducts").mockResolvedValueOnce([testProduct])
            let grouping = "model";
            let category = null;
            let model = testProduct.model;
            const response = await request(app).get(baseURL).query({ grouping: grouping, category: category, model: model });
            expect(response.status).toBe(200);
            expect(response.body).toEqual([testProduct]);
            expect(ProductController.prototype.getProducts).toHaveBeenCalled();

            jest.clearAllMocks();
        });


        test("grouping null, category not -> It should return  422", async () => {
            jest.spyOn(Authenticator.prototype, "isLoggedIn").mockImplementation((req, res, next) => next())
            jest.spyOn(Authenticator.prototype, "isAdminOrManager").mockImplementation((req, res, next) => next())
            let grouping = null;
            let category = Category.SMARTPHONE;
            let model = null;
            const response = await request(app).get(baseURL).query({ grouping: grouping, category: category, model: model });
            expect(response.status).toBe(422);
            expect(ProductController.prototype.getProducts).toHaveBeenCalledTimes(0);

            jest.clearAllMocks();
        });

        test("grouping null, model not -> It should return 422", async () => {
            jest.spyOn(Authenticator.prototype, "isLoggedIn").mockImplementation((req, res, next) => next())
            jest.spyOn(Authenticator.prototype, "isAdminOrManager").mockImplementation((req, res, next) => next())
            let grouping = null;
            let category = null;
            let model = testProduct.model;
            const response = await request(app).get(baseURL).query({ grouping: grouping, category: category, model: model });
            expect(response.status).toBe(422);
            expect(ProductController.prototype.getProducts).toHaveBeenCalledTimes(0);

            jest.clearAllMocks();
        });

        test("grouping null, model not and category not -> It should return 422", async () => {
            jest.spyOn(Authenticator.prototype, "isLoggedIn").mockImplementation((req, res, next) => next())
            jest.spyOn(Authenticator.prototype, "isAdminOrManager").mockImplementation((req, res, next) => next())
            let grouping = null;
            let category = Category.SMARTPHONE;
            let model = testProduct.model;
            const response = await request(app).get(baseURL).query({ grouping: grouping, category: category, model: model });
            expect(response.status).toBe(422);
            expect(ProductController.prototype.getProducts).toHaveBeenCalledTimes(0);

            jest.clearAllMocks();
        });


        test("grouping=category and category&model null -> It should return 422", async () => {
            jest.spyOn(Authenticator.prototype, "isLoggedIn").mockImplementation((req, res, next) => next())
            jest.spyOn(Authenticator.prototype, "isAdminOrManager").mockImplementation((req, res, next) => next())
            let grouping = "category";
            let category = null;
            let model = null;
            const response = await request(app).get(baseURL).query({ grouping: grouping, category: category, model: model });
            expect(response.status).toBe(422);
            expect(ProductController.prototype.getProducts).toHaveBeenCalledTimes(0);

            jest.clearAllMocks();
        });

        test("grouping=category and category =null and model not null-> It should return422", async () => {
            jest.spyOn(Authenticator.prototype, "isLoggedIn").mockImplementation((req, res, next) => next())
            jest.spyOn(Authenticator.prototype, "isAdminOrManager").mockImplementation((req, res, next) => next())
            let grouping = "category";
            let category = null;
            let model = testProduct.model;
            const response = await request(app).get(baseURL).query({ grouping: grouping, category: category, model: model });
            expect(response.status).toBe(422);
            expect(ProductController.prototype.getProducts).toHaveBeenCalledTimes(0);

            jest.clearAllMocks();
        });

        test("grouping=category and category not null and model not null-> It should return  422", async () => {
            jest.spyOn(Authenticator.prototype, "isLoggedIn").mockImplementation((req, res, next) => next())
            jest.spyOn(Authenticator.prototype, "isAdminOrManager").mockImplementation((req, res, next) => next())
            let grouping = "category";
            let category = Category.SMARTPHONE;
            let model = testProduct.model;
            const response = await request(app).get(baseURL).query({ grouping: grouping, category: category, model: model });
            expect(response.status).toBe(422);
            expect(ProductController.prototype.getProducts).toHaveBeenCalledTimes(0);

            jest.clearAllMocks();
        });

        test("grouping=model and category null and model null-> It should return 422", async () => {
            jest.spyOn(Authenticator.prototype, "isLoggedIn").mockImplementation((req, res, next) => next())
            jest.spyOn(Authenticator.prototype, "isAdminOrManager").mockImplementation((req, res, next) => next())
            let grouping = "model";
            let category = null;
            let model = null;
            const response = await request(app).get(baseURL).query({ grouping: grouping, category: category, model: model });
            expect(response.status).toBe(422);
            expect(ProductController.prototype.getProducts).toHaveBeenCalledTimes(0);

            jest.clearAllMocks();
        });

        test("grouping=model and category not null and model null-> It should return  422", async () => {
            jest.spyOn(Authenticator.prototype, "isLoggedIn").mockImplementation((req, res, next) => next())
            jest.spyOn(Authenticator.prototype, "isAdminOrManager").mockImplementation((req, res, next) => next())
            let grouping = "model";
            let category = Category.SMARTPHONE;
            let model = null;
            const response = await request(app).get(baseURL).query({ grouping: grouping, category: category, model: model });
            expect(response.status).toBe(422);
            expect(ProductController.prototype.getProducts).toHaveBeenCalledTimes(0);

            jest.clearAllMocks();
        });

        test("grouping=model and category not null and model not null-> It should return  422", async () => {
            jest.spyOn(Authenticator.prototype, "isLoggedIn").mockImplementation((req, res, next) => next())
            jest.spyOn(Authenticator.prototype, "isAdminOrManager").mockImplementation((req, res, next) => next())
            let grouping = "model";
            let category = Category.SMARTPHONE;
            let model = testProduct.model;
            const response = await request(app).get(baseURL).query({ grouping: grouping, category: category, model: model });
            expect(response.status).toBe(422);
            expect(ProductController.prototype.getProducts).toHaveBeenCalledTimes(0);

            jest.clearAllMocks();
        });

        test("grouping=model and and model empty-> It should return  422", async () => {
            jest.spyOn(Authenticator.prototype, "isLoggedIn").mockImplementation((req, res, next) => next())
            jest.spyOn(Authenticator.prototype, "isAdminOrManager").mockImplementation((req, res, next) => next())
            let grouping = "model";
            let category = null;
            let model = "";
            const response = await request(app).get(baseURL).query({ grouping: grouping, category: category, model: model });
            expect(response.status).toBe(422);
            expect(ProductController.prototype.getProducts).toHaveBeenCalledTimes(0);

            jest.clearAllMocks();
        });

        test("grouping=category and and category empty-> It should return  422", async () => {
            jest.spyOn(Authenticator.prototype, "isLoggedIn").mockImplementation((req, res, next) => next())
            jest.spyOn(Authenticator.prototype, "isAdminOrManager").mockImplementation((req, res, next) => next())
            let grouping = "category";
            let category = "";
            let model = null;
            const response = await request(app).get(baseURL).query({ grouping: grouping, category: category, model: model });
            expect(response.status).toBe(422);
            expect(ProductController.prototype.getProducts).toHaveBeenCalledTimes(0);

            jest.clearAllMocks();
        });

        test("grouping=model and model not in db-> It should return  404", async () => {
            jest.spyOn(Authenticator.prototype, "isLoggedIn").mockImplementation((req, res, next) => next())
            jest.spyOn(Authenticator.prototype, "isAdminOrManager").mockImplementation((req, res, next) => next())
            jest.spyOn(ProductController.prototype, "getProducts").mockRejectedValueOnce(new ProductNotFoundError())
            let grouping = "model";
            let category = null;
            let model = "PS6";
            const response = await request(app).get(baseURL).query({ grouping: grouping, category: category, model: model });
            expect(response.status).toBe(404);
            expect(ProductController.prototype.getProducts).toHaveBeenCalledTimes(1);

            jest.clearAllMocks();
        });

        test("grouping=null and model not in db-> It should return  404", async () => {
            jest.spyOn(Authenticator.prototype, "isLoggedIn").mockImplementation((req, res, next) => next())
            jest.spyOn(Authenticator.prototype, "isAdminOrManager").mockImplementation((req, res, next) => next())
            let grouping = null;
            let category = null;
            let model = "PS6";
            const response = await request(app).get(baseURL).query({ grouping: grouping, category: category, model: model });
            expect(response.status).toBe(422);
            expect(ProductController.prototype.getProducts).toHaveBeenCalledTimes(0);

            jest.clearAllMocks();
        });


        test("It should return all the smiphone15 with status 200", async () => {
            jest.spyOn(Authenticator.prototype, "isLoggedIn").mockImplementation((req, res, next) => next())
            jest.spyOn(Authenticator.prototype, "isAdminOrManager").mockImplementation((req, res, next) => next())
            let grouping = "model";
            let category = Category.SMARTPHONE;
            let model = testProduct.model;
            const response = await request(app).get(baseURL).query({ grouping: grouping, category: category, model: model });
            expect(response.status).toBe(422);
            expect(ProductController.prototype.getProducts).toHaveBeenCalledTimes(0);

            jest.clearAllMocks();
        });



        test("It should return a 403 error for unauthorized access", async () => {
            jest.spyOn(Authenticator.prototype, "isLoggedIn").mockImplementation((req, res, next) => res.status(403).send({ error: "Unauthorized" }));
            const response = await request(app).get(baseURL);
            expect(response.status).toBe(403);
            jest.clearAllMocks();
        });

    });


    describe("GET /products/available", () => {
        test("It should return all the products", async () => {
            jest.spyOn(Authenticator.prototype, "isLoggedIn").mockImplementation((req, res, next) => next())
            jest.spyOn(ProductController.prototype, "getAvailableProducts").mockResolvedValueOnce(testProducts)
            let grouping = null;
            let category = null;
            let model = null;
            const response = await request(app).get(`${baseURL}/available`);
            expect(response.status).toBe(200);
            expect(response.body).toEqual(testProducts);
            expect(ProductController.prototype.getAvailableProducts).toHaveBeenCalled();
            jest.clearAllMocks();
        });

        test("It should return all the smartphone with status 200", async () => {
            jest.spyOn(Authenticator.prototype, "isLoggedIn").mockImplementation((req, res, next) => next())
            jest.spyOn(ProductController.prototype, "getAvailableProducts").mockResolvedValueOnce(testSmartphone)
            let grouping = "category";
            let category = Category.SMARTPHONE;
            let model = null;
            const response = await request(app).get(`${baseURL}/available`).query({ grouping: grouping, category: category, model: model });
            expect(response.status).toBe(200);
            expect(response.body).toEqual(testSmartphone);
            expect(ProductController.prototype.getAvailableProducts).toHaveBeenCalled();

            jest.clearAllMocks();
        });

        test("It should return all the iphone15 with status 200", async () => {
            jest.spyOn(Authenticator.prototype, "isLoggedIn").mockImplementation((req, res, next) => next())
            jest.spyOn(ProductController.prototype, "getAvailableProducts").mockResolvedValueOnce([testProduct])
            let grouping = "model";
            let category = null;
            let model = testProduct.model;
            const response = await request(app).get(`${baseURL}/available`).query({ grouping: grouping, category: category, model: model });
            expect(response.status).toBe(200);
            expect(response.body).toEqual([testProduct]);
            expect(ProductController.prototype.getAvailableProducts).toHaveBeenCalled();

            jest.clearAllMocks();
        });


        test("grouping null, category not -> It should return  422", async () => {
            jest.spyOn(Authenticator.prototype, "isLoggedIn").mockImplementation((req, res, next) => next())
            let grouping = null;
            let category = Category.SMARTPHONE;
            let model = null;
            const response = await request(app).get(`${baseURL}/available`).query({ grouping: grouping, category: category, model: model });
            expect(response.status).toBe(422);
            expect(ProductController.prototype.getAvailableProducts).toHaveBeenCalledTimes(0);

            jest.clearAllMocks();
        });

        test("grouping null, model not -> It should return 422", async () => {
            jest.spyOn(Authenticator.prototype, "isLoggedIn").mockImplementation((req, res, next) => next())
            let grouping = null;
            let category = null;
            let model = testProduct.model;
            const response = await request(app).get(`${baseURL}/available`).query({ grouping: grouping, category: category, model: model });
            expect(response.status).toBe(422);
            expect(ProductController.prototype.getAvailableProducts).toHaveBeenCalledTimes(0);

            jest.clearAllMocks();
        });

        test("grouping null, model not and category not -> It should return 422", async () => {
            jest.spyOn(Authenticator.prototype, "isLoggedIn").mockImplementation((req, res, next) => next())
            let grouping = null;
            let category = Category.SMARTPHONE;
            let model = testProduct.model;
            const response = await request(app).get(`${baseURL}/available`).query({ grouping: grouping, category: category, model: model });
            expect(response.status).toBe(422);
            expect(ProductController.prototype.getAvailableProducts).toHaveBeenCalledTimes(0);

            jest.clearAllMocks();
        });


        test("grouping=category and category&model null -> It should return 422", async () => {
            jest.spyOn(Authenticator.prototype, "isLoggedIn").mockImplementation((req, res, next) => next())
            let grouping = "category";
            let category = null;
            let model = null;
            const response = await request(app).get(`${baseURL}/available`).query({ grouping: grouping, category: category, model: model });
            expect(response.status).toBe(422);
            expect(ProductController.prototype.getAvailableProducts).toHaveBeenCalledTimes(0);

            jest.clearAllMocks();
        });

        test("grouping=category and category =null and model not null-> It should return422", async () => {
            jest.spyOn(Authenticator.prototype, "isLoggedIn").mockImplementation((req, res, next) => next())
            let grouping = "category";
            let category = null;
            let model = testProduct.model;
            const response = await request(app).get(`${baseURL}/available`).query({ grouping: grouping, category: category, model: model });
            expect(response.status).toBe(422);
            expect(ProductController.prototype.getAvailableProducts).toHaveBeenCalledTimes(0);

            jest.clearAllMocks();
        });

        test("grouping=category and category not null and model not null-> It should return  422", async () => {
            jest.spyOn(Authenticator.prototype, "isLoggedIn").mockImplementation((req, res, next) => next())
            let grouping = "category";
            let category = Category.SMARTPHONE;
            let model = testProduct.model;
            const response = await request(app).get(`${baseURL}/available`).query({ grouping: grouping, category: category, model: model });
            expect(response.status).toBe(422);
            expect(ProductController.prototype.getAvailableProducts).toHaveBeenCalledTimes(0);

            jest.clearAllMocks();
        });

        test("grouping=model and category null and model null-> It should return 422", async () => {
            jest.spyOn(Authenticator.prototype, "isLoggedIn").mockImplementation((req, res, next) => next())
            let grouping = "model";
            let category = null;
            let model = null;
            const response = await request(app).get(`${baseURL}/available`).query({ grouping: grouping, category: category, model: model });
            expect(response.status).toBe(422);
            expect(ProductController.prototype.getAvailableProducts).toHaveBeenCalledTimes(0);

            jest.clearAllMocks();
        });

        test("grouping=model and category not null and model null-> It should return  422", async () => {
            jest.spyOn(Authenticator.prototype, "isLoggedIn").mockImplementation((req, res, next) => next())
            let grouping = "model";
            let category = Category.SMARTPHONE;
            let model = null;
            const response = await request(app).get(`${baseURL}/available`).query({ grouping: grouping, category: category, model: model });
            expect(response.status).toBe(422);
            expect(ProductController.prototype.getAvailableProducts).toHaveBeenCalledTimes(0);

            jest.clearAllMocks();
        });

        test("grouping=model and category not null and model not null-> It should return  422", async () => {
            jest.spyOn(Authenticator.prototype, "isLoggedIn").mockImplementation((req, res, next) => next())
            let grouping = "model";
            let category = Category.SMARTPHONE;
            let model = testProduct.model;
            const response = await request(app).get(`${baseURL}/available`).query({ grouping: grouping, category: category, model: model });
            expect(response.status).toBe(422);
            expect(ProductController.prototype.getAvailableProducts).toHaveBeenCalledTimes(0);

            jest.clearAllMocks();
        });

        test("grouping=model and and model empty-> It should return  422", async () => {
            jest.spyOn(Authenticator.prototype, "isLoggedIn").mockImplementation((req, res, next) => next())
            let grouping = "model";
            let category = null;
            let model = "";
            const response = await request(app).get(`${baseURL}/available`).query({ grouping: grouping, category: category, model: model });
            expect(response.status).toBe(422);
            expect(ProductController.prototype.getAvailableProducts).toHaveBeenCalledTimes(0);

            jest.clearAllMocks();
        });

        test("grouping=category and and category empty-> It should return  422", async () => {
            jest.spyOn(Authenticator.prototype, "isLoggedIn").mockImplementation((req, res, next) => next())
            let grouping = "category";
            let category = "";
            let model = null;
            const response = await request(app).get(`${baseURL}/available`).query({ grouping: grouping, category: category, model: model });
            expect(response.status).toBe(422);
            expect(ProductController.prototype.getAvailableProducts).toHaveBeenCalledTimes(0);

            jest.clearAllMocks();
        });

        test("grouping=model and model not in db-> It should return  404", async () => {
            jest.spyOn(Authenticator.prototype, "isLoggedIn").mockImplementation((req, res, next) => next())
            jest.spyOn(ProductController.prototype, "getAvailableProducts").mockRejectedValueOnce(new ProductNotFoundError())
            let grouping = "model";
            let category = null;
            let model = "PS6";
            const response = await request(app).get(`${baseURL}/available`).query({ grouping: grouping, category: category, model: model });
            expect(response.status).toBe(404);
            expect(ProductController.prototype.getAvailableProducts).toHaveBeenCalledTimes(1);

            jest.clearAllMocks();
        });

        test("grouping=null and model not in db-> It should return  404", async () => {
            jest.spyOn(Authenticator.prototype, "isLoggedIn").mockImplementation((req, res, next) => next())
            let grouping = null;
            let category = null;
            let model = "PS6";
            const response = await request(app).get(`${baseURL}/available`).query({ grouping: grouping, category: category, model: model });
            expect(response.status).toBe(422);
            expect(ProductController.prototype.getAvailableProducts).toHaveBeenCalledTimes(0);

            jest.clearAllMocks();
        });


        test("It should return all the smiphone15 with status 200", async () => {
            jest.spyOn(Authenticator.prototype, "isLoggedIn").mockImplementation((req, res, next) => next())
            let grouping = "model";
            let category = Category.SMARTPHONE;
            let model = testProduct.model;
            const response = await request(app).get(`${baseURL}/available`).query({ grouping: grouping, category: category, model: model });
            expect(response.status).toBe(422);
            expect(ProductController.prototype.getAvailableProducts).toHaveBeenCalledTimes(0);

            jest.clearAllMocks();
        });



        test("It should return a 403 error for unauthorized access", async () => {
            jest.spyOn(Authenticator.prototype, "isLoggedIn").mockImplementation((req, res, next) => res.status(403).send({ error: "Unauthorized" }));
            const response = await request(app).get(`${baseURL}/available`);
            expect(response.status).toBe(403);
            jest.clearAllMocks();
        });

    });


    describe("DELETE /products/:model", () => {
        test("It should return a 200 success code", async () => {
            jest.spyOn(Authenticator.prototype, "isLoggedIn").mockImplementation((req, res, next) => next())
            jest.spyOn(Authenticator.prototype, "isAdminOrManager").mockImplementation((req, res, next) => next())
            jest.spyOn(ProductController.prototype, "deleteProduct").mockResolvedValueOnce(true)

            const response = await request(app).delete(`${baseURL}/${testProduct.model}`);
            expect(response.status).toBe(200);
            expect(ProductController.prototype.deleteProduct).toHaveBeenCalled();
            expect(ProductController.prototype.deleteProduct).toHaveBeenCalledWith(testProduct.model);
        });

        test("It should return a 404 error when the product is not found", async () => {
            jest.spyOn(Authenticator.prototype, "isLoggedIn").mockImplementation((req, res, next) => next())
            jest.spyOn(Authenticator.prototype, "isAdminOrManager").mockImplementation((req, res, next) => next())
            jest.spyOn(ProductController.prototype, "deleteProduct").mockImplementation(() => { throw new ProductNotFoundError() });

            const response = await request(app).delete(`${baseURL}/${testProduct.model}`);
            expect(response.status).toBe(404);
        });


        test("It should return a 403 error for unauthorized access", async () => {
            jest.spyOn(Authenticator.prototype, "isLoggedIn").mockImplementation((req, res, next) => res.status(403).send({ error: "Unauthorized" }));

            const response = await request(app).delete(`${baseURL}/${testProduct.model}`);
            expect(response.status).toBe(403);
        });

    });


    describe("DELETE /products", () => {
        test("It should return a 200 success code", async () => {
            jest.spyOn(Authenticator.prototype, "isLoggedIn").mockImplementation((req, res, next) => next())
            jest.spyOn(Authenticator.prototype, "isAdminOrManager").mockImplementation((req, res, next) => next())
            jest.spyOn(ProductController.prototype, "deleteAllProducts").mockResolvedValueOnce(true)

            const response = await request(app).delete(`${baseURL}`);
            expect(response.status).toBe(200);
            expect(ProductController.prototype.deleteAllProducts).toHaveBeenCalled();
        });

        test("It should return a 403 error for unauthorized access", async () => {
            jest.spyOn(Authenticator.prototype, "isLoggedIn").mockImplementation((req, res, next) => res.status(403).send({ error: "Unauthorized" }));

            const response = await request(app).delete(`${baseURL}`);
            expect(response.status).toBe(403);
        });
    });


});
