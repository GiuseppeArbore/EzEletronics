import { describe, test, expect, beforeAll, afterAll, afterEach, beforeEach, jest } from "@jest/globals"
import request from 'supertest'
import { app } from "../index"
import { cleanup } from "../src/db/cleanup"
import { Category, Product } from "../src/components/product";
import ProductDAO from '../src/dao/productDAO'
import { Role } from '../src/components/user'
import dayjs, { Dayjs } from 'dayjs'
import ProductController from "../src/controllers/productController";
import exp from "constants";
import { assert } from "console";
import { EmptyProductStockError } from "../src/errors/productError";

//definisco url base per le richieste
jest.setTimeout(100000);
const baseURL = "/ezelectronics"
let cookieAdmin: string
let cookieCustomer: string
let cookieManager: string
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
describe('ProductRoutes integrated test', () => {

  beforeAll(async () => {
    await cleanup();
    await createAndLoginCustomer()
    await createAndLoginManager()
    await createAndLoginAdmin()
  })

  afterEach(async () => {
    productDAO.deleteAllProducts()
  })

  afterAll(async () => {
    await cleanup()
  })

  //test per la registrazione di un nuovo prodotto
  describe('POST /products', () => {

    test('It should return 200 - new product registred by a Manager', async () => {
      const response = await request(app)
        .post(`${baseURL}/products`).set('Cookie', cookieManager).send(newProduct)

      expect(response.status).toBe(200)

      const products = await productDAO.getProductsByModel(newProduct.model)
      expect(products).toEqual(
        expect.arrayContaining([
          expect.objectContaining({
            model: 'iPhone15',
            category: Category.SMARTPHONE,
            sellingPrice: 800,
            details: 'blue, 128Gb, 5G',
            quantity: 5,
            arrivalDate: '2024-05-20'
          })
        ])
      )
    })

    test('It should return 200 - new product registred by an Admin', async () => {
      const response = await request(app)
        .post(`${baseURL}/products`).set('Cookie', cookieAdmin).send(newProduct)

      expect(response.status).toBe(200)

      const products = await productDAO.getProductsByModel(newProduct.model)
      expect(products).toEqual(
        expect.arrayContaining([
          expect.objectContaining({
            model: 'iPhone15',
            category: Category.SMARTPHONE,
            sellingPrice: 800,
            details: 'blue, 128Gb, 5G',
            quantity: 5,
            arrivalDate: '2024-05-20'
          })
        ])
      )
    })

    test('It should return 401 - customer try to register a product', async () => {
      const response = await request(app)
        .post(`${baseURL}/products`).set('Cookie', cookieCustomer).send(newProduct)

      expect(response.status).toBe(401)
    })

    test('It should return 401 - user not logged try to register a product', async () => {
      const response = await request(app).post(`${baseURL}/products`).send(newProduct)

      expect(response.status).toBe(401)
    })

    test('It should return 409 - model already exists', async () => {
      await request(app)
        .post(`${baseURL}/products`)
        .set('Cookie', cookieManager)
        .send(newProduct)

      const response = await request(app)
        .post(`${baseURL}/products`)
        .set('Cookie', cookieManager)
        .send(newProduct)

      expect(response.status).toBe(409)
    })

    test('It should return 422 - invalid category', async () => {
      const newProduct = {
        model: 'iPhone15',
        category: 'pizza',
        sellingPrice: 800,
        details: 'blue, 128Gb, 5G',
        quantity: 5,
        arrivalDate: '2024-05-20'
      }

      const response = await request(app)
        .post(`${baseURL}/products`)
        .set('Cookie', cookieManager)
        .send(newProduct)

      expect(response.status).toBe(422)
    })

    test('It should return 422 - empty model', async () => {
      const newProduct = {
        model: '',
        category: Category.SMARTPHONE,
        sellingPrice: 800,
        details: 'blue, 128Gb, 5G',
        quantity: 5,
        arrivalDate: '2024-05-20'
      }

      const response = await request(app)
        .post(`${baseURL}/products`)
        .set('Cookie', cookieManager)
        .send(newProduct)

      expect(response.status).toBe(422)
    })

    test('It should return 422 - quantity ==0', async () => {
      const newProduct = {
        model: 'iPhone15',
        category: Category.SMARTPHONE,
        sellingPrice: 800,
        details: 'blue, 128Gb, 5G',
        quantity: 0,
        arrivalDate: '2024-05-20'
      }

      const response = await request(app)
        .post(`${baseURL}/products`)
        .set('Cookie', cookieManager)
        .send(newProduct)

      expect(response.status).toBe(422)
    })

    test('It should return 422 - quantity <0', async () => {
      const newProduct = {
        model: 'iPhone15',
        category: Category.SMARTPHONE,
        sellingPrice: 800,
        details: 'blue, 128Gb, 5G',
        quantity: -1,
        arrivalDate: '2024-05-20'
      }

      const response = await request(app)
        .post(`${baseURL}/products`)
        .set('Cookie', cookieManager)
        .send(newProduct)

      expect(response.status).toBe(422)
    })

    test('It should return 422 - selling price = 0', async () => {
      const newProduct = {
        model: 'iPhone15',
        category: Category.SMARTPHONE,
        sellingPrice: 0,
        details: 'blue, 128Gb, 5G',
        quantity: 5,
        arrivalDate: '2024-05-20'
      }

      const response = await request(app)
        .post(`${baseURL}/products`)
        .set('Cookie', cookieManager)
        .send(newProduct)

      expect(response.status).toBe(422)
    })

    test('It should return 422 - selling price <0', async () => {
      const newProduct = {
        model: 'iPhone15',
        category: Category.SMARTPHONE,
        sellingPrice: -1,
        details: 'blue, 128Gb, 5G',
        quantity: 5,
        arrivalDate: '2024-05-20'
      }

      const response = await request(app)
        .post(`${baseURL}/products`)
        .set('Cookie', cookieManager)
        .send(newProduct)

      expect(response.status).toBe(422)
    })

    test('It should return 200 - selling price=1', async () => {
      const newProduct = {
        model: 'iPhone15',
        category: Category.SMARTPHONE,
        sellingPrice: 1,
        details: 'blue, 128Gb, 5G',
        quantity: 5,
        arrivalDate: '2024-05-20'
      }

      const response = await request(app)
        .post(`${baseURL}/products`)
        .set('Cookie', cookieManager)
        .send(newProduct)

      expect(response.status).toBe(200)
    })

    test('It should return 422 - bad formatted arrivalDate', async () => {
      const newProduct = {
        model: 'iPhone15',
        category: Category.SMARTPHONE,
        sellingPrice: 800,
        details: 'blue, 128Gb, 5G',
        quantity: 5,
        arrivalDate: "2020/01/01"
      }

      const response = await request(app)
        .post(`${baseURL}/products`)
        .set('Cookie', cookieManager)
        .send(newProduct)

      expect(response.status).toBe(422)
    })

    test('It should return 422 - italian arrivalDate ', async () => {
      const newProduct = {
        model: 'iPhone15',
        category: Category.SMARTPHONE,
        sellingPrice: 800,
        details: 'blue, 128Gb, 5G',
        quantity: 5,
        arrivalDate: "20-01-2001"
      }

      const response = await request(app)
        .post(`${baseURL}/products`)
        .set('Cookie', cookieManager)
        .send(newProduct)

      expect(response.status).toBe(422)
    })

    test('It should return 400  - arrivalDate after the current date', async () => {
      const newProduct = {
        model: 'iPhone15',
        category: Category.SMARTPHONE,
        sellingPrice: 800,
        details: 'blue, 128Gb, 5G',
        quantity: 5,
        arrivalDate: '2025-01-01',
      }

      const response = await request(app)
        .post(`${baseURL}/products`)
        .set('Cookie', cookieManager)
        .send(newProduct)

      expect(response.status).toBe(400)
    })

    test('It should return 200 - arrivalDate missing, arrival date must be set as currentDate', async () => {
      const newProduct = {
        model: 'iPhone15',
        category: Category.SMARTPHONE,
        sellingPrice: 800,
        details: 'blue, 128Gb, 5G',
        quantity: 5
      }

      const response = await request(app)
        .post(`${baseURL}/products`)
        .set('Cookie', cookieManager)
        .send(newProduct)

      expect(response.status).toBe(200)
      const products = await productDAO.getProductsByModel(newProduct.model)
      expect(products[0].arrivalDate).toBe(dayjs().format('YYYY-MM-DD'))
    })

  })

  describe('PATCH /products/:model', () => {

    beforeEach(async () => {
      await productDAO.registerProduct(
        newProduct.model,
        newProduct.category,
        newProduct.quantity,
        newProduct.details,
        newProduct.sellingPrice,
        newProduct.arrivalDate
      )
    })

    test('It should return 200 - Manager incrase product quantity', async () => {

      const update = { quantity: 3 }

      const response = await request(app)
        .patch(`${baseURL}/products/${newProduct.model}`)
        .set('Cookie', cookieManager)
        .send(update)

      expect(response.status).toBe(200)
      const updatedProduct = await productDAO.getProductsByModel(newProduct.model)
      expect(updatedProduct[0].quantity).toBe(newProduct.quantity + update.quantity)
    })

    test('It should return 200 - Admin incrase product quantity', async () => {
      const update = { quantity: 3 }

      const response = await request(app)
        .patch(`${baseURL}/products/${newProduct.model}`)
        .set('Cookie', cookieAdmin)
        .send(update)

      expect(response.status).toBe(200)
      const updatedProduct = await productDAO.getProductsByModel(newProduct.model)
      expect(updatedProduct[0].quantity).toBe(newProduct.quantity + update.quantity)
    })

    test('It should return 401 - Customer try to increase product quantity', async () => {
      const update = { quantity: 3 }

      const response = await request(app)
        .patch(`${baseURL}/products/${newProduct.model}`)
        .set('Cookie', cookieCustomer)
        .send(update)

      expect(response.status).toBe(401)
    })

    test(`It should return 404 - product model doesn't exist`, async () => {
      const update = { quantity: 3 }

      const response = await request(app)
        .patch(`${baseURL}/products/PS5`)
        .set('Cookie', cookieManager)
        .send(update)

      expect(response.status).toBe(404)
    })

    test('It should return 422 - new quantity missing in update', async () => {
      const update = {}

      const response = await request(app)
        .patch(`${baseURL}/products/${newProduct.model}`)
        .set('Cookie', cookieManager)
        .send(update)

      expect(response.status).toBe(422)
    })

    test('It should return 422 - new quantity = 0', async () => {
      const update = { quantity: 0 }

      const response = await request(app)
        .patch(`${baseURL}/products/${newProduct.model}`)
        .set('Cookie', cookieManager)
        .send(update)

      expect(response.status).toBe(422)
    })

    test('It should return 422 - new quantity < 0', async () => {
      const update = { quantity: -1 }

      const response = await request(app)
        .patch(`${baseURL}/products/${newProduct.model}`)
        .set('Cookie', cookieManager)
        .send(update)

      expect(response.status).toBe(422)
    })

    test(`It should return a 422 error - changeDate < product's arrivalDate`, async () => {
      const update = {
        quantity: 3,
        changeDate: '2022-01-01'
      }

      const response = await request(app)
        .patch(`${baseURL}/products/${newProduct.model}`)
        .set('Cookie', cookieAdmin)
        .send(update)

      expect(response.status).toBe(400)
    })

    test('It should return 400 - changeDate  after the current date', async () => {
      var today = new Date();
      var changeDate = (today.getFullYear() + 2) + "-10-10";
      const update = {
        quantity: 3,
        changeDate: changeDate
      }

      const response = await request(app)
        .patch(`${baseURL}/products/${newProduct.model}`)
        .set('Cookie', cookieManager)
        .send(update)

      expect(response.status).toBe(400)
    })

    test(`It should return 200 - changeDate is missing, must be set as current date , arrival date doesn't change`, async () => {
      const update = { quantity: 3 }
      const response = await request(app)
        .patch(`${baseURL}/products/${newProduct.model}`)
        .set('Cookie', cookieManager)
        .send(update)

      expect(response.status).toBe(200)
      const updatedProduct = await productDAO.getProductsByModel(newProduct.model)
      expect(updatedProduct[0].arrivalDate).toBe(newProduct.arrivalDate)
    })

    test('It should return 422 - invalid changeDate format', async () => {
      const update = {
        quantity: 3,
        changeDate: '02-02-2024'
      }

      const response = await request(app)
        .patch(`${baseURL}/products/${newProduct.model}`)
        .set('Cookie', cookieManager)
        .send(update)

      expect(response.status).toBe(422)
    })

  })

  describe('PATCH /products/:model/sell', () => {

    beforeEach(async () => {
      await productDAO.registerProduct(
        newProduct.model,
        newProduct.category,
        newProduct.quantity,
        newProduct.details,
        newProduct.sellingPrice,
        newProduct.arrivalDate
      )
    })

    test('It should return 200 - Manager reduces product quantity', async () => {
      const sellBody = { quantity: 2 }

      const response = await request(app)
        .patch(`${baseURL}/products/${newProduct.model}/sell`)
        .set('Cookie', cookieManager)
        .send(sellBody)

      expect(response.status).toBe(200)
      const updatedProduct = await productDAO.getProductsByModel(newProduct.model)
      expect(updatedProduct[0].quantity).toBe(newProduct.quantity - sellBody.quantity)
    })

    test('It should return 200 - Admin reduces product quantity', async () => {
      const sellBody = { quantity: 2 }

      const response = await request(app)
        .patch(`${baseURL}/products/${newProduct.model}/sell`)
        .set('Cookie', cookieAdmin)
        .send(sellBody)

      expect(response.status).toBe(200)
      const updatedProduct = await productDAO.getProductsByModel(newProduct.model)
      expect(updatedProduct[0].quantity).toBe(newProduct.quantity - sellBody.quantity)
    })

    test('It should return 401 - Customer try to reduce quantity', async () => {
      const sellBody = { quantity: 2 }
      const response = await request(app)
        .patch(`${baseURL}/products/${newProduct.model}/sell`)
        .set('Cookie', cookieCustomer)
        .send(sellBody)

      expect(response.status).toBe(401)
    })

    test('It should return 404 - Product model does not exist', async () => {
      const sellBody = { quantity: 2 }

      const response = await request(app)
        .patch(`${baseURL}/products/NonExistentModel/sell`)
        .set('Cookie', cookieManager)
        .send(sellBody)

      expect(response.status).toBe(404)
    })

    test('It should return 409 - available quantity is 0', async () => {

      await productDAO.registerProduct(
        newProductEmpty.model,
        newProductEmpty.category,
        newProductEmpty.quantity,
        newProductEmpty.details,
        newProductEmpty.sellingPrice,
        newProductEmpty.arrivalDate
      )
      const sellBody = { quantity: 6 }

      const response = await request(app)
        .patch(`${baseURL}/products/${newProductEmpty.model}/sell`)
        .set('Cookie', cookieManager)
        .send(sellBody)

      expect(response.status).toBe(409)
    })


    test('It should return 200 -  quantity == available quantity', async () => {
      const sellBody = { quantity: 5 }

      const response = await request(app)
        .patch(`${baseURL}/products/${newProduct.model}/sell`)
        .set('Cookie', cookieManager)
        .send(sellBody)

      expect(response.status).toBe(200)
    })

    test('It should return 409 -  quantity > available quantity', async () => {
      const sellBody = { quantity: 7 }

      const response = await request(app)
        .patch(`${baseURL}/products/${newProduct.model}/sell`)
        .set('Cookie', cookieManager)
        .send(sellBody)

      expect(response.status).toBe(409)
    })

    test('It should return 400 -  sellingDate > current date', async () => {
      var today = new Date();
      var sellingDate = (today.getFullYear() + 2) + "-10-10";
      const sellBody = {
        quantity: 2,
        sellingDate: sellingDate
      }

      const response = await request(app)
        .patch(`${baseURL}/products/${newProduct.model}/sell`)
        .set('Cookie', cookieManager)
        .send(sellBody)

      expect(response.status).toBe(400)
    })

    test(`It should return 400 - sellingDate  before  product's arrivalDate`, async () => {
      const sellBody = {
        quantity: 2,
        sellingDate: '2024-01-01' // Before arrivalDate
      }

      const response = await request(app)
        .patch(`${baseURL}/products/${newProduct.model}/sell`)
        .set('Cookie', cookieManager)
        .send(sellBody)

      expect(response.status).toBe(400)
    })

    test('It should return 422 - quantity missing in update', async () => {
      const sellBody = { sellingDate: '2024-01-01' }

      const response = await request(app)
        .patch(`${baseURL}/products/${newProduct.model}/sell`)
        .set('Cookie', cookieManager)
        .send(sellBody)

      expect(response.status).toBe(422)
    })

    test('It should return 422 - quantity is == 0', async () => {
      const sellBody = { quantity: 0 }

      const response = await request(app)
        .patch(`${baseURL}/products/${newProduct.model}/sell`)
        .set('Cookie', cookieManager)
        .send(sellBody)

      expect(response.status).toBe(422)
    })

    test('It should return 422 - quantity <0', async () => {
      const sellBody = { quantity: -1 }

      const response = await request(app)
        .patch(`${baseURL}/products/${newProduct.model}/sell`)
        .set('Cookie', cookieManager)
        .send(sellBody)

      expect(response.status).toBe(422)
    })

    test('It should return 422 for an invalid sellingDate format ', async () => {
      const sellBody = {
        quantity: 2,
        sellingDate: '01-01-2024' // Invalid date format
      }

      const response = await request(app)
        .patch(`${baseURL}/products/${newProduct.model}/sell`)
        .set('Cookie', cookieManager)
        .send(sellBody)

      expect(response.status).toBe(422)
    })

    test('It should return 200 - selling date empty -> sellingDate = today', async () => {
      let today = dayjs().format('YYYY-MM-DD').toString
      const sellBody = { quantity: 2 }

      const response = await request(app)
        .patch(`${baseURL}/products/${newProduct.model}/sell`)
        .set('Cookie', cookieManager)
        .send(sellBody)

      expect(response.status).toBe(200)
      const updatedProduct = await productDAO.getProductsByModel(newProduct.model)

      expect(updatedProduct[0].quantity).toBe(newProduct.quantity - sellBody.quantity)

    })

  })






  describe('DELETE /products/:model', () => {

    beforeEach(async () => {
      await productDAO.registerProduct(
        'iPhone15',
        Category.SMARTPHONE,
        800,
        'blue, 128Gb, 5G',
        6,
        '2024-05-20'
      )

      await productDAO.registerProduct(
        'Galaxy S20',
        Category.SMARTPHONE,
        420,
        'green, 64Gb, 4G',
        6,
        '2023-05-05'
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
        'Rowenta5',
        Category.APPLIANCE,
        50,
        `green, 5Kg`,
        4,
        "2024-01-01"
      )
    })
    test('It should return 200 - Manager delete a product', async () => {
      let response = await request(app)
        .delete(`${baseURL}/products/iPhone15`)
        .set('Cookie', cookieManager)

      expect(response.status).toBe(200)

      response = await request(app)
        .get(`${baseURL}/products/iPhone15`)
        .set('Cookie', cookieManager)

      expect(response.status).toBe(404)
    })

    test('It should return 200 - Admin delete a product', async () => {
      let response = await request(app)
        .delete(`${baseURL}/products/iPhone15`)
        .set('Cookie', cookieAdmin)

      expect(response.status).toBe(200)

      response = await request(app)
        .get(`${baseURL}/products/iPhone15`)
        .set('Cookie', cookieAdmin)

      expect(response.status).toBe(404)
    })

    test('It should return 401 - Customer try to delete a product', async () => {
      const response = await request(app)
        .delete(`${baseURL}/products/iPhone15`)
        .set('Cookie', cookieCustomer)

      expect(response.status).toBe(401)
    })

    test('It should return 401 - not logged in try to delete a product', async () => {
      const response = await request(app)
        .delete(`${baseURL}/products/iPhone15`)

      expect(response.status).toBe(401)
    })

    test(`It should return 404 - product isn't in the db`, async () => {
      const response = await request(app)
        .delete(`${baseURL}/products/Pizza`)
        .set('Cookie', cookieAdmin)

      expect(response.status).toBe(404)
    })

  })




  describe('DELETE /products', () => {

    beforeEach(async () => {
      await productDAO.registerProduct(
        'iPhone15',
        Category.SMARTPHONE,
        800,
        'blue, 128Gb, 5G',
        6,
        '2024-05-20'
      )

      await productDAO.registerProduct(
        'Galaxy S20',
        Category.SMARTPHONE,
        420,
        'green, 64Gb, 4G',
        6,
        '2023-05-05'
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
        'Rowenta5',
        Category.APPLIANCE,
        50,
        `green, 5Kg`,
        4,
        "2024-01-01"
      )
    })

    test('It should return 200 - manager delete all products', async () => {
      const response = await request(app)
        .delete(`${baseURL}/products`)
        .set('Cookie', cookieManager)
      expect(response.status).toBe(200)

      await expect(productDAO.getAllProducts()).resolves.toEqual([]);
    })

    test('It should return 200 - Admin delete all products', async () => {
      const response = await request(app)
        .delete(`${baseURL}/products`)
        .set('Cookie', cookieAdmin)

      expect(response.status).toBe(200)

      await expect(productDAO.getAllProducts()).resolves.toEqual([]);
    })

    test('It should return 401 - Customer try to delete all products', async () => {
      const response = await request(app)
        .delete(`${baseURL}/products`)
        .set('Cookie', cookieCustomer)

      expect(response.status).toBe(401)
    })

    test('It should return 401 - Not logged in user try to delete all products', async () => {
      const response = await request(app)
        .delete(`${baseURL}/products`)

      expect(response.status).toBe(401)

    })

  })

  describe('GET /products', () => {

    beforeEach(async () => {
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
        `green, 5Kg`,
        4,
        "2024-01-01"
      )
    })

    test('It should return  200- Manager ask all products', async () => {
      const response = await request(app)
        .get(`${baseURL}/products`)
        .set('Cookie', cookieManager)

      expect(response.status).toBe(200)
      expect(response.body.length).toBe(5)
      expect(response.body).toEqual(
        expect.arrayContaining([
          expect.objectContaining({ model: 'iPhone15' }),
          expect.objectContaining({ model: 'Galaxy s20' }),
          expect.objectContaining({ model: 'hp pavilion 15-cs3000nl' }),
          expect.objectContaining({ model: 'asus vivobook 15' }),
          expect.objectContaining({ model: 'Rowenta5' })]
        )
      )
    })

    test('It should return 200 - Admin ask all products', async () => {
      const response = await request(app)
        .get(`${baseURL}/products`)
        .set('Cookie', cookieAdmin)

      expect(response.status).toBe(200)
      expect(response.body.length).toBe(5)
      expect(response.body).toEqual(
        expect.arrayContaining([
          expect.objectContaining({ model: 'iPhone15' }),
          expect.objectContaining({ model: 'Galaxy s20' }),
          expect.objectContaining({ model: 'hp pavilion 15-cs3000nl' }),
          expect.objectContaining({ model: 'asus vivobook 15' }),
          expect.objectContaining({ model: 'Rowenta5' })]
        )
      )
    })

    test('It should return 401 - Customer ask all products', async () => {
      const response = await request(app)
        .get(`${baseURL}/products`)
        .set('Cookie', cookieCustomer)

      expect(response.status).toBe(401)
    })

    test('It should return 401 -  user not logged in ask for all products', async () => {
      const response = await request(app)
        .get(`${baseURL}/products`)

      expect(response.status).toBe(401)

    })

    test('It should return 200 - products filtered by category SMARTPHONE', async () => {
      let response = await request(app)
        .get(`${baseURL}/products`)
        .set('Cookie', cookieManager)
        .query({ grouping: 'category', category: Category.SMARTPHONE })

      expect(response.status).toBe(200)
      expect(response.body.length).toBe(2)
      expect(response.body).toEqual(
        expect.arrayContaining([
          expect.objectContaining({ model: 'iPhone15' }),
          expect.objectContaining({ model: 'Galaxy s20' })]
        )
      )
    })

    test('It should return 200 - products filtered by category LAPTOP', async () => {
      let response = await request(app)
        .get(`${baseURL}/products`)
        .set('Cookie', cookieManager)
        .query({ grouping: 'category', category: Category.LAPTOP })

      expect(response.status).toBe(200)
      expect(response.body.length).toBe(2)
      expect(response.body).toEqual(
        expect.arrayContaining([
          expect.objectContaining({ model: 'hp pavilion 15-cs3000nl' }),
          expect.objectContaining({ model: 'asus vivobook 15' })]
        )
      )
    })

    test('It should return 200 - products filtered by category APPLIANCE', async () => {
      let response = await request(app)
        .get(`${baseURL}/products`)
        .set('Cookie', cookieManager)
        .query({ grouping: 'category', category: Category.APPLIANCE })

      expect(response.status).toBe(200)
      expect(response.body.length).toBe(1)
      expect(response.body).toEqual(
        expect.arrayContaining([
          expect.objectContaining({ model: 'Rowenta5' })]
        )
      )
    })

    test('It should return 200 - products filtered by model', async () => {
      const response = await request(app)
        .get(`${baseURL}/products`)
        .set('Cookie', cookieManager)
        .query({ grouping: 'model', model: 'iPhone15' })

      expect(response.status).toBe(200)
      expect(response.body.length).toBe(1)
      expect(response.body).toEqual(
        expect.arrayContaining([
          expect.objectContaining({ model: 'iPhone15' })
        ])
      )
    })

    test('It should return 422 - grouping null , any of category or model is not null', async () => {
      let response = await request(app)
        .get(`${baseURL}/products`)
        .set('Cookie', cookieManager)
        .query({ grouping: null, category: Category.SMARTPHONE })

      expect(response.status).toBe(422)

      response = await request(app)
        .get(`${baseURL}/products`)
        .set('Cookie', cookieManager)
        .query({ grouping: null, model: 'iPhone15' })

      expect(response.status).toBe(422)
    })

    test('It should return 422 - grouping==category and category==null', async () => {
      const response = await request(app)
        .get(`${baseURL}/products`)
        .set('Cookie', cookieManager)
        .query({ grouping: 'category', category: null })

      expect(response.status).toBe(422)
    })

    test('It should return 422 - grouping==category and model not null', async () => {
      const response = await request(app)
        .get(`${baseURL}/products`)
        .set('Cookie', cookieManager)
        .query({ grouping: 'category', category: Category.SMARTPHONE, model: 'Galaxy s20' })

      expect(response.status).toBe(422)
    })

    test('It should return 422 - grouping==model and model==null', async () => {
      const response = await request(app)
        .get(`${baseURL}/products`)
        .set('Cookie', cookieManager)
        .query({ grouping: 'model', model: null })

      expect(response.status).toBe(422)
    })

    test('It should return 422 - grouping ==model and category not null', async () => {
      const response = await request(app)
        .get(`${baseURL}/products`)
        .set('Cookie', cookieManager)
        .query({ grouping: 'model', model: 'Galaxy s20', category: Category.SMARTPHONE })

      expect(response.status).toBe(422)
    })

    test('It should return 404 - model not in the database', async () => {
      const response = await request(app)
        .get(`${baseURL}/products`)
        .set('Cookie', cookieManager)
        .query({ grouping: 'model', model: 'pizza' })

      expect(response.status).toBe(404)
    })

  })


  describe('GET /products/available', () => {

    beforeEach(async () => {
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
        `green, 5Kg`,
        4,
        "2024-01-01"
      )
    })

    test('It should return 200 - Customer ask all available products for a Customer', async () => {
      const response = await request(app)
        .get(`${baseURL}/products/available`)
        .set('Cookie', cookieCustomer)

      expect(response.status).toBe(200)
      expect(response.body.length).toBe(5)
      expect(response.body).toEqual(
        expect.arrayContaining([
          expect.objectContaining({ model: 'iPhone15' }),
          expect.objectContaining({ model: 'Galaxy s20' }),
          expect.objectContaining({ model: 'hp pavilion 15-cs3000nl' }),
          expect.objectContaining({ model: 'asus vivobook 15' }),
          expect.objectContaining({ model: 'Rowenta5' })]
        )
      )
    })

    test('It should return 200 - MAnager ask all available products', async () => {
      const response = await request(app)
        .get(`${baseURL}/products/available`)
        .set('Cookie', cookieManager)

      expect(response.status).toBe(200)
      expect(response.body.length).toBe(5)
      expect(response.body).toEqual(
        expect.arrayContaining([
          expect.objectContaining({ model: 'iPhone15' }),
          expect.objectContaining({ model: 'Galaxy s20' }),
          expect.objectContaining({ model: 'hp pavilion 15-cs3000nl' }),
          expect.objectContaining({ model: 'asus vivobook 15' }),
          expect.objectContaining({ model: 'Rowenta5' })]
        )
      )
    })

    test('It should return 200 - Admin ask all available products', async () => {
      const response = await request(app)
        .get(`${baseURL}/products/available`)
        .set('Cookie', cookieAdmin)

      expect(response.status).toBe(200)
      expect(response.body.length).toBe(5)
      expect(response.body).toEqual(
        expect.arrayContaining([
          expect.objectContaining({ model: 'iPhone15' }),
          expect.objectContaining({ model: 'Galaxy s20' }),
          expect.objectContaining({ model: 'hp pavilion 15-cs3000nl' }),
          expect.objectContaining({ model: 'asus vivobook 15' }),
          expect.objectContaining({ model: 'Rowenta5' })]
        )
      )
    })

    test('It should return 401 - non-logged ask for available products', async () => {
      const response = await request(app).get(`${baseURL}/products/available`)

      expect(response.status).toBe(401)
    })

    test('It should return 200- Customer ask available products filtered by category', async () => {
      const response = await request(app)
        .get(`${baseURL}/products/available`)
        .set('Cookie', cookieCustomer)
        .query({ grouping: 'category', category: Category.SMARTPHONE })

      expect(response.status).toBe(200)
      expect(response.body.length).toBe(2)
      expect(response.body).toEqual(
        expect.arrayContaining([
          expect.objectContaining({ model: 'Galaxy s20' }),
          expect.objectContaining({ model: 'iPhone15' })]
        )
      )
    })

    test('It should return 200- Customer ask available products filtered by model', async () => {
      const response = await request(app)
        .get(`${baseURL}/products/available`)
        .set('Cookie', cookieCustomer)
        .query({ grouping: 'model', model: 'Galaxy s20' })

      expect(response.status).toBe(200)
      expect(response.body.length).toBe(1)
      expect(response.body).toEqual(
        expect.arrayContaining([
          expect.objectContaining({ model: 'Galaxy s20' })
        ])
      )
    })

    test('It should return 422 - grouping==null and any of category or model != null', async () => {
      let response = await request(app)
        .get(`${baseURL}/products/available`)
        .set('Cookie', cookieCustomer)
        .query({ grouping: null, category: Category.SMARTPHONE })

      expect(response.status).toBe(422)

      response = await request(app)
        .get(`${baseURL}/products/available`)
        .set('Cookie', cookieCustomer)
        .query({ grouping: null, model: 'iPhone 15' })

      expect(response.status).toBe(422)
    })

    test('It should return 422 - grouping==category and category == null', async () => {
      const response = await request(app)
        .get(`${baseURL}/products/available`)
        .set('Cookie', cookieCustomer)
        .query({ grouping: 'category', category: null })

      expect(response.status).toBe(422)
    })

    test('It should return 422 - grouping == category and model != null', async () => {
      const response = await request(app)
        .get(`${baseURL}/products/available`)
        .set('Cookie', cookieCustomer)
        .query({ grouping: 'category', category: Category.SMARTPHONE, model: 'Galaxy s20' })

      expect(response.status).toBe(422)
    })

    test('It should return 422 - grouping == model and model == null', async () => {
      const response = await request(app)
        .get(`${baseURL}/products/available`)
        .set('Cookie', cookieCustomer)
        .query({ grouping: 'model', model: null })

      expect(response.status).toBe(422)
    })

    test('It should return 422 - grouping == model and category != null', async () => {
      const response = await request(app)
        .get(`${baseURL}/products/available`)
        .set('Cookie', cookieCustomer)
        .query({ grouping: 'model', model: 'Galaxy s20', category: Category.SMARTPHONE })

      expect(response.status).toBe(422)
    })

    test('It should return 404 - model is not in the database', async () => {
      const response = await request(app)
        .get(`${baseURL}/products/available`)
        .set('Cookie', cookieCustomer)
        .query({ grouping: 'model', model: 'NonExistentModel' })

      expect(response.status).toBe(404)
    })

  })

})