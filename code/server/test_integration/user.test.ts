import { describe, test, expect, beforeAll, afterAll, jest } from "@jest/globals";
import request from 'supertest';
import { app } from "../index"; // Assuming app is exported from index.js
import { cleanup } from "../src/db/cleanup";
import UserDAO from "../src/dao/userDAO";
import { Role } from "../src/components/user";


const userDao = new UserDAO();

jest.setTimeout(100000);
const baseURL = "/ezelectronics"
let cookieAdmin: string
let cookieCustomer: string
let cookieManager: string

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

describe("Users integration tests", () => {
    beforeAll(async () => {
        await cleanup();
        await createAndLoginCustomer()
        await createAndLoginManager()
        await createAndLoginAdmin()
    });

    afterAll(async () => {
        await cleanup()
    });

    describe("User creation", () => {
        test("It should return a 200 success code and create a new Customer", async () => {
            const dataSent = {
                username: 'u-test-customer',
                password: 'password',
                name: 'cus',
                surname: 'tomer',
                role: Role.CUSTOMER
            };

            const response = await request(app)
                .post(`${baseURL}/users`)
                .send(dataSent)

            expect(response.status).toBe(200);

            const created = await userDao.getUserByUsername(dataSent.username);
            expect(created).toEqual(
                expect.objectContaining({
                    username: dataSent.username,
                    name: dataSent.name,
                    surname: dataSent.surname,
                    role: dataSent.role,
                    address: null,
                    birthdate: null
                }));
        });

        test("It should return a 200 success code and create a new Manager", async () => {
            const dataSent = {
                username: 'u-test-manager',
                password: 'passwordSicura123',
                name: 'man',
                surname: 'ager',
                role: Role.MANAGER
            };

            const response = await request(app)
                .post(`${baseURL}/users`)
                .send(dataSent)

            expect(response.status).toBe(200);

            const created = await userDao.getUserByUsername(dataSent.username);
            expect(created).toEqual(
                expect.objectContaining({
                    username: dataSent.username,
                    name: dataSent.name,
                    surname: dataSent.surname,
                    role: dataSent.role,
                    address: null,
                    birthdate: null
                }));
        });

        test("It should return a 200 success code and create a new Admin", async () => {
            const dataSent = {
                username: 'u-test-admin',
                password: 'passwordSicura123',
                name: 'ad',
                surname: 'min',
                role: Role.ADMIN
            };

            const response = await request(app)
                .post(`${baseURL}/users`)
                .send(dataSent)

            expect(response.status).toBe(200);

            const created = await userDao.getUserByUsername(dataSent.username);
            expect(created).toEqual(
                expect.objectContaining({
                    username: dataSent.username,
                    name: dataSent.name,
                    surname: dataSent.surname,
                    role: dataSent.role,
                    address: null,
                    birthdate: null
                }));
        });

        test("It should return a 422 error code if at least one request body parameter is empty/missing", async () => {
            await request(app)
                .post(`${baseURL}/users`)
                .send({ username: "", name: "test", surname: "test", password: "test", role: Role.CUSTOMER })
                .expect(422)
            await request(app)
                .post(`${baseURL}/users`)
                .send({ username: "test", name: "", surname: "test", password: "test", role: Role.CUSTOMER })
                .expect(422)
        });

        test("It should return a 422 error code if the role is not valid", async () => {
            await request(app)
                .post(`${baseURL}/users`)
                .send({ username: "test", name: "test", surname: "test", password: "test", role: "Invalid" })
                .expect(422)
        });

        test("It should return a 422 error code if the role is missing", async () => {
            await request(app)
                .post(`${baseURL}/users`)
                .send({ username: "test", name: "test", surname: "test", password: "test" })
                .expect(422)
        });

        test("It should return a 409 error code if the username is already taken", async () => {
            //send request with a username already taken
            await request(app)
                .post(`${baseURL}/users`)
                .send({ username: "peppe.rossi", name: "test", surname: "test", password: "test", role: Role.CUSTOMER })
                .expect(409);
        });

    });

    describe("User retrieval", () => {
        test("It should return 200 and an array of users", async () => {
            const response = await request(app)
                .get(`${baseURL}/users`)
                .set("Cookie", cookieAdmin)
                .expect(200)

            expect(response.body).toHaveLength(6);

            const cust = response.body.find((user: any) => user.username === 'peppe.rossi');
            expect(cust).toBeDefined();
            expect(cust.name).toBe('Peppe');
            expect(cust.surname).toBe('Rossi');
            expect(cust.role).toBe(Role.CUSTOMER);

            const man = response.body.find((user: any) => user.username === 'mario.verdi');
            expect(man).toBeDefined();
            expect(man.name).toBe('Mario');
            expect(man.surname).toBe('Verdi');
            expect(man.role).toBe(Role.MANAGER);

            const adm = response.body.find((user: any) => user.username === 'lucia.bianchi');
            expect(adm).toBeDefined();
            expect(adm.name).toBe('Lucia');
            expect(adm.surname).toBe('Bianchi');
            expect(adm.role).toBe(Role.ADMIN);
        });

        test("It should return a 401 error code if the user is not an Admin", async () => {
            await request(app)
                .get(`${baseURL}/users`)
                .set("Cookie", cookieCustomer)
                .expect(401);
        });

        test("It should return a 401 error code if the user is not authenticated", async () => {
            await request(app)
                .get(`${baseURL}/users`)
                .expect(401);
        });
    });

    describe("User retrieval by role", () => {
        test("It should return 200 and an array of users with a specific role", async () => {
            const response = await request(app)
                .get(`${baseURL}/users/roles/${Role.ADMIN}`)
                .set("Cookie", cookieAdmin)
                .expect(200)

            expect(response.body).toHaveLength(2);

            const adm = response.body.find((user: any) => user.username === 'lucia.bianchi');
            expect(adm).toBeDefined();
            expect(adm.name).toBe('Lucia');
            expect(adm.surname).toBe('Bianchi');
            expect(adm.role).toBe(Role.ADMIN);
        });

        test("It should fail with 422 if the role is not valid", async () => {
            await request(app)
                .get(`${baseURL}/users/roles/Invalid`)
                .set("Cookie", cookieAdmin)
                .expect(422);
        });
        test("It should fail with 401 if the user is not Admin", async () => {
            await request(app)
                .get(`${baseURL}/users/roles/${Role.MANAGER}`)
                .set("Cookie", cookieCustomer)
                .expect(401);
        });
    });

    describe("User retrieval by username", () => {
        test("It should return 200 and the user data", async () => {
            const response = await request(app)
                .get(`${baseURL}/users/peppe.rossi`)
                .set("Cookie", cookieCustomer)
                .expect(200)

            expect(response.body).toBeDefined();
            expect(response.body.username).toBe('peppe.rossi');
            expect(response.body.name).toBe('Peppe');
            expect(response.body.surname).toBe('Rossi');
            expect(response.body.role).toBe(Role.CUSTOMER);
        });

        test("It should return 200 and the user data if the user is an Admin", async () => {
            const response = await request(app)
                .get(`${baseURL}/users/mario.verdi`)
                .set("Cookie", cookieAdmin)
                .expect(200)

            expect(response.body).toBeDefined();
            expect(response.body.username).toBe('mario.verdi');
            expect(response.body.name).toBe('Mario');
            expect(response.body.surname).toBe('Verdi');
            expect(response.body.role).toBe(Role.MANAGER);
        });

        test("It should return 401 if the user is not authenticated", async () => {
            await request(app)
                .get(`${baseURL}/users/mario.verdi`)
                .expect(401);
        });

        test("It should return 401 if the user is not an Admin and tries to retrieve another user's data", async () => {
            await request(app)
                .get(`${baseURL}/users/peppe.rossi`)
                .set("Cookie", cookieManager)
                .expect(401);
        });

        test("It should return 404 if the user does not exist", async () => {
            await request(app)
                .get(`${baseURL}/users/nonexistent`)
                .set("Cookie", cookieAdmin)
                .expect(404);
        });
    });

    describe("User info update", () => {
        const dataSent = {
            name: 'Peppe',
            surname: 'Rossi',
            address: 'Via Roma 1',
            birthdate: '1990-01-01'
        };

        test("It should return 200 and update the user info", async () => {
            const response = await request(app)
                .patch(`${baseURL}/users/peppe.rossi`)
                .set("Cookie", cookieCustomer)
                .send(dataSent)
                .expect(200);

            expect(response.body).toBeDefined();
            expect(response.body.username).toBe('peppe.rossi');
            expect(response.body.name).toBe('Peppe');
            expect(response.body.surname).toBe('Rossi');
            expect(response.body.address).toBe('Via Roma 1');
            expect(response.body.birthdate).toBe('1990-01-01');
        });

        test("It should return 401 if the user is not authenticated", async () => {
            await request(app)
                .patch(`${baseURL}/users/peppe.rossi`)
                .send({ name: 'Peppe', surname: 'Rossi' })
                .send(dataSent)
                .expect(401);
        });

        test("It should return 401 if the user is not the same as the one being updated", async () => {
            await request(app)
                .patch(`${baseURL}/users/peppe.rossi`)
                .set("Cookie", cookieManager)
                .send({ name: 'Peppe', surname: 'Rossi' })
                .send(dataSent)
                .expect(401);
        });

        test("It should return 404 if the username does not exist", async () => {
            await request(app)
                .patch(`${baseURL}/users/asd`)
                .set("Cookie", cookieManager)
                .send(dataSent)
                .expect(404);
        });

        test("It should return 401 if the user is an Admin and tries to update another admin", async () => {
            await request(app)
                .patch(`${baseURL}/users/u-test-admin`)
                .set("Cookie", cookieAdmin)
                .send({ name: 'Peppe', surname: 'Rossi' })
                .send(dataSent)
                .expect(401);
        });

        test("It should return 422 if at least one request body parameter is empty/missing", async () => {
            await request(app)
                .patch(`${baseURL}/users/peppe.rossi`)
                .set("Cookie", cookieCustomer)
                .send({ name: "", surname: "test", address: "test", birthdate: "test" })
                .expect(422)
        });

        test("It should return 422 if the birthdate is a random string", async () => {
            await request(app)
                .patch(`${baseURL}/users/peppe.rossi`)
                .set("Cookie", cookieCustomer)
                .send({ name: "test", surname: "test", address: "test", birthdate: "test" })
                .expect(422)
        });

        test("It should return 422 if the birthdate is not a correctly formatted date", async () => {
            await request(app)
                .patch(`${baseURL}/users/peppe.rossi`)
                .set("Cookie", cookieCustomer)
                .send({ name: "test", surname: "test", address: "test", birthdate: "30001-1212-322" })
                .expect(422)
        });

        test("It should return 400 if the birthdate is after the current date", async () => {
            await request(app)
                .patch(`${baseURL}/users/peppe.rossi`)
                .set("Cookie", cookieCustomer)
                .send({ name: "test", surname: "test", address: "test", birthdate: "3000-01-01" })
                .expect(400)
        });
    });

    describe("User deletion, single user", () => {
        test("It should return 200 and delete the user", async () => {
            const userToDelete = await request(app).get(`${baseURL}/users/peppe.rossi`).set("Cookie", cookieCustomer).expect(200).then(res => res.body);
            expect(userToDelete).toBeDefined();

            await request(app)
                .delete(`${baseURL}/users/peppe.rossi`)
                .set("Cookie", cookieCustomer)
                .expect(200);

            const usersLeft = await request(app).get(`${baseURL}/users`).set("Cookie", cookieAdmin).expect(200).then(res => res.body);
            expect(usersLeft).toHaveLength(5);

            await request(app).get(`${baseURL}/users/peppe.rossi`).set("Cookie", cookieAdmin).expect(404);
        });

        test("It should return 401 if the user is not authenticated", async () => {
            await request(app)
                .delete(`${baseURL}/users/mario.verdi`)
                .expect(401);
        });

        test("It should return 401 if the user is not an Admin and tries to delete another user", async () => {
            await request(app)
                .delete(`${baseURL}/users/mario.verdi`)
                .set("Cookie", cookieCustomer)
                .expect(401);
        });

        test("It should return 404 if the user does not exist", async () => {
            await request(app)
                .delete(`${baseURL}/users/nonexistent`)
                .set("Cookie", cookieAdmin)
                .expect(404);
        });

        test("It should return 401 if the user is an Admin and tries to delete another admin", async () => {
            await request(app)
                .delete(`${baseURL}/users/lucia.bianchi`)
                .set("Cookie", cookieAdmin)
                .expect(401);
        });
    });

    describe("User deletion, all users", () => {
        test("It should return 200 and delete the users", async () => {
            await request(app)
                .delete(`${baseURL}/users`)
                .set("Cookie", cookieAdmin)
                .expect(200);

            const users = await request(app).get(`${baseURL}/users`).set("Cookie", cookieAdmin).expect(200).then(res => res.body);
            expect(users).toHaveLength(2); //only admins should be left
        });

        test("It should return 401 if the user is not authenticated", async () => {
            await request(app)
                .delete(`${baseURL}/users`)
                .expect(401);
        });

        test("It should return 401 if the user is not an Admin", async () => {
            await request(app)
                .delete(`${baseURL}/users`)
                .set("Cookie", cookieCustomer)
                .expect(401);
        });
    });
});