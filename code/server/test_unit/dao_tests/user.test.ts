import { describe, test, expect, beforeAll, afterAll, jest } from "@jest/globals"
import UserDAO from "../../src/dao/userDAO"
import crypto from "crypto"
import db from "../../src/db/db"
import { Database } from "sqlite3"
import { afterEach, beforeEach } from "node:test"
import { BadRequestError, UserAlreadyExistsError, UserNotAdminError, UserNotFoundError } from "../../src/errors/userError"
import { User, Role } from "../../src/components/user"

jest.mock("crypto")
jest.mock("../../src/db/db.ts")
jest.setTimeout(100000);

//Example of unit test for the createUser method
//It mocks the database run method to simulate a successful insertion and the crypto randomBytes and scrypt methods to simulate the hashing of the password
//It then calls the createUser method and expects it to resolve true

describe('UserDAO unit tests', () => {

    describe("createUser", () => {
        test("T1 - nuovo user ritorna true", async () => {
            const userDAO = new UserDAO()
            const mockDBRun = jest.spyOn(db, "run").mockImplementation((sql, params, callback) => {
                callback(null)
                return {} as Database
            });
            const mockRandomBytes = jest.spyOn(crypto, "randomBytes").mockImplementation((size) => {
                return (Buffer.from("salt"))
            })
            const mockScrypt = jest.spyOn(crypto, "scrypt").mockImplementation(async (password, salt, keylen) => {
                return Buffer.from("hashedPassword")
            })
            const result = await userDAO.createUser("username", "name", "surname", "password", "role")
            expect(result).toBe(true)
            mockRandomBytes.mockRestore()
            mockDBRun.mockRestore()
            mockScrypt.mockRestore()
        });

        test("T2 - nuovo user con stesso username lancia errore", async () => {
            const userDAO = new UserDAO();
            const mockDBRun = jest.spyOn(db, "run").mockImplementation((sql, params, callback) => {
                const err = new UserAlreadyExistsError();
                callback(err);
                return {} as Database;
            });
            const mockRandomBytes = jest.spyOn(crypto, "randomBytes").mockImplementation((size) => {
                return (Buffer.from("salt"))
            })
            const mockScrypt = jest.spyOn(crypto, "scrypt").mockImplementation(async (password, salt, keylen) => {
                return Buffer.from("hashedPassword")
            })

            await expect(userDAO.createUser("username", "name", "surname", "password", "role")).rejects.toThrow(UserAlreadyExistsError);
            mockRandomBytes.mockRestore()
            mockDBRun.mockRestore()
            mockScrypt.mockRestore()
        });
    });

    describe("getUsers", () => {
        test("T1 - ritorna lista di users", async () => {
            const userDAO = new UserDAO();
            const mockDBAll = jest.spyOn(db, "all").mockImplementation((sql, params, callback) => {
                const rows = [
                    { username: "username1", name: "name1", surname: "surname1", role: "role1", address: "address1", birthdate: "2000-01-01" },
                    { username: "username2", name: "name2", surname: "surname2", role: "role2", address: "address2", birthdate: "1999-01-01" },
                ]
                callback(null, rows)
                return {} as Database
            });

            const result = await userDAO.getUsers();
            expect(result).toEqual(
                [
                    { username: "username1", name: "name1", surname: "surname1", role: "role1", address: "address1", birthdate: "2000-01-01" },
                    { username: "username2", name: "name2", surname: "surname2", role: "role2", address: "address2", birthdate: "1999-01-01" },
                ]
            );

            mockDBAll.mockRestore();
        });
    });

    describe("getUserByUsername", () => {
        test("T1 - ritorna user con username", async () => {
            const userDAO = new UserDAO();
            const mockDBGet = jest.spyOn(db, "get").mockImplementation((sql, params, callback) => {
                const row = { username: "username", name: "name", surname: "surname", role: "role", address: "address", birthdate: "2000-01-01" }
                callback(null, row)
                return {} as Database
            });

            const result = await userDAO.getUserByUsername("username");
            expect(result).toEqual({ username: "username", name: "name", surname: "surname", role: "role", address: "address", birthdate: "2000-01-01" });

            mockDBGet.mockRestore();
        });

        test("T2 - user con username non esiste lancia errore", async () => {
            const userDAO = new UserDAO();
            const mockDBGet = jest.spyOn(db, "get").mockImplementation((sql, params, callback) => {
                callback(null, undefined)
                return {} as Database
            });

            await expect(userDAO.getUserByUsername("username")).rejects.toThrow();

            mockDBGet.mockRestore();
        });
    });

    describe("getUsersByRole", () => {
        test("T1 - ritorna lista di users con role Customer", async () => {
            const userDAO = new UserDAO();
            const mockDBAll = jest.spyOn(db, "all").mockImplementation((sql, params, callback) => {
                const rows = [
                    { username: "username1", name: "name1", surname: "surname1", role: Role.CUSTOMER, address: "address1", birthdate: "2000-01-01" },
                    { username: "username2", name: "name2", surname: "surname2", role: Role.CUSTOMER, address: "address2", birthdate: "1999-01-01" },
                ];
                callback(null, rows);
                return {} as Database;
            });

            const expectedResult = [
                new User("username1", "name1", "surname1", Role.CUSTOMER, "address1", "2000-01-01"),
                new User("username2", "name2", "surname2", Role.CUSTOMER, "address2", "1999-01-01"),
            ];

            const result = await userDAO.getUsersByRole("Customer");

            expect(result).toEqual(expectedResult);

            mockDBAll.mockRestore();
        });

        test("T2 - ritorna errore se role non è uno dei tre ruoli consentiti", async () => {
            const userDAO = new UserDAO();
            const mockDBAll = jest.spyOn(db, "all").mockImplementation((sql, params, callback) => {
                const err = new BadRequestError();
                callback(err);
                return {} as Database;
            });

            await expect(userDAO.getUsersByRole("asd")).rejects.toThrow(BadRequestError);

            mockDBAll.mockRestore();

        });
    });

    describe("deleteUser", () => {
        test("T1 - elimina user dato username", async () => {
            const userDAO = new UserDAO();
            const mockDBRun = jest.spyOn(db, "run").mockImplementation((sql, params, callback) => {
                callback(null)
                return {} as Database
            });

            const result = await userDAO.deleteUser("username");
            expect(result).toBe(true);

            mockDBRun.mockRestore();
        });
    });

    describe("deleteAllUsers", () => {
        test("T1 - elimina tutti gli user con role diverso da Admin", async () => {
            const userDAO = new UserDAO();
            const mockDBRun = jest.spyOn(db, "run").mockImplementation((sql, params, callback) => {
                callback(null)
                return {} as Database
            });

            const result = await userDAO.deleteAllUsers(Role.ADMIN);
            expect(result).toBe(true);

            mockDBRun.mockRestore();
        });
    });

    describe("updateUser", () => {
        test("T1 - aggiorna user", async () => {
            const userDAO = new UserDAO();
            const mockDBRun = jest.spyOn(db, "run").mockImplementation((sql, params, callback) => {
                callback(null)
                return {} as Database
            });

            const result = await userDAO.updateUser("name", "surname", "address", "2000-01-01", "username");
            expect(result).toBe(true);

            mockDBRun.mockRestore();
        });
    });
});
