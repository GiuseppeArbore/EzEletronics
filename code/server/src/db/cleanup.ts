"use strict"

import db from "../db/db";

/**
 * Deletes all data from the database.
 * This function must be called before any integration test, to ensure a clean database state for each test run.
 */

export const cleanup = async (): Promise<void> => {
    const runQuery = (query: string): Promise<void> => {
        return new Promise((resolve, reject) => {
            db.run(query, (err: any) => {
                if (err) reject(err);
                else resolve();
            });
        });
    };

    await runQuery("DELETE FROM products_in_carts");
    await runQuery("DELETE FROM reviews");
    await runQuery("DELETE FROM carts");
    await runQuery("DELETE FROM products");
    await runQuery("DELETE FROM users");
};
