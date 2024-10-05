import { test, expect, jest, describe, afterEach } from "@jest/globals"
import request from 'supertest'
import { app } from "../../index"

import UserController from "../../src/controllers/userController"
import Authenticator from "../../src/routers/auth"
import { User, Role } from "../../src/components/user"

jest.setTimeout(100000);
const baseURL = "/ezelectronics"

describe("User route unit tests", () => {
    afterEach(() => {
        jest.clearAllMocks();
    });

    const testUsers = [
        new User("c1", "name1", "surname1", Role.CUSTOMER, "addr1", "1998-01-01"),
        new User("c2", "name2", "surname2", Role.MANAGER, "addr2", "1999-01-01"),
        new User("c3", "name3", "surname3", Role.ADMIN, "addr3", "2000-01-01"),
        new User("c4", "name4", "surname4", Role.CUSTOMER, "addr4", "1997-01-01"),
        new User("c5", "name5", "surname5", Role.MANAGER, "addr5", "1996-01-01"),
        new User("c6", "name6", "surname6", Role.ADMIN, "addr6", "1995-01-01"),
    ];

    describe("POST /ezelectronics/users", () => {
        test("200 - creato correttamente", async () => {
            const testUser = { //Define a test user object sent to the route
                username: "test",
                name: "test",
                surname: "test",
                password: "test",
                role: "Manager"
            }
            jest.spyOn(UserController.prototype, "createUser").mockResolvedValueOnce(true) //Mock the createUser method of the controller
            const response = await request(app).post(baseURL + "/users").send(testUser) //Send a POST request to the route
            expect(response.status).toBe(200) //Check if the response status is 200
            expect(UserController.prototype.createUser).toHaveBeenCalledTimes(1) //Check if the createUser method has been called once
            //Check if the createUser method has been called with the correct parameters
            expect(UserController.prototype.createUser).toHaveBeenCalledWith(testUser.username,
                testUser.name,
                testUser.surname,
                testUser.password,
                testUser.role)
        });

        test("422 - errore, parametri vuoti", async () => {
            const testUser = {
                username: "",
                name: "",
                surname: "",
                password: "",
                role: ""
            }
            const response = await request(app).post(baseURL + "/users").send(testUser);
            expect(response.status).toBe(422)
        });

        test("422 - errore, parametri nulli", async () => {
            const testUser: any = {
                username: null,
                name: null,
                surname: null,
                password: null,
                role: null
            }
            const response = await request(app).post(baseURL + "/users").send(testUser);
            expect(response.status).toBe(422)
        });

        test("422 - errore, ruolo non tra i consentiti", async () => {
            const testUser = {
                username: "test",
                name: "test",
                surname: "test",
                password: "test",
                role: "test"
            }
            const response = await request(app).post(baseURL + "/users").send(testUser);
            expect(response.status).toBe(422)
        });
    });

    describe("GET /ezelectronics/users", () => {
        test("200 - utenti recuperati correttamente", async () => {
            jest.spyOn(Authenticator.prototype, "isAdmin").mockImplementationOnce((req: any, res: any, next: any) => next())
            jest.spyOn(UserController.prototype, "getUsers").mockResolvedValueOnce(testUsers);

            const response = await request(app).get(baseURL + "/users");
            expect(response.status).toBe(200);
            expect(UserController.prototype.getUsers).toHaveBeenCalledTimes(1)
            expect(response.body).toEqual(testUsers);
        });
        test("401 - richiesta proveniente da utente non admin", async () => {
            jest.spyOn(Authenticator.prototype, "isAdmin").mockImplementationOnce((req: any, res: any, next: any) => res.status(401).end())

            const response = await request(app).get(baseURL + "/users");
            expect(response.status).toBe(401);
        });
    });

    describe("GET /ezelectronics/users/roles/:role", () => {
        test("200 - utenti Customer recuperati correttamente", async () => {
            jest.spyOn(Authenticator.prototype, "isAdmin").mockImplementationOnce((req: any, res: any, next: any) => next())
            jest.spyOn(UserController.prototype, "getUsersByRole").mockResolvedValueOnce(testUsers.filter(u => u.role === Role.CUSTOMER));

            const response = await request(app).get(baseURL + "/users/roles/Customer");
            expect(response.status).toBe(200);
            expect(UserController.prototype.getUsersByRole).toHaveBeenCalledTimes(1)
            expect(response.body).toEqual(testUsers.filter(u => u.role === Role.CUSTOMER));
        });

        test("200 - utenti Manager recuperati correttamente", async () => {
            jest.spyOn(Authenticator.prototype, "isAdmin").mockImplementationOnce((req: any, res: any, next: any) => next())
            jest.spyOn(UserController.prototype, "getUsersByRole").mockResolvedValueOnce(testUsers.filter(u => u.role === Role.MANAGER));

            const response = await request(app).get(baseURL + "/users/roles/Manager");
            expect(response.status).toBe(200);
            expect(UserController.prototype.getUsersByRole).toHaveBeenCalledTimes(1)
            expect(response.body).toEqual(testUsers.filter(u => u.role === Role.MANAGER));
        });

        test("401 - richiesta proveniente da utente non admin", async () => {
            jest.spyOn(Authenticator.prototype, "isAdmin").mockImplementationOnce((req: any, res: any, next: any) => res.status(401).end())

            const response = await request(app).get(baseURL + "/users/roles/Customer");
            expect(response.status).toBe(401);
        });
    });

    describe("GET /ezelectronics/users/:username", () => {
        test("200 - utente recuperato correttamente", async () => {
            jest.spyOn(Authenticator.prototype, "isLoggedIn").mockImplementationOnce((req: any, res: any, next: any) => next())
            jest.spyOn(UserController.prototype, "getUserByUsername").mockResolvedValueOnce(testUsers[0]);

            const response = await request(app).get(baseURL + "/users/" + testUsers[0].username);
            expect(response.status).toBe(200);
            expect(UserController.prototype.getUserByUsername).toHaveBeenCalledTimes(1)
            expect(response.body).toEqual(testUsers[0]);
        });
        test("401 - richiesta proveniente da utente non autenticato", async () => {
            jest.spyOn(Authenticator.prototype, "isLoggedIn").mockImplementationOnce((req: any, res: any, next: any) => res.status(401).end())

            const response = await request(app).get(baseURL + "/users/" + testUsers[0].username);
            expect(response.status).toBe(401);
        });
    });

    describe("DELETE /ezelectronics/users/:username", () => {
        test("200 - utente eliminato correttamente", async () => {
            jest.spyOn(Authenticator.prototype, "isLoggedIn").mockImplementationOnce((req: any, res: any, next: any) => next())
            jest.spyOn(UserController.prototype, "deleteUser").mockResolvedValueOnce(true);

            const response = await request(app).delete(baseURL + "/users/" + testUsers[0].username);
            expect(response.status).toBe(200);
            expect(UserController.prototype.deleteUser).toHaveBeenCalledTimes(1)
        });

        test("401 - richiesta proveniente da utente non autenticato", async () => {
            jest.spyOn(Authenticator.prototype, "isLoggedIn").mockImplementationOnce((req: any, res: any, next: any) => res.status(401).end())

            const response = await request(app).delete(baseURL + "/users/" + testUsers[0].username);
            expect(response.status).toBe(401);
        });
    });

    describe("DELETE /ezelectronics/users", () => {
        test("200 - utenti eliminati correttamente", async () => {
            jest.spyOn(Authenticator.prototype, "isAdmin").mockImplementationOnce((req: any, res: any, next: any) => next())
            jest.spyOn(UserController.prototype, "deleteAll").mockResolvedValueOnce(true);

            const response = await request(app).delete(baseURL + "/users");
            expect(response.status).toBe(200);
            expect(UserController.prototype.deleteAll).toHaveBeenCalledTimes(1)
        });

        test("401 - richiesta proveniente da utente non admin", async () => {
            jest.spyOn(Authenticator.prototype, "isAdmin").mockImplementationOnce((req: any, res: any, next: any) => res.status(401).end())

            const response = await request(app).delete(baseURL + "/users");
            expect(response.status).toBe(401);
        });
    });

    describe("PATCH /ezelectronics/users/:username", () => {
        test("200 - utente modificato correttamente", async () => {
            const updatedUser = new User("c1", "name-t", "surname-t", Role.CUSTOMER, "addr-t", "1998-01-01");
            const data = {
                name: "name-t",
                surname: "surname-t",
                address: "addr-t",
                birthdate: "1998-01-01"
            }
            jest.spyOn(Authenticator.prototype, "isLoggedIn").mockImplementationOnce((req: any, res: any, next: any) => next())
            jest.spyOn(UserController.prototype, "updateUserInfo").mockResolvedValueOnce(updatedUser);

            const response = await request(app).patch(baseURL + "/users/" + testUsers[0].username).send(data);
            expect(response.status).toBe(200);
            expect(UserController.prototype.updateUserInfo).toHaveBeenCalledTimes(1)
            expect(response.body).toEqual(updatedUser);
        });

        test("401 - richiesta proveniente da utente non autenticato", async () => {
            const data = {
                username: "c1",
                name: "name-t",
                surname: "surname-t",
                address: "addr-t",
                birthdate: "1998-01-01"
            }
            jest.spyOn(Authenticator.prototype, "isLoggedIn").mockImplementationOnce((req: any, res: any, next: any) => res.status(401).end())

            const response = await request(app).patch(baseURL + "/users/" + testUsers[0].username).send(data);
            expect(response.status).toBe(401);
        });
    });
})