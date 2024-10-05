import db from "../db/db"

import { User } from "../components/user"
import UserDAO from "../dao/userDAO"
import { UserAlreadyExistsError, UserNotFoundError, UnauthorizedUserError, UserNotAdminError, UserIsAdminError, BadRequestError } from "../errors/userError";
import { error } from "console";



/**
 * Represents a controller for managing users.
 * All methods of this class must interact with the corresponding DAO class to retrieve or store data.
 */
class UserController {
    private dao: UserDAO

    constructor() {
        this.dao = new UserDAO
    }
    //prova

    /**
     * Creates a new user.
     * @param username - The username of the new user. It must not be null and it must not be already taken.
     * @param name - The name of the new user. It must not be null.
     * @param surname - The surname of the new user. It must not be null.
     * @param password - The password of the new user. It must not be null.
     * @param role - The role of the new user. It must not be null and it can only be one of the three allowed types ("Manager", "Customer", "Admin")
     * @returns A Promise that resolves to true if the user has been created.
     */
    async createUser(username: string, name: string, surname: string, password: string, role: string): Promise<Boolean> {
        if (username == "" || name == "" || surname == "" || password == "" || role == "") {
            throw (new BadRequestError());
        }
        if (role !== "Admin" && role !== "Customer" && role !== "Manager") {
            throw (new BadRequestError());
        }
        return this.dao.createUser(username, name, surname, password, role)
    }

    /**
     * Returns all users.
     * @returns A Promise that resolves to an array of users.
     */
    async getUsers(): Promise<User[]> {
        return await this.dao.getUsers();
    }

    /**
     * Returns all users with a specific role.
     * @param role - The role of the users to retrieve. It can only be one of the three allowed types ("Manager", "Customer", "Admin")
     * @returns A Promise that resolves to an array of users with the specified role.
     */
    async getUsersByRole(role: string): Promise<User[]> {
        if (role !== "Admin" && role !== "Customer" && role !== "Manager") {
            throw (new BadRequestError());
        }
        return await this.dao.getUsersByRole(role);
    }

    /**
     * Returns a specific user.
     * The function has different behavior depending on the role of the user calling it:
     * - Admins can retrieve any user
     * - Other roles can only retrieve their own information
     * @param username - The username of the user to retrieve. The user must exist.
     * @returns A Promise that resolves to the user with the specified username.
     */
    async getUserByUsername(user: User, username: string): Promise<User> {
        if (username.length == 0) {
            throw (new BadRequestError())
        }
        if (user.role !== "Admin" && user.username !== username) {
            throw (new UnauthorizedUserError())
        }
        return this.dao.getUserByUsername(username)
    }

    /**
     * Deletes a specific user
     * The function has different behavior depending on the role of the user calling it:
     * - Admins can delete any non-Admin user
     * - Other roles can only delete their own account
     * @param username - The username of the user to delete. The user must exist.
     * @returns A Promise that resolves to true if the user has been deleted.
     */
    async deleteUser(user: User, username: string): Promise<Boolean> {
        try {
            if (user.role !== "Admin" && user.username !== username) {
                throw new UserNotAdminError();
            }
            const userToDelete = await this.dao.getUserByUsername(username);
            if (userToDelete.role === "Admin") {
                throw new UserIsAdminError();
            }
            return this.dao.deleteUser(username);
        } catch (error) {
            throw error;
        }
    }

    /**
     * Deletes all non-Admin users
     * @returns A Promise that resolves to true if all non-Admin users have been deleted.
     */
    async deleteAll(): Promise<Boolean> {

        try {
            const roleToEvit = "Admin"
            return this.dao.deleteAllUsers(roleToEvit);
        } catch (error) {
            throw error;
        }


    }

    /**
     * Updates the personal information of one user. The user can only update their own information.
     * @param user The user who wants to update their information
     * @param name The new name of the user
     * @param surname The new surname of the user
     * @param address The new address of the user
     * @param birthdate The new birthdate of the user
     * @param username The username of the user to update. It must be equal to the username of the user parameter.
     * @returns A Promise that resolves to the updated user
     */
    async updateUserInfo(user: User, name: string, surname: string, address: string, birthdate: string, username: string): Promise<User> {
        const regex = /^\d{4}-\d{2}-\d{2}$/;
        const currentDate = new Date();
        const birthday = new Date(birthdate);

        if (username === "" || name === "" || surname === "" || address === "" || birthdate === "") {
            throw new BadRequestError();
        }
        if (!regex.test(birthdate)) {
            throw new BadRequestError();
        }
        if (birthday > currentDate) {
            throw new BadRequestError();
        }

        const userToUpdate = await this.dao.getUserByUsername(username); // Check if the user exists, if this fails a UserNotFoundError is thrown

        if (user.role !== "Admin" && user.username !== username) {
            throw new UnauthorizedUserError();
        }

        try {
            if (userToUpdate.role === "Admin" && user.role === "Admin" && user.username !== username) {
                throw new UnauthorizedUserError();
            }
            const updateSuccess = await this.dao.updateUser(name, surname, address, birthdate, username);
            if (updateSuccess) {
                return this.dao.getUserByUsername(username);
            } else {
                throw new UserNotFoundError();
            }
        } catch (error) {
            throw error;
        }
    };


}

export default UserController