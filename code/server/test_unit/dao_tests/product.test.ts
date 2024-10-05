import { test, expect, jest, describe } from "@jest/globals"
import db from "../../src/db/db"
import ProductDAO from "../../src/dao/productDAO"
import { Category, Product } from "../../src/components/product";
import { ProductAlreadyExistsError, ProductNotFoundError } from "../../src/errors/productError";
import { Database, EMPTY } from "sqlite3"
import { assert } from "node:console"

jest.mock("../../src/db/db.ts")
jest.setTimeout(100000);

//Product tests
//Parameters checks are done in the Routes, so here I should not pass wrong parameters

//Insert a new product that is not in db yet. Should return an empty promise
describe("Product DAO unit tests", () => {
    describe("deleteProductsByModel", () => {

        test("deleteProduct - dovrebbe risolvere con true se il prodotto è stato eliminato correttamente", async () => {
            const productDAO = new ProductDAO()
            const mockDBRun = jest.spyOn(db, "run").mockImplementation((sql, params, callback) => {
                callback(null)
                return {} as Database
            });

            const result = await productDAO.deleteProductsByModel("iPhone15")

            expect(result).toBe(true)

            mockDBRun.mockRestore()

        })

        test("deleteProduct - dovrebbe rifiutare con un errore del database", async () => {
            const productDAO = new ProductDAO()
            const mockDBRun = jest.spyOn(db, "run").mockImplementation((sql, params, callback) => {
                const error = new Error("Database error")
                callback(error)
                return {} as Database
            });

            await expect(productDAO.deleteProductsByModel("iPhone 13")).rejects.toThrow("Database error")

            mockDBRun.mockRestore()

        })
    });


    describe("deleteAllProducts", () => {

        test("deleteAllProducts - dovrebbe risolvere con true se tutti i prodotti sono stati eliminati correttamente", async () => {
            const productDAO = new ProductDAO()
            const mockDBRun = jest.spyOn(db, "run").mockImplementation((sql, params, callback) => {
                callback(null)
                return {} as Database
            });

            const result = await productDAO.deleteAllProducts()

            expect(result).toBe(true)

            mockDBRun.mockRestore()

        });

        test("deleteAllProducts - dovrebbe rifiutare con un errore del database", async () => {
            const productDAO = new ProductDAO()
            const mockDBRun = jest.spyOn(db, "run").mockImplementation((sql, params, callback) => {
                const error = new Error("Database error")
                callback(error)
                return {} as Database
            });

            await expect(productDAO.deleteAllProducts()).rejects.toThrow("Database error")

            mockDBRun.mockRestore()

        });

    });

    describe("sellProduct", () => {
        test("sellProduct - dovrebbe risolvere non la nuova quantità", async () => {
            const productDAO = new ProductDAO()
            const mockDBRun = jest.spyOn(db, "run").mockImplementation((sql, params, callback) => {
                callback(null)
                return {} as Database
            });

            const result = await productDAO.sellProduct("iphone15", 2);

            expect(result).toBe(2)

            mockDBRun.mockRestore

        })
        test("sellProduct - dovrebbe risolvere non la nuova quantità", async () => {
            const productDAO = new ProductDAO()
            const mockDBRun = jest.spyOn(db, "run").mockImplementation((sql, params, callback) => {
                const error = new Error("Database error")
                callback(error)
                return {} as Database
            });

            await expect(productDAO.sellProduct("iPhone15", 3)).rejects.toThrow("Database error")

            mockDBRun.mockRestore

        })


    });


    describe("getAvailableProductsByCategory", () => {
        test("getAvailableProductsByCategory - dovrebbe risolvere con un array di prodotti disponibili per una categoria specifica", async () => {
            const productDAO = new ProductDAO()
            const mockDBAll = jest.spyOn(db, "all").mockImplementation((sql, params, callback) => {
                const rows = [
                    {
                        selling_price: 800,
                        model: "iPhone15",
                        category: Category.SMARTPHONE,
                        arrival_date: "2024-01-01",
                        details: "blue, 128Gb",
                        quantity: 20
                    }
                ]
                callback(null, rows)
                return {} as Database
            });

            const result = await productDAO.getAvaliableProductsByCategory(Category.SMARTPHONE)

            expect(result).toEqual([new Product(
                800,
                "iPhone15",
                Category.SMARTPHONE,
                "2024-01-01",
                "blue, 128Gb",
                20
            )])

            mockDBAll.mockRestore()
        })

        test("getAvailableProductsByCategory - dovrebbe rifiutare con un errore del database", async () => {
            const productDAO = new ProductDAO()
            const mockDBAll = jest.spyOn(db, "all").mockImplementation((sql, params, callback) => {
                const error = new Error("Database error")
                callback(error, null)
                return {} as Database
            });

            await expect(productDAO.getAvaliableProductsByCategory(Category.APPLIANCE)).rejects.toThrow("Database error")

            mockDBAll.mockRestore()
        })

    });



    describe("getAvailableProductsByModel", () => {
        test("getAvailableProductsByModel - dovrebbe risolvere con un array di prodotti disponibili per un modello specifico", async () => {
            const productDAO = new ProductDAO()
            const mockDBAll = jest.spyOn(db, "all").mockImplementation((sql, params, callback) => {
                const rows = [
                    {
                        selling_price: 800,
                        model: "iPhone15",
                        category: Category.SMARTPHONE,
                        arrival_date: "2024-01-01",
                        details: "blue, 158Gb",
                        quantity: 20
                    }
                ]
                callback(null, rows)
                return {} as Database
            });

            const result = await productDAO.getAvaliableProductsByModel("iPhone15")

            expect(result).toEqual([new Product(
                800,
                "iPhone15",
                Category.SMARTPHONE,
                "2024-01-01",
                "blue, 158Gb",
                20
            )])

            mockDBAll.mockRestore()
        })


        test("getAvailableProductsByModel - dovrebbe rifiutare con un errore del database", async () => {
            const productDAO = new ProductDAO()
            const mockDBAll = jest.spyOn(db, "all").mockImplementation((sql, params, callback) => {
                const error = new Error("Database error")
                callback(error, null)
                return {} as Database
            });

            await expect(productDAO.getAvaliableProductsByCategory("iPhone16")).rejects.toThrow("Database error")

            mockDBAll.mockRestore()
        })


    });

    describe("getAllAvailableProducts", () => {
        test("getAllAvailableProducts - dovrebbe rifiutare con un errore del database", async () => {
            const productDAO = new ProductDAO()
            const mockDBAll = jest.spyOn(db, "all").mockImplementation((sql, callback) => {
                const error = new Error("Database error")
                callback(error, null)
                return {} as Database
            });

            await expect(productDAO.getAllAvaliableProducts()).rejects.toThrow("Database error")

            mockDBAll.mockRestore()
        })

    });

    describe("getProductsByCategory", () => {
        test("getProductsByCategory - dovrebbe risolvere con un array di prodotti per una categoria specifica", async () => {
            const productDAO = new ProductDAO()
            const mockDBAll = jest.spyOn(db, "all").mockImplementation((sql, params, callback) => {
                const rows = [
                    {
                        selling_price: 800,
                        model: "iPhone15",
                        category: Category.SMARTPHONE,
                        arrival_date: "2024-01-01",
                        details: "blue, 128Gb",
                        quantity: 20
                    }
                ]
                callback(null, rows)
                return {} as Database
            });

            const result = await productDAO.getProductsByCategory(Category.SMARTPHONE)

            expect(result).toEqual([new Product(
                800,
                "iPhone15",
                Category.SMARTPHONE,
                "2024-01-01",
                "blue, 128Gb",
                20
            )])

            mockDBAll.mockRestore()
        })

        test("getProductsByModel - dovrebbe rifiutare con un errore del database", async () => {
            const productDAO = new ProductDAO()
            const mockDBAll = jest.spyOn(db, "all").mockImplementation((sql, params, callback) => {
                const error = new Error("Database error")
                callback(error, null)
                return {} as Database
            });

            await expect(productDAO.getProductsByCategory("pizza")).rejects.toThrow("Database error")

            mockDBAll.mockRestore()
        })

    });

    describe("getProductsByModel", () => {
        test("getProductsByModel - dovrebbe risolvere con un array di prodotti per un modello specifico", async () => {
            const productDAO = new ProductDAO()
            const mockDBAll = jest.spyOn(db, "all").mockImplementation((sql, params, callback) => {
                const rows = [
                    {
                        selling_price: 800,
                        model: "iPhone15",
                        category: Category.SMARTPHONE,
                        arrival_date: "2024-01-01",
                        details: "blue, 128Gb",
                        quantity: 20
                    }
                ]
                callback(null, rows)
                return {} as Database
            });


            const result = await productDAO.getProductsByModel("iPhone15")

            expect(result).toEqual([new Product(
                800,
                "iPhone15",
                Category.SMARTPHONE,
                "2024-01-01",
                "blue, 128Gb",
                20
            )])

            mockDBAll.mockRestore()
        })

        test("getProductsByModel - dovrebbe rifiutare con un errore del database", async () => {
            const productDAO = new ProductDAO()
            const mockDBAll = jest.spyOn(db, "all").mockImplementation((sql, params, callback) => {
                const error = new Error("Database error")
                callback(error, null)
                return {} as Database
            });

            await expect(productDAO.getProductsByModel("iPhone158")).rejects.toThrow("Database error")

            mockDBAll.mockRestore()
        })
    });


    describe("getAllProducts", () => {
        test("getAllProducts - dovrebbe risolvere con un array di prodotti", async () => {
            const productDAO = new ProductDAO()
            const mockDBAll = jest.spyOn(db, "all").mockImplementation((sql, callback) => {
                const rows = [
                    {
                        selling_price: 800,
                        model: "iPhone15",
                        category: Category.SMARTPHONE,
                        arrival_date: "2024-01-01",
                        details: "blue, 128Gb",
                        quantity: 20
                    }
                ]
                callback(null, rows)
                return {} as Database
            });

            const result = await productDAO.getAllProducts()

            expect(result).toEqual([new Product(
                800,
                "iPhone15",
                Category.SMARTPHONE,
                "2024-01-01",
                "blue, 128Gb",
                20
            )])

            mockDBAll.mockRestore()
        })

        test("getAllProducts - dovrebbe rifiutare con un errore del database", async () => {
            const productDAO = new ProductDAO()
            const mockDBAll = jest.spyOn(db, "all").mockImplementation((sql, callback) => {
                const error = new Error("Database error")
                callback(error, null)
                return {} as Database
            });

            await expect(productDAO.getAllProducts()).rejects.toThrow("Database error")

            mockDBAll.mockRestore()
        })


    });


    describe("updateProductQuantity", () => {

        test("updateProductQuantity - dovrebbe risolvere non la nuova quantità", async () => {
            const productDAO = new ProductDAO()
            const mockDBRun = jest.spyOn(db, "run").mockImplementation((sql, params, callback) => {
                callback(null)
                return {} as Database
            });

            const result = await productDAO.updateProductQuantity("iphone15", 2);

            expect(result).toBe(2)

            mockDBRun.mockRestore

        })
        test("updateProductQuantity - dovrebbe ritornare errore", async () => {
            const productDAO = new ProductDAO()
            const mockDBRun = jest.spyOn(db, "run").mockImplementation((sql, params, callback) => {
                const error = new Error("Database error")
                callback(error)
                return {} as Database
            });

            await expect(productDAO.updateProductQuantity("iPhone15", 3)).rejects.toThrow("Database error")

            mockDBRun.mockRestore

        })

    });


    describe("getProductByModel", () => {

        test("getProductByModel - It should resolve with a product", async () => {
            const productDAO = new ProductDAO()
            const mockDBGet = jest.spyOn(db, "get").mockImplementation((sql, params, callback) => {
                const row = {
                    selling_price: 800,
                    model: "iPhone15",
                    category: Category.SMARTPHONE,
                    arrival_date: "2024-01-01",
                    details: "Clue, 138Gb",
                    quantity: 20
                }
                callback(null, row)
                return {} as Database
            });

            const result = await productDAO.getProductByModel("iPhone15")

            expect(result).toEqual(new Product(
                800,
                "iPhone15",
                Category.SMARTPHONE,
                "2024-01-01",
                "Clue, 138Gb",
                20
            ))

            mockDBGet.mockRestore()
        })

        test("getProductByModel - It should reject with ProductNotFoundError if no product is found", async () => {
            const productDAO = new ProductDAO()
            const mockDBGet = jest.spyOn(db, "get").mockImplementation((sql, params, callback) => {
                callback(null, null)
                return {} as Database

            });

            const result = await productDAO.getProductByModel("iPhone15")

            expect(result).toEqual(null);

            mockDBGet.mockRestore()
        })

        test("getProductByModel - It should reject with an error if there is a database error", async () => {
            const productDAO = new ProductDAO()
            const mockDBGet = jest.spyOn(db, "get").mockImplementation((sql, params, callback) => {
                const error = new Error("Database error")
                callback(error, null)
                return {} as Database
            });

            await expect(productDAO.getProductByModel("iPhone 13"))
                .rejects
                .toThrow("Database error")

            mockDBGet.mockRestore()
        })

    });


    describe("registerProduct", () => {
        test("registerProduct - dovrebbe risolvere con true se il prodotto è stato registrato correttamente", async () => {
            const productDAO = new ProductDAO()
            const mockDBRun = jest.spyOn(db, "run").mockImplementation((sql, params, callback) => {
                callback(null)
                return {} as Database
            });

            const result = await productDAO.registerProduct("iPhone15", Category.SMARTPHONE, 50, "Clue, 125Gb", 800, "2024-01-01")

            expect(result).toBe(undefined)

            mockDBRun.mockRestore()
        })

        test("registerProduct - dovrebbe rifiutare con un errore del database", async () => {
            const productDAO = new ProductDAO()
            const mockDBRun = jest.spyOn(db, "run").mockImplementation((sql, params, callback) => {
                const error = new Error("Database error")
                callback(error)
                return {} as Database
            });

            await expect(productDAO.registerProduct("iPhone15", "pizza", 50, "Clue, 125Gb", 800, "2024-01-01"))
                .rejects
                .toThrow("Database error")

            mockDBRun.mockRestore()
        })
    });


});
