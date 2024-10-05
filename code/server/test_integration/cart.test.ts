import { test, expect, jest, describe, beforeAll, beforeEach, afterAll } from "@jest/globals"
import request from 'supertest'
import { app } from "../index"
import { cleanup } from "../src/db/cleanup"
import CartDAO from '../src/dao/cartDAO'
import CartController from "../src/controllers/cartController"
import ProductDAO from '../src/dao/productDAO'
import { Role, User } from "../src/components/user"
import { Category } from "../src/components/product"
import dayjs from "dayjs"


//definisco url base per le richieste
jest.setTimeout(100000);
const baseURL = "/ezelectronics"
let cookieAdmin: string
let cookieCustomer1: string
let cookieCustomer2: string
let cookieManager: string
const cartDAO = new CartDAO()
const productDAO = new ProductDAO();
const cartController = new CartController();

const customer = {
    username: 'peppe.rossi',
    password: 'password',
    name: 'Peppe',
    surname: 'Rossi',
    role: Role.CUSTOMER,
    address: 'Street',
    birthdate: '1999-01-01'
}


//definisco funzione per creare e loggare un customer
async function createAndLoginCustomer1() {
    await request(app).post(`${baseURL}/users`)
        .send({
            username: 'peppe.rossi',
            password: 'password',
            name: 'Peppe',
            surname: 'Rossi',
            role: Role.CUSTOMER
        })
    const response = await request(app)
        .post(`${baseURL}/sessions`)
        .send({ username: 'peppe.rossi', password: 'password' })

    cookieCustomer1 = response.headers['set-cookie']
}

async function createAndLoginCustomer2() {
    await request(app).post(`${baseURL}/users`)
        .send({
            username: 'michele.rossi',
            password: 'password',
            name: 'Michele',
            surname: 'Rossi',
            role: Role.CUSTOMER
        })
    const response = await request(app)
        .post(`${baseURL}/sessions`)
        .send({ username: 'michele.rossi', password: 'password' })

    cookieCustomer2 = response.headers['set-cookie']
}

//definisco funzione per creare e loggare un manager
async function createAndLoginManager() {
    await request(app).post(`${baseURL}/users`)
        .send({
            username: 'mario.verdi',
            password: 'passwordSicura123',
            name: 'Mario',
            surname: 'Verdi',
            role: Role.MANAGER
        })
    const response = await request(app)
        .post(`${baseURL}/sessions`)
        .send({ username: 'mario.verdi', password: 'passwordSicura123' })

    cookieManager = response.headers['set-cookie']
}

//definisco funzione per creare e loggare un admin
async function createAndLoginAdmin() {
    await request(app).post(`${baseURL}/users`)
        .send({
            username: 'lucia.bianchi',
            password: 'passwordIndecifrabile123',
            name: 'Lucia',
            surname: 'Bianchi',
            role: Role.ADMIN


        })
    const response = await request(app)
        .post(`${baseURL}/sessions`)
        .send({ username: 'lucia.bianchi', password: 'passwordIndecifrabile123' })

    cookieAdmin = response.headers['set-cookie']
}

//definisco un nuovo prodotto
const newProduct = {
    model: 'iPhone15',
    category: Category.SMARTPHONE,
    sellingPrice: 800,
    details: 'blue, 128Gb, 5G',
    quantity: 5,
    arrivalDate: '2024-05-20'
}

const newProductEmpty = {
    model: 'Rowenta5',
    category: Category.APPLIANCE,
    sellingPrice: 40,
    details: 'green, 5Kg',
    quantity: 0,
    arrivalDate: '2023-05-20'
}


