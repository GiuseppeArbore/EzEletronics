import { test, expect, jest, describe } from "@jest/globals"
import ProductController from "../../src/controllers/productController"
import { EmptyProductStockError, LowProductStockError, ProductAlreadyExistsError, ProductNotFoundError, ProposedDateTooEarlyError } from "../../src/errors/productError"
import { DateError } from "../../src/utilities"
import { Category, Product } from "../../src/components/product"
import ProductDAO from "../../src/dao/productDAO"

jest.mock("../../src/dao/productDAO")
jest.setTimeout(100000);

//Product tests
//Parameters checks are done in the Routes, so here I should not pass wrong parameters

//Insert a new product that is not in db yet. Should return an empty promise
describe("Product controller unit tests", () => {

    describe("registerProducts", () => {

        test("Insert new product succesfully", async () => {
            let productController = new ProductController();

            const testProduct = {
                model: "galaxys21",
                category: Category.SMARTPHONE,
                quantity: 5,
                details: "128GB, Blue",
                sellingPrice: 800.00,
                arrivalDate: "2023-01-01"
            }
            jest.spyOn(ProductDAO.prototype, "getProductByModel").mockResolvedValue(null);    //todo: to be fixed; maybe true/false
            const response = await productController.registerProducts(testProduct.model, testProduct.category, testProduct.quantity, testProduct.details, testProduct.sellingPrice, testProduct.arrivalDate)

            expect(ProductDAO.prototype.registerProduct).toHaveBeenCalledTimes(1);
            expect(ProductDAO.prototype.registerProduct).toHaveBeenCalledWith(testProduct.model, testProduct.category, testProduct.quantity, testProduct.details, testProduct.sellingPrice, testProduct.arrivalDate);
            expect(response).toBe(undefined)

            jest.clearAllMocks();
        })

        test("reject in DAOgetProductByModel ", async () => {
            let productController = new ProductController();

            const testProduct = {
                model: "galaxys21",
                category: Category.SMARTPHONE,
                quantity: 5,
                details: "128GB, Blue",
                sellingPrice: 800.00,
                arrivalDate: "2023-01-01"
            }
            jest.spyOn(ProductDAO.prototype, "getProductByModel").mockRejectedValueOnce(new Error("dbError"));    //todo: to be fixed; maybe true/false
            await expect(productController.registerProducts(testProduct.model, testProduct.category,
                testProduct.quantity, testProduct.details, testProduct.sellingPrice, testProduct.arrivalDate))
                .rejects
                .toThrow(Error)

            expect(ProductDAO.prototype.registerProduct).toHaveBeenCalledTimes(0);
            jest.clearAllMocks();

        })


        //Insert a new product that isn't in db without specifiyng arrivalDate. Should return an empty promise
        test("Insert new product - no date", async () => {
            let productController = new ProductController();

            const testProduct = {
                model: "galaxys21",
                category: Category.SMARTPHONE,
                quantity: 5,
                details: "128GB, Blue",
                sellingPrice: 800.00,
                arrivalDate: ""
            }
            jest.spyOn(ProductDAO.prototype, "getProductByModel").mockResolvedValue(null);    //todo: to be fixed

            const response = await productController.registerProducts(testProduct.model, testProduct.category, testProduct.quantity, testProduct.details, testProduct.sellingPrice, testProduct.arrivalDate)


            expect(ProductDAO.prototype.registerProduct).toHaveBeenCalledWith(testProduct.model, testProduct.category, testProduct.quantity, testProduct.details, testProduct.sellingPrice, testProduct.arrivalDate);
            expect(response).toBe(undefined)
            jest.clearAllMocks();
        })

        //Insert a product that is already in the DB. Should return an error
        test("Insert existing product: should throw ProductAlreadyExistsError if the product already exists", async () => {
            let productController = new ProductController();

            const testProduct = {
                model: "galaxys21",
                category: Category.SMARTPHONE,
                quantity: 5,
                details: "128GB, Blue",
                sellingPrice: 800.00,
                arrivalDate: "2023-01-01"
            }
            jest.spyOn(ProductDAO.prototype, "getProductByModel").mockResolvedValueOnce(
                new Product(testProduct.sellingPrice, testProduct.model, testProduct.category, testProduct.arrivalDate,
                    testProduct.details, testProduct.quantity)
            );

            await expect(productController.registerProducts(testProduct.model, testProduct.category,
                testProduct.quantity, testProduct.details, testProduct.sellingPrice, testProduct.arrivalDate))
                .rejects
                .toThrow(ProductAlreadyExistsError)

            jest.clearAllMocks();

        })


    });


    describe("changeProductQuantity", () => {

        test("change product quantity-should change the quantity of a product successfully", async () => {
            let productController = new ProductController();

            const testProduct = {
                model: "galaxys21",
                category: Category.SMARTPHONE,
                quantity: 5,
                details: "128GB, Blue",
                sellingPrice: 800.00,
                arrivalDate: "2023-01-01"
            }
            const newQuantity = 9
            const changeDate = "2024-01-01"

            jest.spyOn(ProductDAO.prototype, "getProductByModel").mockResolvedValue(
                new Product(testProduct.sellingPrice, testProduct.model, testProduct.category,
                    testProduct.arrivalDate, testProduct.details, testProduct.quantity)); //Mock the getProductFromModel method of the DAO

            jest.spyOn(ProductDAO.prototype, "updateProductQuantity").mockResolvedValue(9); //Mock the changeProductQuantity method of the DAO

            const result = await productController.changeProductQuantity(testProduct.model, newQuantity, changeDate);

            expect(ProductDAO.prototype.getProductByModel).toHaveBeenCalledTimes(1);
            expect(ProductDAO.prototype.getProductByModel).toHaveBeenCalledWith(testProduct.model);
            expect(result).toBe(9);
            jest.clearAllMocks();

        });

        test("change product quantity-should throw DateError if the change date is after the current date", async () => {
            let productController = new ProductController();;

            var today = new Date();

            const testProduct = {
                model: "galaxys21",
                category: Category.SMARTPHONE,
                quantity: 5,
                details: "128GB, Blue",
                sellingPrice: 800.00,
                arrivalDate: "2023-01-01"
            }
            const newQuantity = 9
            const changeDate = (today.getFullYear() + 5) + "-08-08"
            jest.spyOn(ProductDAO.prototype, "getProductByModel").mockResolvedValue(
                new Product(testProduct.sellingPrice, testProduct.model, testProduct.category,
                    testProduct.arrivalDate, testProduct.details, testProduct.quantity)); //Mock the getProductFromModel method of the DAO

            jest.spyOn(ProductDAO.prototype, "updateProductQuantity").mockRejectedValue(new DateError()); //data nel futuro

            expect(ProductDAO.prototype.getProductByModel).toHaveBeenCalledTimes(0);

            await expect(productController.changeProductQuantity(testProduct.model, newQuantity, changeDate))
                .rejects
                .toThrow(DateError);


            jest.clearAllMocks();

        });

        test("change product quantity-should throw ProductNotFoundError if the product does not exist", async () => {
            let productController = new ProductController();;

            const testProduct = {
                model: "galaxys21",
                category: Category.SMARTPHONE,
                quantity: 5,
                details: "128GB, Blue",
                sellingPrice: 800.00,
                arrivalDate: "2023-01-01"
            }
            const newQuantity = 5;
            const changeDate = "2024-01-01";

            // Mocking the getProductFromModel method of ProductDAO to throw an error
            jest.spyOn(ProductDAO.prototype, "getProductByModel").mockResolvedValue(null); //Mock the getProductFromModel method of the DAO

            await expect(productController.changeProductQuantity(testProduct.model, newQuantity, changeDate))
                .rejects
                .toThrow(ProductNotFoundError);

            jest.clearAllMocks();

        });

        test("change product quantity-should throw ProposedDateTooEarlyError if the change date is before the product's arrivalDate", async () => {
            let productController = new ProductController();;

            const testProduct = {
                model: "galaxys21",
                category: Category.SMARTPHONE,
                quantity: 5,
                details: "128GB, Blue",
                sellingPrice: 800.00,
                arrivalDate: "2023-01-01"
            }
            const newQuantity = 9
            const changeDate = "2021-01-01"

            jest.spyOn(ProductDAO.prototype, "getProductByModel").mockResolvedValueOnce(
                new Product(testProduct.sellingPrice, testProduct.model, testProduct.category,
                    testProduct.arrivalDate, testProduct.details, testProduct.quantity)); //Mock the getProductByModel method of the DAO


            await expect(productController.changeProductQuantity(testProduct.model, newQuantity, changeDate))
                .rejects
                .toThrow(ProposedDateTooEarlyError);

            expect(ProductDAO.prototype.getProductByModel).toHaveBeenCalledTimes(1);
            expect(ProductDAO.prototype.getProductByModel).toHaveBeenCalledWith(testProduct.model);
            expect(ProductDAO.prototype.updateProductQuantity).toHaveBeenCalledTimes(0);
            jest.clearAllMocks();

        });


    });


    describe("sellProduct", () => {
        test("should sell a product successfully", async () => {
            let productController = new ProductController();

            const testProduct = {
                model: "galaxys21",
                category: Category.SMARTPHONE,
                quantity: 5,
                details: "128GB, Blue",
                sellingPrice: 800.00,
                arrivalDate: "2023-01-01"
            }

            const model = "galaxys21";
            const quantityToSell = 3;
            const sellingDate = "2024-01-01";

            jest.spyOn(ProductDAO.prototype, "getProductByModel").mockResolvedValueOnce(
                new Product(testProduct.sellingPrice, testProduct.model, testProduct.category,
                    testProduct.arrivalDate, testProduct.details, testProduct.quantity)); //Mock the getProductByModel method of the DAO

            jest.spyOn(ProductDAO.prototype, "sellProduct").mockResolvedValueOnce(2); //Mock the changeProductQuantity method of the DAO


            const result = await productController.sellProduct(model, quantityToSell, sellingDate);

            expect(ProductDAO.prototype.getProductByModel).toHaveBeenCalledWith(testProduct.model);


            expect(result).toBe(2);
            jest.clearAllMocks();

        });

        test("sell error in dao.sellProduct", async () => {
            let productController = new ProductController();

            const testProduct = {
                model: "galaxys21",
                category: Category.SMARTPHONE,
                quantity: 5,
                details: "128GB, Blue",
                sellingPrice: 800.00,
                arrivalDate: "2023-01-01"
            }

            const model = "galaxys21";
            const quantityToSell = 3;
            const sellingDate = "2024-01-01";

            jest.spyOn(ProductDAO.prototype, "getProductByModel").mockResolvedValueOnce(
                new Product(testProduct.sellingPrice, testProduct.model, testProduct.category,
                    testProduct.arrivalDate, testProduct.details, testProduct.quantity)); //Mock the getProductByModel method of the DAO

            jest.spyOn(ProductDAO.prototype, "sellProduct").mockRejectedValue(new Error("unknown")); //Mock the changeProductQuantity method of the DAO


            await expect(productController.sellProduct(model, quantityToSell, sellingDate))
                .rejects
                .toThrow(Error);

            expect(ProductDAO.prototype.getProductByModel).toHaveBeenCalledWith(testProduct.model);


            jest.clearAllMocks();

        });

        test("sell error in dao.getProductByModel", async () => {
            let productController = new ProductController();

            const testProduct = {
                model: "galaxys21",
                category: Category.SMARTPHONE,
                quantity: 5,
                details: "128GB, Blue",
                sellingPrice: 800.00,
                arrivalDate: "2023-01-01"
            }

            const model = "galaxys21";
            const quantityToSell = 3;
            const sellingDate = "2024-01-01";

            jest.spyOn(ProductDAO.prototype, "getProductByModel").mockRejectedValue(new Error())//Mock the getProductByModel method of the DAO


            await expect(productController.sellProduct(model, quantityToSell, sellingDate))
                .rejects
                .toThrow(Error);

            expect(ProductDAO.prototype.getProductByModel).toHaveBeenCalledWith(testProduct.model);
            expect(ProductDAO.prototype.sellProduct).toHaveBeenCalledTimes(0);
            jest.clearAllMocks();

        });

        test("sell -should throw ProductNotFoundError if the product does not exist", async () => {
            let productController = new ProductController();

            const testProduct = {
                model: "galaxys21",
                category: Category.SMARTPHONE,
                quantity: 5,
                details: "128GB, Blue",
                sellingPrice: 800.00,
                arrivalDate: "2023-01-01"
            }

            const model = "galaxys21";
            const quantityToSell = 3;
            const sellingDate = "2024-01-01";


            // Mocking the getProductByModel method of ProductDAO to return null
            jest.spyOn(ProductDAO.prototype, "getProductByModel").mockResolvedValue(null);

            await expect(productController.sellProduct(testProduct.model, quantityToSell, sellingDate))
                .rejects
                .toThrow(ProductNotFoundError);

            expect(ProductDAO.prototype.getProductByModel).toHaveBeenCalledWith(testProduct.model);
            jest.clearAllMocks();

        });

        test("should throw ProposedDateTooEarlyError if the selling date is before the product's arrivalDate", async () => {
            let productController = new ProductController();;

            const testProduct = {
                model: "galaxys21",
                category: Category.SMARTPHONE,
                quantity: 5,
                details: "128GB, Blue",
                sellingPrice: 800.00,
                arrivalDate: "2023-01-01"
            }

            const model = "galaxys21";
            const quantityToSell = 3;
            const sellingDate = "2022-01-01";


            // Mocking the getProductFromModel method of ProductDAO to return a product
            jest.spyOn(ProductDAO.prototype, "getProductByModel").mockResolvedValue(
                new Product(testProduct.sellingPrice, testProduct.model, testProduct.category,
                    testProduct.arrivalDate, testProduct.details, testProduct.quantity));


            await expect(productController.sellProduct(testProduct.model, quantityToSell, sellingDate))
                .rejects
                .toThrow(ProposedDateTooEarlyError);

            expect(ProductDAO.prototype.getProductByModel).toHaveBeenCalledWith(testProduct.model);


            jest.clearAllMocks();

        });

        test("should throw LowProductStockError if the product has no available quantity", async () => {
            let productController = new ProductController();;

            const testProduct = {
                model: "galaxys21",
                category: Category.SMARTPHONE,
                quantity: 3,
                details: "128GB, Blue",
                sellingPrice: 800.00,
                arrivalDate: "2023-01-01"
            }

            const model = "galaxys21";
            const quantityToSell = 4;
            const sellingDate = "2024-01-01";


            // Mocking the getProductFromModel method of ProductDAO to return a product
            jest.spyOn(ProductDAO.prototype, "getProductByModel").mockResolvedValue(
                new Product(testProduct.sellingPrice, testProduct.model, testProduct.category,
                    testProduct.arrivalDate, testProduct.details, testProduct.quantity));


            await expect(productController.sellProduct(testProduct.model, quantityToSell, sellingDate))
                .rejects
                .toThrow(LowProductStockError);


            expect(ProductDAO.prototype.getProductByModel).toHaveBeenCalledWith(testProduct.model);

            jest.clearAllMocks();

        });


        test("sell product-should throw EmptyProductStockError if the product has no available quantity", async () => {
            let productController = new ProductController();;

            const testProduct = {
                model: "galaxys21",
                category: Category.SMARTPHONE,
                quantity: 0,
                details: "128GB, Blue",
                sellingPrice: 800.00,
                arrivalDate: "2023-01-01"
            }

            const model = "galaxys21";
            const quantityToSell = 4;
            const sellingDate = "2024-01-01";


            // Mocking the getProducByModel method of ProductDAO to return a product
            jest.spyOn(ProductDAO.prototype, "getProductByModel").mockResolvedValue(
                new Product(testProduct.sellingPrice, testProduct.model, testProduct.category,
                    testProduct.arrivalDate, testProduct.details, testProduct.quantity));


            await expect(productController.sellProduct(testProduct.model, quantityToSell, sellingDate))
                .rejects
                .toThrow(EmptyProductStockError);

            expect(ProductDAO.prototype.getProductByModel).toHaveBeenCalledWith(testProduct.model);

            jest.clearAllMocks();

        });


    });

    describe("getProducts", () => {
        test("should return a list of all products", async () => {
            let productController = new ProductController();

            const products = [
                new Product(800.00, "iPhone15", Category.SMARTPHONE, "2023-05-01", "128GB, Blue", 10),
                new Product(600.00, "Galaxys21", Category.SMARTPHONE, "2024-01-01", "128GB, Blue", 5)
            ];

            jest.spyOn(ProductDAO.prototype, "getAllProducts").mockResolvedValueOnce(products); //Mock the getProducts method of the DAO

            const result = await productController.getProducts(null, null, null);

            expect(result).toEqual(products);
            jest.clearAllMocks();

        });

        test("error nella dao.getall products", async () => {
            let productController = new ProductController();

            jest.spyOn(ProductDAO.prototype, "getAllProducts").mockRejectedValue(new Error()); //Mock the getProducts method of the DAO

            await expect(productController.getProducts(null, null, null)).rejects.toThrow(Error);


            jest.clearAllMocks();

        });

        test("should return a list of all SMARTPHONE products", async () => {
            let productController = new ProductController();

            const products = [
                new Product(800.00, "iPhone15", Category.SMARTPHONE, "2023-05-01", "128GB, Blue", 10),
                new Product(600.00, "Galaxys21", Category.SMARTPHONE, "2024-01-01", "128GB, Blue", 5)
            ];

            jest.spyOn(ProductDAO.prototype, "getProductsByCategory").mockResolvedValueOnce(products); //Mock the getProducts method of the DAO

            const result = await productController.getProducts("category", Category.SMARTPHONE, null);

            expect(result).toEqual(products);
            jest.clearAllMocks();

        });

        test("get products error in get products by category", async () => {
            let productController = new ProductController();

            jest.spyOn(ProductDAO.prototype, "getProductsByCategory").mockRejectedValue(new Error()); //Mock the getProducts method of the DAO

            await expect(productController.getProducts("category", Category.SMARTPHONE, null))
                .rejects
                .toThrow(Error);

            jest.clearAllMocks();

        });

        test("should return the information of iPhone15 ", async () => {
            let productController = new ProductController();

            const products = [
                new Product(800.00, "iPhone15", Category.SMARTPHONE, "2023-05-01", "128GB, Blue", 10),
                new Product(600.00, "Galaxys21", Category.SMARTPHONE, "2024-01-01", "128GB, Blue", 5)
            ];

            let output_product = [new Product(800.00, "iPhone15", Category.SMARTPHONE, "2023-05-01", "128GB, Blue", 10)];

            jest.spyOn(ProductDAO.prototype, "getProductsByModel").mockResolvedValue(output_product); //Mock the getProducts method of the DAO

            const result = await productController.getProducts("model", null, "iPhone15");

            expect(result).toEqual(output_product);
            jest.clearAllMocks();

        });


        test("get-products -- should throw ProductNotFoundError if the product does not exist", async () => {
            let productController = new ProductController();

            const model = "iPhone15";

            // Mocking the getProductByModel method of ProductDAO to throw an error
            jest.spyOn(ProductDAO.prototype, "getProductsByModel").mockRejectedValue(new ProductNotFoundError());

            await expect(productController.getProducts("model", null, model))
                .rejects
                .toThrow(ProductNotFoundError);

            expect(ProductDAO.prototype.getProductsByModel).toHaveBeenCalledWith(model);
            jest.clearAllMocks();

        });



    });


    describe("getAvailableProducts", () => {
        let productController = new ProductController();

        test("error in getAvailable - dao reject", async () => {
            jest.spyOn(ProductDAO.prototype, "getAllAvaliableProducts").mockRejectedValue(new Error()); //Mock the getProducts method of the DAO

            await expect(productController.getAvailableProducts(null, null, null)).rejects.toThrow(Error);
            jest.clearAllMocks();

        });

        test("should return a list of all available products", async () => {
            const products = [
                new Product(800.00, "iPhone15", Category.SMARTPHONE, "2023-05-01", "128GB, Blue", 10),
                new Product(800.00, "iPhone15pro", Category.SMARTPHONE, "2022-05-01", "256GB, Blue", 0),
                new Product(600.00, "Galaxys21", Category.SMARTPHONE, "2024-01-01", "128GB, Blue", 5)
            ];

            const available_products = [
                new Product(800.00, "iPhone15", Category.SMARTPHONE, "2023-05-01", "128GB, Blue", 10),
                new Product(600.00, "Galaxys21", Category.SMARTPHONE, "2024-01-01", "128GB, Blue", 5)
            ];


            jest.spyOn(ProductDAO.prototype, "getAllAvaliableProducts").mockResolvedValueOnce(available_products); //Mock the getProducts method of the DAO

            const result = await productController.getAvailableProducts(null, null, null);

            expect(result).toEqual(available_products);
            jest.clearAllMocks();

        });

        test("should return a list of all SMARTPHONE available products", async () => {
            let productController = new ProductController();

            const products = [
                new Product(800.00, "iPhone15", Category.SMARTPHONE, "2023-05-01", "128GB, Blue", 10),
                new Product(800.00, "iPhone15pro", Category.SMARTPHONE, "2022-05-01", "256GB, Blue", 0),
                new Product(600.00, "Galaxys21PC", Category.LAPTOP, "2024-01-01", "128GB, Blue", 5)
            ];

            const available_products = [
                new Product(800.00, "iPhone15", Category.SMARTPHONE, "2023-05-01", "128GB, Blue", 10)
            ];


            jest.spyOn(ProductDAO.prototype, "getAvaliableProductsByCategory").mockResolvedValueOnce(available_products); //Mock the getProducts method of the DAO

            const result = await productController.getAvailableProducts("category", Category.SMARTPHONE, null);

            expect(result).toEqual(available_products);
            jest.clearAllMocks();

        });

        test("should return a list of all iPhone15 available products", async () => {
            let productController = new ProductController();

            const products = [
                new Product(800.00, "iPhone15", Category.SMARTPHONE, "2023-05-01", "128GB, Blue", 10),
                new Product(600.00, "Galaxys21", Category.SMARTPHONE, "2024-01-01", "128GB, Blue", 5),
                new Product(800.00, "iPhone15", Category.SMARTPHONE, "2023-05-01", "256GB, Blue", 2)
            ];

            const output_products = [
                new Product(800.00, "iPhone15", Category.SMARTPHONE, "2023-05-01", "128GB, Blue", 10),
                new Product(800.00, "iPhone15", Category.SMARTPHONE, "2023-05-01", "256GB, Blue", 2)
            ];

            jest.spyOn(ProductDAO.prototype, "getAvaliableProductsByModel").mockResolvedValueOnce(output_products); //Mock the getProducts method of the DAO

            const result = await productController.getAvailableProducts("model", null, "iPhone15");

            expect(result).toEqual(output_products);
            jest.clearAllMocks();

        });


        test("getAvailable products by model- error in db", async () => {
            let productController = new ProductController();

            jest.spyOn(ProductDAO.prototype, "getAvaliableProductsByModel").mockRejectedValue(new Error()); //Mock the getProducts method of the DAO

            await expect(productController.getAvailableProducts("model", null, "iPhone15")).rejects.toThrow(Error);
            jest.clearAllMocks();

        });

        test("getAvailable products by categoty- error in db", async () => {
            let productController = new ProductController();

            jest.spyOn(ProductDAO.prototype, "getAvaliableProductsByCategory").mockRejectedValue(new Error()); //Mock the getProducts method of the DAO

            await expect(productController.getAvailableProducts("category", Category.LAPTOP, null)).rejects.toThrow(Error);
            jest.clearAllMocks();

        });


        test("available -should throw ProductNotFoundError if the product does not exist", async () => {
            jest.clearAllMocks();

            const model = "pizza";

            // Mocking the getAvaliableProductsByModel method of ProductDAO to throw an error
            jest.spyOn(ProductDAO.prototype, "getAvaliableProductsByModel").mockRejectedValue(new ProductNotFoundError());

            await expect(productController.getAvailableProducts("model", null, model))
                .rejects
                .toThrow(ProductNotFoundError);

            expect(ProductDAO.prototype.getAvaliableProductsByModel).toHaveBeenCalledWith(model);
            jest.clearAllMocks();

        });

    });

    describe("deleteAllProducts", () => {

        test("should delete all products successfully", async () => {
            let productController = new ProductController();

            jest.spyOn(ProductDAO.prototype, "deleteAllProducts").mockResolvedValueOnce(true); //Mock the deleteAllProducts method of the DAO

            const result = await productController.deleteAllProducts();

            expect(ProductDAO.prototype.deleteAllProducts).toHaveBeenCalledTimes(1);

            expect(result).toBe(true);
            jest.clearAllMocks();

        });

        test("delete all products- should throw an error if the deletion fails", async () => {
            let productController = new ProductController();

            jest.spyOn(ProductDAO.prototype, "deleteAllProducts").mockRejectedValue(new Error()); //Mock the deleteAllProducts method of the DAO

            await expect(productController.deleteAllProducts())
                .rejects
                .toThrow(Error);

            jest.clearAllMocks();

        });
    });

    describe("deleteProduct", () => {
        test("should delete a product successfully", async () => {
            let productController = new ProductController();
            const product = new Product(800.00, "iPhone15", Category.SMARTPHONE, "2023-05-01", "128GB, Blue", 10);

            const output_products = [
                new Product(800.00, "iPhone15", Category.SMARTPHONE, "2023-05-01", "128GB, Blue", 10),
                new Product(800.00, "iPhone15", Category.SMARTPHONE, "2023-05-01", "256GB, Blue", 2)
            ];

            jest.spyOn(ProductDAO.prototype, "getProductByModel").mockResolvedValueOnce(
                new Product(product.sellingPrice, product.model, product.category,
                    product.arrivalDate, product.details, product.quantity
                )
            ); //Mock the getProductByModel method of the DAO

            jest.spyOn(ProductDAO.prototype, "deleteProductsByModel").mockResolvedValueOnce(true); //Mock the deleteProduct method of the DAO

            const result = await productController.deleteProduct(product.model);

            expect(ProductDAO.prototype.deleteProductsByModel).toHaveBeenCalledWith(product.model);
            expect(ProductDAO.prototype.getProductByModel).toHaveBeenCalledWith(product.model);

            expect(result).toBe(true);
            jest.clearAllMocks();

        });

        test("delete-should throw ProductNotFoundError if the product does not exist", async () => {
            let productController = new ProductController();

            const model = "iPhone 13";

            // Mocking the deleteProduct method of ProductDAO to throw an error
            jest.spyOn(ProductDAO.prototype, "getProductByModel").mockResolvedValue(null);

            await expect(productController.deleteProduct(model))
                .rejects
                .toThrow(ProductNotFoundError);
            jest.clearAllMocks();

        });

        test("delete-should throw an error if the deletion fails", async () => {
            let productController = new ProductController();

            const product = new Product(800.00, "iPhone15", Category.SMARTPHONE, "2023-05-01", "128GB, Blue", 10);

            jest.spyOn(ProductDAO.prototype, "getProductByModel").mockResolvedValueOnce(
                new Product(product.sellingPrice, product.model, product.category,
                    product.arrivalDate, product.details, product.quantity
                )
            ); //Mock the getProductByModel method of the DAO

            jest.spyOn(ProductDAO.prototype, "deleteProductsByModel").mockRejectedValue(new Error()); //Mock the deleteProduct method of the DAO

            await expect(productController.deleteProduct(product.model))
                .rejects
                .toThrow(Error);

            jest.clearAllMocks();

        });

        test("delete-should throw an error if the deletion fails", async () => {
            let productController = new ProductController();

            const product = new Product(800.00, "iPhone15", Category.SMARTPHONE, "2023-05-01", "128GB, Blue", 10);

            jest.spyOn(ProductDAO.prototype, "getProductByModel").mockRejectedValue(new Error()); //Mock the getProductByModel method of the DAO

            await expect(productController.deleteProduct(product.model))
                .rejects
                .toThrow(Error);

            jest.clearAllMocks();

        })


    });


});

