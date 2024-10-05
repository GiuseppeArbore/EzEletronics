import { test, expect, jest, describe, afterEach } from "@jest/globals";
import UserController from "../../src/controllers/userController";
import UserDAO from "../../src/dao/userDAO";
import {
    BadRequestError,
    UnauthorizedUserError,
    UserAlreadyExistsError,
    UserIsAdminError,
    UserNotAdminError
} from "../../src/errors/userError";
import { Role, User } from "../../src/components/user";

jest.mock("../../src/dao/userDAO");
jest.setTimeout(100000);

describe("User controller unit tests", () => {
    afterEach(() => {
        jest.resetAllMocks();
        jest.clearAllMocks();
    });

    describe("createUser", () => {
        test("T1 - creazione user riuscita", async () => {
            const testUser = {
                username: "test",
                name: "test",
                surname: "test",
                password: "test",
                role: "Manager"
            };
            jest.spyOn(UserDAO.prototype, "createUser").mockResolvedValueOnce(true);
            const controller = new UserController();
            const response = await controller.createUser(
                testUser.username,
                testUser.name,
                testUser.surname,
                testUser.password,
                testUser.role
            );

            expect(UserDAO.prototype.createUser).toHaveBeenCalledTimes(1);
            expect(UserDAO.prototype.createUser).toHaveBeenCalledWith(
                testUser.username,
                testUser.name,
                testUser.surname,
                testUser.password,
                testUser.role
            );
            expect(response).toBe(true);
        });

        test("T2 - creazione user fallita, username ripetuto", async () => {
            const testUser = {
                username: "test",
                name: "test",
                surname: "test",
                password: "test",
                role: "Manager"
            };
            const controller = new UserController();

            jest
                .spyOn(UserDAO.prototype, "createUser")
                .mockRejectedValueOnce(new UserAlreadyExistsError());

            await expect(
                controller.createUser(
                    testUser.username,
                    testUser.name,
                    testUser.surname,
                    testUser.password,
                    testUser.role
                )
            ).rejects.toThrow(UserAlreadyExistsError);

            expect(UserDAO.prototype.createUser).toHaveBeenCalledWith(
                testUser.username,
                testUser.name,
                testUser.surname,
                testUser.password,
                testUser.role
            );
        });

        test("T3 - creazione user fallita, ruolo non valido", async () => {
            const testUser = {
                username: "test",
                name: "test",
                surname: "test",
                password: "test",
                role: "asd"
            };
            const controller = new UserController();
            jest
                .spyOn(UserDAO.prototype, "createUser")
                .mockRejectedValueOnce(new BadRequestError());

            await expect(
                controller.createUser(
                    testUser.username,
                    testUser.name,
                    testUser.surname,
                    testUser.password,
                    testUser.role
                )
            ).rejects.toThrow(BadRequestError);
        });
    });

    describe("getUsers", () => {
        test("T1 - riceve tutti gli utenti", async () => {
            const controller = new UserController();
            const users = [
                new User("u1", "name1", "surname2", Role.CUSTOMER, "addr1", "birthdate1"),
                new User("u2", "name2", "surname2", Role.MANAGER, "addr2", "birthdate2"),
                new User("u3", "name3", "surname3", Role.ADMIN, "addr3", "birthdate3")
            ];
            jest.spyOn(UserDAO.prototype, "getUsers").mockResolvedValueOnce(users);

            const response = await controller.getUsers();

            expect(UserDAO.prototype.getUsers).toHaveBeenCalledTimes(1);
            expect(response).toStrictEqual(users);
        });
    });

    describe("getUsersByRole", () => {
        test("T1 - riceve utenti con ruolo Customer", async () => {
            const controller = new UserController();
            const users = [
                new User("u1", "name1", "surname2", Role.CUSTOMER, "addr1", "birthdate1"),
                new User("u2", "name2", "surname2", Role.CUSTOMER, "addr2", "birthdate2"),
                new User("u3", "name3", "surname3", Role.CUSTOMER, "addr3", "birthdate3")
            ];
            jest
                .spyOn(UserDAO.prototype, "getUsersByRole")
                .mockResolvedValueOnce(users);

            const response = await controller.getUsersByRole("Customer");

            expect(UserDAO.prototype.getUsersByRole).toHaveBeenCalledTimes(1);
            expect(UserDAO.prototype.getUsersByRole).toHaveBeenCalledWith("Customer");
            expect(response).toStrictEqual(users);
        });

        test("T2 - fallisce, ruolo non valido", async () => {
            const controller = new UserController();
            jest
                .spyOn(UserDAO.prototype, "getUsersByRole")
                .mockRejectedValueOnce(new BadRequestError());

            await expect(controller.getUsersByRole("asd")).rejects.toThrow(
                BadRequestError
            );
        });
    });

    describe("getUserByUsername", () => {
        test("T1 - riceve utente con username u1", async () => {
            const controller = new UserController();
            const user = new User(
                "u1",
                "name1",
                "surname2",
                Role.CUSTOMER,
                "addr1",
                "birthdate1"
            );
            jest
                .spyOn(UserDAO.prototype, "getUserByUsername")
                .mockResolvedValueOnce(user);

            const response = await controller.getUserByUsername(user, "u1");

            expect(UserDAO.prototype.getUserByUsername).toHaveBeenCalledTimes(1);
            expect(UserDAO.prototype.getUserByUsername).toHaveBeenCalledWith("u1");
            expect(response).toStrictEqual(user);
        });

        test("T2 - fallisce, username non fornito", async () => {
            const controller = new UserController();
            const user = new User(
                "u1",
                "name1",
                "surname2",
                Role.CUSTOMER,
                "addr1",
                "birthdate1"
            );

            jest
                .spyOn(UserDAO.prototype, "getUserByUsername")
                .mockRejectedValueOnce(new BadRequestError());

            await expect(controller.getUserByUsername(user, "")).rejects.toThrow(
                BadRequestError
            );
        });

        test("T3 - fallisce, utente non autorizzato", async () => {
            const controller = new UserController();
            const user = new User(
                "u1",
                "name1",
                "surname2",
                Role.CUSTOMER,
                "addr1",
                "birthdate1"
            );

            jest
                .spyOn(UserDAO.prototype, "getUserByUsername")
                .mockRejectedValueOnce(new UnauthorizedUserError());

            await expect(controller.getUserByUsername(user, "u2")).rejects.toThrow(
                UnauthorizedUserError
            );
        });
    });

    describe("deleteUser", () => {
        test("T1 - cancella utente con username u1", async () => {
            const controller = new UserController();
            const user = new User(
                "u1",
                "name1",
                "surname2",
                Role.CUSTOMER,
                "addr1",
                "birthdate1"
            );
            jest
                .spyOn(UserDAO.prototype, "getUserByUsername")
                .mockResolvedValueOnce(user);
            jest.spyOn(UserDAO.prototype, "deleteUser").mockResolvedValueOnce(true);

            const response = await controller.deleteUser(user, "u1");

            expect(UserDAO.prototype.deleteUser).toHaveBeenCalledTimes(1);
            expect(UserDAO.prototype.deleteUser).toHaveBeenCalledWith("u1");
            expect(response).toBe(true);
        });

        test("T2 - fallisce, utente non admin tenta di cancellare altro utente", async () => {
            const controller = new UserController();
            const user = new User(
                "u1",
                "name1",
                "surname2",
                Role.CUSTOMER,
                "addr1",
                "birthdate1"
            );

            jest
                .spyOn(UserDAO.prototype, "getUserByUsername")
                .mockResolvedValueOnce(user);
            jest
                .spyOn(UserDAO.prototype, "deleteUser")
                .mockRejectedValueOnce(new UserNotAdminError());

            await expect(controller.deleteUser(user, "u2")).rejects.toThrow(
                UserNotAdminError
            );
        });

        test("T3 - fallisce, utente è admin e cerca di cancellare altro admin", async () => {
            const controller = new UserController();
            const user = new User(
                "u1",
                "name1",
                "surname1",
                Role.ADMIN,
                "addr1",
                "birthdate1"
            );

            jest
                .spyOn(UserDAO.prototype, "getUserByUsername")
                .mockResolvedValueOnce(user);
            jest
                .spyOn(UserDAO.prototype, "deleteUser")
                .mockRejectedValueOnce(new UserIsAdminError());

            await expect(controller.deleteUser(user, "u2")).rejects.toThrow(
                UserIsAdminError
            );
        });
    });

    describe("deleteAll", () => {
        test("T1 - cancella tutti gli utenti non admin", async () => {
            const controller = new UserController();
            jest.spyOn(UserDAO.prototype, "deleteAllUsers").mockResolvedValueOnce(true);

            const response = await controller.deleteAll();

            expect(UserDAO.prototype.deleteAllUsers).toHaveBeenCalledTimes(1);
            expect(UserDAO.prototype.deleteAllUsers).toHaveBeenCalledWith("Admin");
            expect(response).toBe(true);
        });
    });

    describe("updateUserInfo", () => {
        test("T1 - aggiorna informazioni utente", async () => {
            const controller = new UserController();
            const oldUser = new User(
                "u1",
                "name1",
                "surname1",
                Role.CUSTOMER,
                "addr1",
                "birthdate1"
            );
            const newUser = new User(
                "u1",
                "newName",
                "newSurname",
                Role.CUSTOMER,
                "newAddr",
                "2021-01-01"
            );
            jest.spyOn(UserDAO.prototype, "getUserByUsername").mockResolvedValueOnce(oldUser);
            jest.spyOn(UserDAO.prototype, "updateUser").mockResolvedValueOnce(true);
            jest.spyOn(UserDAO.prototype, "getUserByUsername").mockResolvedValueOnce(newUser);

            const response = await controller.updateUserInfo(
                oldUser,
                "newName",
                "newSurname",
                "newAddr",
                "2021-01-01",
                "u1"
            );

            expect(UserDAO.prototype.updateUser).toHaveBeenCalledTimes(1);
            expect(UserDAO.prototype.updateUser).toHaveBeenCalledWith(
                "newName",
                "newSurname",
                "newAddr",
                "2021-01-01",
                "u1"
            );

            expect(response).toStrictEqual(new User(
                "u1",
                "newName",
                "newSurname",
                Role.CUSTOMER,
                "newAddr",
                "2021-01-01"
            ));
        });

        test("T2 - fallisce, data di nascita futura", async () => {
            const controller = new UserController();
            const user = new User(
                "u1",
                "name1",
                "surname1",
                Role.CUSTOMER,
                "addr1",
                "birthdate1"
            );

            jest
                .spyOn(UserDAO.prototype, "getUserByUsername")
                .mockRejectedValueOnce(new BadRequestError());

            await expect(
                controller.updateUserInfo(user, "newName", "newSurname", "newAddr", "2026-01-01", "u1")
            ).rejects.toThrow(BadRequestError);
        });

        test("T3 - fallisce, formato data di nascita non valido", async () => {
            const controller = new UserController();
            const user = new User(
                "u1",
                "name1",
                "surname1",
                Role.CUSTOMER,
                "addr1",
                "birthdate1"
            );

            jest
                .spyOn(UserDAO.prototype, "getUserByUsername")
                .mockRejectedValueOnce(new BadRequestError());

            await expect(
                controller.updateUserInfo(user, "newName", "newSurname", "newAddr", "20211-113-011", "u1")
            ).rejects.toThrow(BadRequestError);
        });

        test("T4 - fallisce, data di nascita non valida", async () => {
            const controller = new UserController();
            const user = new User(
                "u1",
                "name1",
                "surname1",
                Role.CUSTOMER,
                "addr1",
                "birthdate1"
            );

            jest
                .spyOn(UserDAO.prototype, "getUserByUsername")
                .mockRejectedValueOnce(new BadRequestError());

            await expect(
                controller.updateUserInfo(user, "newName", "newSurname", "newAddr", "2021-13-01", "u1")
            ).rejects.toThrow(BadRequestError);
        });
    });
});
