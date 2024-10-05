import { describe, test, expect, beforeAll, afterAll, afterEach, beforeEach, jest } from "@jest/globals"
// @ts-ignore
import request from 'supertest'
import { app } from "../index"
import { cleanup } from "../src/db/cleanup"
import { Category, Product } from "../src/components/product";
import ReviewController from "../src/controllers/reviewController";
import ReviewDAO from '../src/dao/reviewDAO'
import ProductDAO from "../src/dao/productDAO";
import { Role } from '../src/components/user'
import dayjs from 'dayjs'

//definisco url base per le richieste
jest.setTimeout(100000);
const baseURL = "/ezelectronics"
let cookieAdmin: string
let cookieCustomer: string
let cookieCustomer2: string
let cookieManager: string
const reviewController = new ReviewController()
const reviewDAO = new ReviewDAO()
const productDAO = new ProductDAO()

//definisco funzione per creare e loggare un customer
async function createAndLoginCustomer() {
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

  cookieCustomer = response.headers['set-cookie']
}

async function createAndLoginCustomer2() {
  await request(app).post(`${baseURL}/users`)
    .send({
      username: 'john.doe',
      password: 'password',
      name: 'John',
      surname: 'Doe',
      role: Role.CUSTOMER
    })
  const response = await request(app)
    .post(`${baseURL}/sessions`)
    .send({ username: 'john.doe', password: 'password' })

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

//TEST REVIEW
describe('ReviewRoutes integrated test', () => {

  beforeAll(async () => {
    await cleanup();
    await createAndLoginCustomer()
    await createAndLoginCustomer2()
    await createAndLoginManager()
    await createAndLoginAdmin()

    await productDAO.registerProduct(
      'iPhone15',
      Category.SMARTPHONE,
      800,
      'blue, 128Gb, 5G',
      5,
      '2024-05-20'
    )

    await productDAO.registerProduct(
      'Galaxy s20',
      Category.SMARTPHONE,
      420,
      'green, 64Gb, 4G',
      6,
      '2023-05-05'
    )

    await productDAO.registerProduct(
      'nokia 3310',
      Category.SMARTPHONE,
      0,
      'black, 16Mb, 2G',
      50,
      '2010-02-04'
    )

    await productDAO.registerProduct(
      'hp pavilion 15-cs3000nl',
      Category.LAPTOP,
      1199,
      'laptop 15.6 pollici, i7, 16GB RAM, 512GB SSD, NVIDIA GeForce MX250 4GB, Windows 10 Home',
      10,
      '2023-04-04'
    )

    await productDAO.registerProduct(
      'asus vivobook 15',
      Category.LAPTOP,
      800,
      'laptop 15.6 pollici, i5, 8GB RAM, 512GB SSD',
      4,
      '2022-02-04'
    )

    await productDAO.registerProduct(
      'Rowenta5',
      Category.APPLIANCE,
      50,
      'green, 5Kg',
      4,
      "2024-01-01"
    )
  })

  afterEach(async () => {
    reviewController.deleteAllReviews();
  })

  afterAll(() => {
    cleanup()
  })

  describe("Post /reviews/:model", () => {

    //scenario 17.1
    test("Ritorna status 200 (successo) e crea una nuova review su un prodotto", async () => {
      const testModel = "iPhone15";
      const inputReview = {
        score: 5,
        comment: "blablabla"
      };

      const response = await request(app)
        .post(`${baseURL}/reviews/${testModel}`)
        .set("Cookie", cookieCustomer)
        .send(inputReview);

      expect(response.status).toBe(200);
    })

    test("Ritorna status 422 per errore nei parametri", async () => {
      const testModel = "iPhone15";
      const invalidReview = { score: 6, comment: "" };

      const response = await request(app)
        .post(`${baseURL}/reviews/${testModel}`)
        .set("Cookie", cookieCustomer)
        .send(invalidReview)

      expect(response.status).toBe(422);
    })

    test("Ritorna status 404 - il prodotto non esiste nel database", async () => {
      const testModel = "test";
      const inputReview = {
        score: 5,
        comment: "blablabla"
      };

      const response = await request(app)
        .post(`${baseURL}/reviews/${testModel}`)
        .set("Cookie", cookieCustomer)
        .send(inputReview)

      expect(response.status).toBe(404);
    })

    test("It should return a 409 error if there is an existing review for the product made by the customer", async () => {
      const testModel = "iPhone15";
      const inputReview = {
        score: 5,
        comment: "blablabla"
      };
      await reviewDAO.addReview(testModel, 'peppe.rossi', inputReview.score, inputReview.comment);

      const response = await request(app)
        .post(`${baseURL}/reviews/${testModel}`)
        .set("Cookie", cookieCustomer)
        .send(inputReview)

      expect(response.status).toBe(409);
    })

    test("ritorna 401 se l'utente non è autorizzato", async () => {
      const testModel = "iPhone15";
      const inputReview = {
        score: 5,
        comment: "blablabla"
      };
      reviewDAO.addReview(testModel, 'peppe.rossi', inputReview.score, inputReview.comment);

      const response = await request(app)
        .post(`${baseURL}/reviews/${testModel}`)
        .set("Cookie", cookieAdmin)
        .send(inputReview)

      expect(response.status).toBe(401);
    })
  });


  describe("GET /reviews/:model", () => {
    beforeEach(async () => {
      const testModel = "iPhone15";
      await reviewDAO.addReview(testModel, 'peppe.rossi', 5, "cool");
      await reviewDAO.addReview(testModel, 'john.doe', 4, "test");
    })

    //Scenario 18.1
    test("Restituisce tutte le reviews per un dato prodotto e status 200 - customer/manager/admin", async () => {
      const testModel = "iPhone15";
      const date = dayjs().format('YYYY-MM-DD');

      const response = await request(app)
        .get(`${baseURL}/reviews/${testModel}`)
        .set("Cookie", cookieManager)
        .send()

      expect(response.status).toBe(200);

      expect(response.body).toEqual([{
        model: testModel,
        user: "peppe.rossi",
        score: 5,
        date: date,
        comment: "cool",
      },
      {
        model: testModel,
        user: "john.doe",
        score: 4,
        date: date,
        comment: "test",
      }
      ]);
    });

    test("Restituisce errore 401 se utente non loggato", async () => {
      const testModel = "iPhone15";
      const response = await request(app)
        .get(`${baseURL}/reviews/${testModel}`)
        .set("Cookie", "")
        .send()

      expect(response.status).toBe(401);
    })
  });


  describe("DELETE /reviews/:model", () => {
    beforeEach(async () => {

      const testModel = "iPhone15";
      await reviewDAO.addReview(testModel, 'peppe.rossi', 5, "cool");
      await reviewDAO.addReview(testModel, 'john.doe', 4, "test");
    })

    test("Deletes the review made by the current user for a specific product. It does not allow the deletion of a review made by another user for the product.", async () => {
      const testModel = "iPhone15";
      const date = dayjs().format('YYYY-MM-DD');

      const response = await request(app)
        .delete(`${baseURL}/reviews/${testModel}`)
        .set("Cookie", cookieCustomer)
        .send()

      expect(response.status).toBe(200);

      expect(await reviewController.getProductReviews(testModel)).toEqual([{
        model: testModel,
        user: "john.doe",
        score: 4,
        date: date,
        comment: "test",
      },
      ])
    });

    test("It should return a 404 error if model does not represent an existing product in the database", async () => {
      const invalidModel = "pippo";
      const testModel = "iPhone15";
      const date = dayjs().format('YYYY-MM-DD');

      const response = await request(app)
        .delete(`${baseURL}/reviews/${invalidModel}`)
        .set("Cookie", cookieCustomer)
        .send()

      expect(response.status).toBe(404);

      expect(await reviewController.getProductReviews(testModel)).toEqual([{
        model: testModel,
        user: "peppe.rossi",
        score: 5,
        date: date,
        comment: "cool",
      },
      {
        model: testModel,
        user: "john.doe",
        score: 4,
        date: date,
        comment: "test",
      },

      ])

      
    });

    test("It should return a 404 error if the current user does not have a review for the product identified by model", async () => {
      const invalidModel = "Rowenta5";
      const testModel = "iPhone15"
      const date = dayjs().format('YYYY-MM-DD');

      const response = await request(app)
        .delete(`${baseURL}/reviews/${invalidModel}`)
        .set("Cookie", cookieCustomer)
        .send()

      expect(response.status).toBe(404);

      expect(await reviewController.getProductReviews(testModel)).toEqual([{
        model: testModel,
        user: "peppe.rossi",
        score: 5,
        date: date,
        comment: "cool",
      },
      {
        model: testModel,
        user: "john.doe",
        score: 4,
        date: date,
        comment: "test",
      }
      ])

      expect(await reviewController.getProductReviews(invalidModel)).toEqual([])
    });

    test("Restituisce errore 401 se utente non loggato", async () => {
      const testModel = "iPhone15";
      const response = await request(app)
        .delete(`${baseURL}/reviews/${testModel}`)
        .set("Cookie", "")
        .send()

      expect(response.status).toBe(401);
    })

    test("Restituisce errore 401 se utente non autorizzato", async () => {
      const testModel = "iPhone15";
      const response = await request(app)
        .delete(`${baseURL}/reviews/${testModel}`)
        .set("Cookie", cookieAdmin)
        .send()

      expect(response.status).toBe(401);
    })
  });


  describe("DELETE /reviews/:model/all", () => {
    beforeEach(async () => {
      const testModel = "iPhone15";
      await reviewDAO.addReview(testModel, 'peppe.rossi', 5, "cool");
      await reviewDAO.addReview(testModel, 'john.doe', 4, "test");
    })

    test("Deletes all reviews of a specific product. User Admin", async () => {
      const testModel = "iPhone15";
      const response = await request(app)
        .delete(`${baseURL}/reviews/${testModel}/all`)
        .set("Cookie", cookieAdmin)
        .send()

      expect(response.status).toBe(200);
      expect(await reviewController.getProductReviews(testModel)).toEqual([]);
    })

    test("Deletes all reviews of a specific product. User Manager", async () => {
      const testModel = "iPhone15";
      const response = await request(app)
        .delete(`${baseURL}/reviews/${testModel}/all`)
        .set("Cookie", cookieManager)
        .send()

      expect(response.status).toBe(200);
      expect(await reviewController.getProductReviews(testModel)).toEqual([]);
    })

    test("Deletes all reviews of a specific product. User Customer, 401", async () => {
      const testModel = "iPhone15";
      const response = await request(app)
        .delete(`${baseURL}/reviews/${testModel}/all`)
        .set("Cookie", cookieCustomer)
        .send()

      expect(response.status).toBe(401);
    })

    test("Deletes all reviews of a specific product. Unlogged user, 401", async () => {
      const testModel = "iPhone15";
      const response = await request(app)
        .delete(`${baseURL}/reviews/${testModel}/all`)
        .set("Cookie", "")
        .send()

      expect(response.status).toBe(401);
    })

    test("It should return a 404 error if model does not represent an existing product in the database", async () => {
      const testModel = "pippo";
      const response = await request(app)
        .delete(`${baseURL}/reviews/${testModel}/all`)
        .set("Cookie", cookieAdmin)
        .send()

      expect(response.status).toBe(404);
    })
  });


  describe("DELETE /reviews", () => {
    beforeEach(async () => {
      const testModel = "iPhone15";
      await reviewDAO.addReview(testModel, 'peppe.rossi', 5, "cool");
      await reviewDAO.addReview(testModel, 'john.doe', 4, "test");
    })

    test("Deletes all reviews of all existing products. User Admin", async () => {
      const testModel = "iPhone15";
      const response = await request(app)
        .delete(`${baseURL}/reviews`)
        .set("Cookie", cookieAdmin)
        .send()

      expect(response.status).toBe(200);
      expect(await reviewController.getProductReviews(testModel)).toEqual([]);
    })

    test("Deletes all reviews of all existing products. User Manager", async () => {
      const testModel = "iPhone15";
      const response = await request(app)
        .delete(`${baseURL}/reviews`)
        .set("Cookie", cookieManager)
        .send()

      expect(response.status).toBe(200);
      expect(await reviewController.getProductReviews(testModel)).toEqual([]);
    })

    test("Deletes all reviews of all existing products. User Customer, 401", async () => {
      const testModel = "iPhone15";
      const date = dayjs().format('YYYY-MM-DD');

      const response = await request(app)
        .delete(`${baseURL}/reviews`)
        .set("Cookie", cookieCustomer)
        .send()

      expect(response.status).toBe(401);
      expect(await reviewController.getProductReviews(testModel)).toEqual([{
        model: testModel,
        user: "peppe.rossi",
        score: 5,
        date: date,
        comment: "cool",
      },
      {
        model: testModel,
        user: "john.doe",
        score: 4,
        date: date,
        comment: "test",
      },
      ]);
    })

    test("Deletes all reviews of all existing products. Unlogged user, 401", async () => {
      const testModel = "iPhone15";
      const date = dayjs().format('YYYY-MM-DD');

      const response = await request(app)
        .delete(`${baseURL}/reviews`)
        .set("Cookie", "")
        .send()

      expect(response.status).toBe(401);
      expect(await reviewController.getProductReviews(testModel)).toEqual([{
        model: testModel,
        user: "peppe.rossi",
        score: 5,
        date: date,
        comment: "cool",
      },
      {
        model: testModel,
        user: "john.doe",
        score: 4,
        date: date,
        comment: "test",
      }
      ]);
    })
  })
});