//test per prodotto
describe('Carts integration test', () => {

    beforeAll(async () => {
        await cleanup();
        await createAndLoginCustomer1()
        await createAndLoginCustomer2()
        await createAndLoginManager()
        await createAndLoginAdmin()
    });

    afterAll(async () => {
        await cleanup();
    });

    describe('GET /carts', () => {

        beforeEach(async () => {
            await productDAO.deleteAllProducts();
            await cartDAO.deleteAllCarts();
            await productDAO.registerProduct(
                'iPhone15',
                Category.SMARTPHONE,
                6,
                'blue, 128Gb, 5G',
                800,
                '2024-05-20'
            )

            await productDAO.registerProduct(
                'GalaxyS20',
                Category.SMARTPHONE,
                0,
                'green, 64Gb, 4G',
                420,
                '2023-05-05'
            )

        })

        test('It should return 200 - Cart with products', async () => {

            await request(app)
                .post(`${baseURL}/carts`).set('Cookie', cookieCustomer1).send({ model: 'iPhone15' }).expect(200)

            const response = await request(app)
                .get(`${baseURL}/carts`).set('Cookie', cookieCustomer1)

            expect(response.status).toBe(200);
            expect(response.body).toEqual({
                customer: 'peppe.rossi',
                paid: false,
                paymentDate: null,
                total: 800,
                products: [{ model: 'iPhone15', quantity: 1, category: Category.SMARTPHONE, price: 800 }]
            }
            )
        })

        test('It should return 200 - Cart with no products', async () => {
            const response = await request(app)
                .get(`${baseURL}/carts`).set('Cookie', cookieCustomer1);

            expect(response.status).toBe(200);
            expect(response.body).toEqual({
                customer: "peppe.rossi",
                paid: false,
                paymentDate: null,
                products: [],
                total: 0
            }
            )
        })

        test('It should return 401 - Manager not authorized', async () => {
            const response = await request(app)
                .get(`${baseURL}/carts`).set('Cookie', cookieManager);
            expect(response.status).toBe(401);
        })

        test('It should return 401 - Admin not authorized', async () => {
            const response = await request(app)
                .get(`${baseURL}/carts`).set('Cookie', cookieAdmin);
            expect(response.status).toBe(401);
        })

        test('It should return 401 - Not logged not authorized', async () => {
            const response = await request(app)
                .get(`${baseURL}/carts`)
            expect(response.status).toBe(401);
        })

    })

    describe('POST /carts', () => {

        beforeEach(async () => {
            await productDAO.deleteAllProducts();
            await cartDAO.deleteAllCarts();
            await productDAO.registerProduct(
                'iPhone15',
                Category.SMARTPHONE,
                6,
                'blue, 128Gb, 5G',
                800,
                '2024-05-20'
            )

            await productDAO.registerProduct(
                'GalaxyS20',
                Category.SMARTPHONE,
                0,
                'green, 64Gb, 4G',
                420,
                '2023-05-05'
            )

        })

        test('It should return 200 - Cart with products', async () => {

            const response1 = await request(app)
                .post(`${baseURL}/carts`).set('Cookie', cookieCustomer1).send({ model: 'iPhone15' })
            expect(response1.status).toBe(200);

            const check1 = await request(app)
                .get(`${baseURL}/carts`).set('Cookie', cookieCustomer1);
            expect(check1.body).toEqual({
                customer: 'peppe.rossi',
                paid: false,
                paymentDate: null,
                total: 800,
                products: [
                    {
                        model: 'iPhone15',
                        quantity: 1,
                        category: 'Smartphone',
                        price: 800
                    }
                ]
            })

            const response2 = await request(app)
                .post(`${baseURL}/carts`).set('Cookie', cookieCustomer1).send({ model: 'iPhone15' })
            expect(response2.status).toBe(200);

            const check2 = await request(app)
                .get(`${baseURL}/carts`).set('Cookie', cookieCustomer1);
            expect(check2.body).toEqual({
                customer: 'peppe.rossi',
                paid: false,
                paymentDate: null,
                total: 1600,
                products: [
                    {
                        model: 'iPhone15',
                        quantity: 2,
                        category: 'Smartphone',
                        price: 800
                    }
                ]
            })

        })

        test('It should return 404 - The model not rapresent an existing product', async () => {
            const response = await request(app)
                .post(`${baseURL}/carts`).set('Cookie', cookieCustomer1).send({ model: 'Fake' });
            expect(response.status).toBe(404);
        })

        test('It should return 409 - The model represents a product whose available quantity is 0 ', async () => {
            const response = await request(app)
                .post(`${baseURL}/carts`).set('Cookie', cookieCustomer1).send({ model: 'GalaxyS20' });
            expect(response.status).toBe(409);
        })

        test('It should return 422 - The model parameter can not be empty ', async () => {
            const response = await request(app)
                .post(`${baseURL}/carts`).set('Cookie', cookieCustomer1)
            expect(response.status).toBe(422);
        })

        test('It should return 401 - Manager not authorized', async () => {
            const response = await request(app)
                .post(`${baseURL}/carts`).set('Cookie', cookieManager);
            expect(response.status).toBe(401);
        })

        test('It should return 401 - Admin not authorized', async () => {
            const response = await request(app)
                .post(`${baseURL}/carts`).set('Cookie', cookieAdmin);
            expect(response.status).toBe(401);
        })

        test('It should return 401 - Not logged not authorized', async () => {
            const response = await request(app)
                .post(`${baseURL}/carts`)
            expect(response.status).toBe(401);
        })

    })

    describe('PATCH /carts', () => {

        beforeEach(async () => {
            await productDAO.deleteAllProducts();
            await cartDAO.deleteAllCarts();
            await productDAO.registerProduct(
                'iPhone15',
                Category.SMARTPHONE,
                6,
                'blue, 128Gb, 5G',
                800,
                '2024-05-20'
            )

            await productDAO.registerProduct(
                'GalaxyS20',
                Category.SMARTPHONE,
                1,
                'green, 64Gb, 4G',
                420,
                '2023-05-05'
            )

            await productDAO.registerProduct(
                '',
                Category.SMARTPHONE,
                5,
                'black, 16Mb, 2G',
                50,
                '2010-02-04'
            )


        })

        test('It should return 200 - Cart paid', async () => {

            await request(app)
                .post(`${baseURL}/carts`).set('Cookie', cookieCustomer1).send({ model: 'iPhone15' }).expect(200);

            const response = await request(app)
                .patch(`${baseURL}/carts`).set('Cookie', cookieCustomer1)
            expect(response.status).toBe(200);

            const check = await request(app)
                .get(`${baseURL}/carts/history`).set('Cookie', cookieCustomer1)
            expect(response.status).toBe(200);

            expect(check.body).toEqual(
                expect.arrayContaining([
                    expect.objectContaining({
                        customer: 'peppe.rossi',
                        paid: true,
                        paymentDate: dayjs().format('YYYY-MM-DD'),
                        total: 800,
                        products: [{ model: 'iPhone15', quantity: 1, category: Category.SMARTPHONE, price: 800 }]
                    })
                ])
            )
            const productCheck = await productDAO.getProductByModel('iPhone15');
            expect(productCheck?.quantity).toEqual(5);
        })

        test('It should return 404 - no infomation about an unpaid cart in the db', async () => {
            const response = await request(app)
                .patch(`${baseURL}/carts`).set('Cookie', cookieCustomer1)
            expect(response.status).toBe(404);
        })

        test('It should return 400 - no infomation about an unpaid cart in the db', async () => {
            await request(app)
                .post(`${baseURL}/carts`).set('Cookie', cookieCustomer1).send({ model: 'iPhone15' }).expect(200);
            await request(app)
                .delete(`${baseURL}/carts/products/iPhone15`).set('Cookie', cookieCustomer1).expect(200);
            const response = await request(app)
                .patch(`${baseURL}/carts`).set('Cookie', cookieCustomer1)
            expect(response.status).toBe(400);
        })

        test('It should return 409 - There is at least one product in the cart whose available quantity in the stock is 0', async () => {
            await request(app)
                .post(`${baseURL}/carts`).set('Cookie', cookieCustomer1).send({ model: 'GalaxyS20' }).expect(200)

            productDAO.updateProductQuantity('GalaxyS20', 0);

            const response = await request(app)
                .patch(`${baseURL}/carts`).set('Cookie', cookieCustomer1)
            expect(response.status).toBe(409);
        })

        test('It should return 409 - There is at least one product in the cart whose quantity is higher than the available quantity in the stock', async () => {

            for (let i = 0; i <= 7; i++) {
                await request(app)
                    .post(`${baseURL}/carts`).set('Cookie', cookieCustomer1).send({ model: 'iPhone15' })
            }

            const response = await request(app)
                .patch(`${baseURL}/carts`).set('Cookie', cookieCustomer1)
            expect(response.status).toBe(409);
        })

        test('It should return 401 - Manager not authorized', async () => {
            const response = await request(app)
                .patch(`${baseURL}/carts`).set('Cookie', cookieManager);
            expect(response.status).toBe(401);
        })

        test('It should return 401 - Admin not authorized', async () => {
            const response = await request(app)
                .patch(`${baseURL}/carts`).set('Cookie', cookieAdmin);
            expect(response.status).toBe(401);
        })

        test('It should return 401 - Not logged not authorized', async () => {
            const response = await request(app)
                .patch(`${baseURL}/carts`)
            expect(response.status).toBe(401);
        })


    });

    describe('GET /carts/history', () => {

        beforeEach(async () => {
            await productDAO.deleteAllProducts();
            await cartDAO.deleteAllCarts();
            await productDAO.registerProduct(
                'iPhone15',
                Category.SMARTPHONE,
                6,
                'blue, 128Gb, 5G',
                800,
                '2024-05-20'
            )

            await productDAO.registerProduct(
                'GalaxyS20',
                Category.SMARTPHONE,
                0,
                'green, 64Gb, 4G',
                420,
                '2023-05-05'
            )

            await productDAO.registerProduct(
                'nokia3310',
                Category.SMARTPHONE,
                2,
                'black, 16Mb, 2G',
                50,
                '2010-02-04'
            )
        })

        test('It should return 200 - All the carts paid in the response body', async () => {
            await request(app)
                .post(`${baseURL}/carts`).set('Cookie', cookieCustomer1).send({ model: 'iPhone15' })

            await request(app)
                .patch(`${baseURL}/carts`).set('Cookie', cookieCustomer1)

            await request(app)
                .post(`${baseURL}/carts`).set('Cookie', cookieCustomer1).send({ model: 'nokia3310' })

            await request(app)
                .patch(`${baseURL}/carts`).set('Cookie', cookieCustomer1)

            const response = await request(app)
                .get(`${baseURL}/carts/history`).set('Cookie', cookieCustomer1)
            expect(response.status).toBe(200);

            expect(response.body).toEqual(
                [
                    {
                        customer: 'peppe.rossi',
                        paid: true,
                        paymentDate: dayjs().format('YYYY-MM-DD'),
                        total: 800,
                        products: [
                            {
                                model: 'iPhone15',
                                quantity: 1,
                                category: 'Smartphone',
                                price: 800
                            }
                        ]
                    },
                    {
                        customer: 'peppe.rossi',
                        paid: true,
                        paymentDate: dayjs().format('YYYY-MM-DD'),
                        total: 50,
                        products: [
                            {
                                model: 'nokia3310',
                                quantity: 1,
                                category: 'Smartphone',
                                price: 50
                            }
                        ]
                    }
                ]
            )
        });

        test('It should return 401 - Manager not authorized', async () => {
            const response = await request(app)
                .get(`${baseURL}/carts/history`).set('Cookie', cookieManager);
            expect(response.status).toBe(401);
        })

        test('It should return 401 - Admin not authorized', async () => {
            const response = await request(app)
                .get(`${baseURL}/carts/history`).set('Cookie', cookieAdmin);
            expect(response.status).toBe(401);
        })

        test('It should return 401 - Not logged not authorized', async () => {
            const response = await request(app)
                .get(`${baseURL}/carts/history`)
            expect(response.status).toBe(401);
        })
    });

    describe('DELETE /carts/products/:model', () => {

        beforeEach(async () => {
            await productDAO.deleteAllProducts();
            await cartDAO.deleteAllCarts();
            await productDAO.registerProduct(
                'iPhone15',
                Category.SMARTPHONE,
                6,
                'blue, 128Gb, 5G',
                800,
                '2024-05-20'
            )

            await productDAO.registerProduct(
                'GalaxyS20',
                Category.SMARTPHONE,
                0,
                'green, 64Gb, 4G',
                420,
                '2023-05-05'
            )

            await productDAO.registerProduct(
                'nokia3310',
                Category.SMARTPHONE,
                2,
                'black, 16Mb, 2G',
                50,
                '2010-02-04'
            )
        })

        test('It should return 200 - Delete the product form the current cart', async () => {
            await request(app)
                .post(`${baseURL}/carts`).set('Cookie', cookieCustomer1).send({ model: 'iPhone15' }).expect(200)

            await request(app)
                .post(`${baseURL}/carts`).set('Cookie', cookieCustomer1).send({ model: 'nokia3310' }).expect(200);

            const response = await request(app)
                .delete(`${baseURL}/carts/products/iPhone15`).set('Cookie', cookieCustomer1)
            expect(response.status).toBe(200);

            const check = await request(app)
                .get(`${baseURL}/carts`).set('Cookie', cookieCustomer1);

            expect(check.body).toEqual({
                customer: 'peppe.rossi',
                paid: false,
                paymentDate: null,
                total: 50,
                products: [
                    {
                        model: 'nokia3310',
                        quantity: 1,
                        category: 'Smartphone',
                        price: 50
                    }
                ]
            })
        })

        test('It should return 404 - model represents a product that is not in the cart', async () => {
            await request(app)
                .post(`${baseURL}/carts`).set('Cookie', cookieCustomer1).send({ model: 'nokia3310' }).expect(200)

            const response = await request(app)
                .delete(`${baseURL}/carts/products/iPhone15`).set('Cookie', cookieCustomer1)
            expect(response.status).toBe(404);
        })

        test('It should return 404 - cart whith no products', async () => {
            const response = await request(app)
                .delete(`${baseURL}/carts/products/iPhone15`).set('Cookie', cookieCustomer1)
            expect(response.status).toBe(404);
        });

        test('It should return 404 - model does not represent an existing product', async () => {
            const res1 = await request(app)
                .post(`${baseURL}/carts`).set('Cookie', cookieCustomer1).send({ model: 'nokia3310' })
            expect(res1.status).toBe(200);

            const res2 = await request(app)
                .delete(`${baseURL}/carts/products/iPhone99`).set('Cookie', cookieCustomer1)
            expect(res2.status).toBe(404);
        })


        test('It should return 401 - Manager not authorized', async () => {
            const response = await request(app)
                .delete(`${baseURL}/carts/products/iPhone15`).set('Cookie', cookieManager);
            expect(response.status).toBe(401);
        })

        test('It should return 401 - Admin not authorized', async () => {
            const response = await request(app)
                .delete(`${baseURL}/carts/products/iPhone15`).set('Cookie', cookieAdmin);
            expect(response.status).toBe(401);
        })

        test('It should return 401 - Not logged not authorized', async () => {
            const response = await request(app)
                .delete(`${baseURL}/carts/products/iPhone15`)
            expect(response.status).toBe(401);
        })
    });

    describe('DELETE /carts/current', () => {

        beforeEach(async () => {
            await productDAO.deleteAllProducts();
            await cartDAO.deleteAllCarts();
            await productDAO.registerProduct(
                'iPhone15',
                Category.SMARTPHONE,
                6,
                'blue, 128Gb, 5G',
                800,
                '2024-05-20'
            )

            await productDAO.registerProduct(
                'GalaxyS20',
                Category.SMARTPHONE,
                0,
                'green, 64Gb, 4G',
                420,
                '2023-05-05'
            )

            await productDAO.registerProduct(
                'nokia3310',
                Category.SMARTPHONE,
                2,
                'black, 16Mb, 2G',
                50,
                '2010-02-04'
            )
        })

        test('It should return 200 - Delete all the products from the cart', async () => {
            await request(app)
                .post(`${baseURL}/carts`).set('Cookie', cookieCustomer1).send({ model: 'iPhone15' }).expect(200);

            await request(app)
                .post(`${baseURL}/carts`).set('Cookie', cookieCustomer1).send({ model: 'nokia3310' }).expect(200);

            const response = await request(app)
                .delete(`${baseURL}/carts/current`).set('Cookie', cookieCustomer1)
            expect(response.status).toBe(200);

            const check = await request(app)
                .get(`${baseURL}/carts`).set('Cookie', cookieCustomer1);

            expect(check.body).toEqual({
                customer: 'peppe.rossi',
                paid: false,
                paymentDate: null,
                total: 0,
                products: []
            })

        })

        test('It should return 404 - No information about unpaid cart', async () => {
            const response = await request(app)
                .delete(`${baseURL}/carts/current`).set('Cookie', cookieCustomer1)
            expect(response.status).toBe(404);
        })

        test('It should return 401 - Manager not authorized', async () => {
            const response = await request(app)
                .delete(`${baseURL}/carts/current`).set('Cookie', cookieManager);
            expect(response.status).toBe(401);
        })

        test('It should return 401 - Admin not authorized', async () => {
            const response = await request(app)
                .delete(`${baseURL}/carts/current`).set('Cookie', cookieAdmin);
            expect(response.status).toBe(401);
        })

        test('It should return 401 - Not logged not authorized', async () => {
            const response = await request(app)
                .delete(`${baseURL}/carts/current`)
            expect(response.status).toBe(401);
        })
    })


    describe('DELETE /carts/all', () => {

        beforeEach(async () => {
            await productDAO.deleteAllProducts();
            await cartDAO.deleteAllCarts();
            await productDAO.registerProduct(
                'iPhone15',
                Category.SMARTPHONE,
                6,
                'blue, 128Gb, 5G',
                800,
                '2024-05-20'
            )

            await productDAO.registerProduct(
                'nokia3310',
                Category.SMARTPHONE,
                2,
                'black, 16Mb, 2G',
                50,
                '2010-02-04'
            )

            await request(app)
                .post(`${baseURL}/carts`).set('Cookie', cookieCustomer1).send({ model: 'iPhone15' }).expect(200);

            await request(app)
                .patch(`${baseURL}/carts`).set('Cookie', cookieCustomer1).expect(200);

            await request(app)
                .post(`${baseURL}/carts`).set('Cookie', cookieCustomer1).send({ model: 'nokia3310' }).expect(200);

            await request(app)
                .post(`${baseURL}/carts`).set('Cookie', cookieCustomer2).send({ model: 'nokia3310' }).expect(200);

        })

        test('It should return 200 - Cart with products called by Manager', async () => {

            const response = await request(app)
                .delete(`${baseURL}/carts`).set('Cookie', cookieManager)
            expect(response.status).toBe(200);

            const check = await request(app)
                .get(`${baseURL}/carts/all`).set('Cookie', cookieManager)
            expect(check.body).toEqual([]);
        })

        test('It should return 200 - Cart with products called by Admin', async () => {

            const response = await request(app)
                .delete(`${baseURL}/carts`).set('Cookie', cookieAdmin)
            expect(response.status).toBe(200);

            const check = await request(app)
                .get(`${baseURL}/carts/all`).set('Cookie', cookieAdmin)
            expect(check.body).toEqual([]);
        })

        test('It should return 401- Customer not Authorized', async () => {

            const response = await request(app)
                .delete(`${baseURL}/carts`).set('Cookie', cookieCustomer1)
            expect(response.status).toBe(401);
        })

        test('It should return 401- Not logged not Authorized', async () => {

            const response = await request(app)
                .delete(`${baseURL}/carts`)
            expect(response.status).toBe(401);
        })

    })

    describe('GET /carts/all', () => {

        beforeEach(async () => {
            await productDAO.deleteAllProducts();
            await cartDAO.deleteAllCarts();
            await productDAO.registerProduct(
                'iPhone15',
                Category.SMARTPHONE,
                6,
                'blue, 128Gb, 5G',
                800,
                '2024-05-20'
            )

            await productDAO.registerProduct(
                'nokia3310',
                Category.SMARTPHONE,
                2,
                'black, 16Mb, 2G',
                50,
                '2010-02-04'
            )

            await request(app)
                .post(`${baseURL}/carts`).set('Cookie', cookieCustomer1).send({ model: 'iPhone15' }).expect(200);

            await request(app)
                .patch(`${baseURL}/carts`).set('Cookie', cookieCustomer1).expect(200);

            await request(app)
                .post(`${baseURL}/carts`).set('Cookie', cookieCustomer1).send({ model: 'nokia3310' }).expect(200);

            await request(app)
                .post(`${baseURL}/carts`).set('Cookie', cookieCustomer2).send({ model: 'nokia3310' }).expect(200);

        })

        test('It should return 200 - Cart with products called by Admin', async () => {

            const res = await request(app)
                .get(`${baseURL}/carts/all`).set('Cookie', cookieAdmin);
            expect(res.status).toBe(200);


            expect(res.body).toEqual(
                [
                    {
                        customer: "peppe.rossi",
                        paid: true,
                        paymentDate: dayjs().format('YYYY-MM-DD'),
                        products: [
                            {
                                category: "Smartphone",
                                model: "iPhone15",
                                price: 800,
                                quantity: 1
                            }
                        ],
                        total: 800
                    },
                    {
                        customer: "peppe.rossi",
                        paid: false,
                        paymentDate: null,
                        products: [
                            {
                                category: "Smartphone",
                                model: "nokia3310",
                                price: 50,
                                quantity: 1
                            }
                        ],
                        total: 50
                    },
                    {
                        customer: "michele.rossi",
                        paid: false,
                        paymentDate: null,
                        products: [
                            {
                                category: "Smartphone",
                                model: "nokia3310",
                                price: 50,
                                quantity: 1
                            }
                        ],
                        total: 50
                    }
                ]
            );

        })

        test('It should return 200 - Cart with products called by Manager', async () => {

            const res = await request(app)
                .get(`${baseURL}/carts/all`).set('Cookie', cookieManager)
            expect(res.status).toBe(200);

            expect(res.body).toEqual(
                [
                    {
                        customer: "peppe.rossi",
                        paid: true,
                        paymentDate: dayjs().format('YYYY-MM-DD'),
                        products: [
                            {
                                category: "Smartphone",
                                model: "iPhone15",
                                price: 800,
                                quantity: 1
                            }
                        ],
                        total: 800
                    },
                    {
                        customer: "peppe.rossi",
                        paid: false,
                        paymentDate: null,
                        products: [
                            {
                                category: "Smartphone",
                                model: "nokia3310",
                                price: 50,
                                quantity: 1
                            }
                        ],
                        total: 50
                    },
                    {
                        customer: "michele.rossi",
                        paid: false,
                        paymentDate: null,
                        products: [
                            {
                                category: "Smartphone",
                                model: "nokia3310",
                                price: 50,
                                quantity: 1
                            }
                        ],
                        total: 50
                    }
                ]
            );
        })

        test('It should return 401- Customer not Authorized', async () => {

            const res = await request(app)
                .get(`${baseURL}/carts/all`).set('Cookie', cookieCustomer1)
            expect(res.status).toBe(401);
        })

        test('It should return 401- Not logged not Authorized', async () => {

            const res = await request(app)
                .get(`${baseURL}/carts/all`)
            expect(res.status).toBe(401);
        })
    })

})
