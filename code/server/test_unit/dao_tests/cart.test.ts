import { Database } from 'sqlite3';
import {Cart, ProductInCart} from '../../src/components/cart'
import CartDAO from '../../src/dao/cartDAO'
import {Category} from '../../src/components/product'
import {jest, test, describe, expect, afterEach} from "@jest/globals"
import { CartNotFoundError } from "../../src/errors/cartError";
import db from "../../src/db/db"
import { EmptyProductStockError, LowProductStockError, ProductNotFoundError } from "../../src/errors/productError";
import dayjs from "dayjs";

jest.setTimeout(100000);

describe('getCart', () => {

    afterEach(()=> {jest.clearAllMocks()
    });

    test('It should return a cart if s matching cart is found', async () => {
        const cartDAO = new CartDAO();
        const userId = '123';
        const mockRow = {
            customer: userId,
            paid: false,
            payment_date: '2023-06-01',
            total: 100
        };

        jest.spyOn(db, "get").mockImplementation((sql, params, callback) => {
            callback(null,mockRow);
            return {} as Database;
        });


        const result = await cartDAO.getCart(userId);
        expect(result).toEqual(new Cart(userId, false, '2023-06-01', 100, []));
        expect(jest.spyOn(db, "get")).toHaveBeenCalledWith(expect.any(String), [userId], expect.any(Function));

    })

    test('It should return an empty cart if no matching cart is found', async () => {
        const cartDAO = new CartDAO();
        const userId = '123';
        jest.spyOn(db, "get").mockImplementation((query, params, callback) => {
            callback(null, null);
            return {} as Database;
        });

        const result = await cartDAO.getCart(userId);
        expect(result.customer).toEqual(userId);
        expect(result.paid).toEqual(false);
        expect(result.paymentDate).toEqual(null);
        expect(result.total).toEqual(0);
        expect(result.products).toEqual([]);
        expect(jest.spyOn(db, "get")).toHaveBeenCalledWith(expect.any(String), [userId], expect.any(Function));
    });

    test('It should reject with an error if the database query fails', async() =>{
        const cartDAO = new CartDAO();
        const userId = '123';
        const errorMessage = 'DB test Error';
        jest.spyOn(db, "get").mockImplementation((query, params, callback) => {
            callback(new Error(errorMessage), null);
            return {} as Database;
        });
        
        await expect(cartDAO.getCart(userId)).rejects.toThrow(errorMessage);
        expect(jest.spyOn(db, "get")).toHaveBeenCalledWith(expect.any(String), [userId], expect.any(Function));
    });
})

describe('getCustomerCarts', () => {

    test('It should resolve with an array of Cart objects when carts are found', async() =>{
        const cartDAO = new CartDAO();
        const mockRows = [
            { id: 1, customer: 'userTest', paid: true, payment_date: '2023-06-01', total: 100 },
            { id: 2, customer: 'userTest', paid: false, payment_date: '2023-06-02', total: 150 }
        ];

        jest.spyOn(db, "all").mockImplementation((query, params, callback) => {
            callback(null, mockRows);
            return {} as Database;
        });
        
        const expectedCarts = mockRows.map(row => new Cart(row.customer,row.paid,row.payment_date, row.total, []));
        await expect(cartDAO.getCostumerCarts('userTest')).resolves.toEqual(expectedCarts);
        expect(jest.spyOn(db, "all")).toHaveBeenCalledWith(expect.any(String),['userTest'], expect.any(Function));
    })

    test('It should resolve with error CartNotFoundError when no carts are found', async () => {
        const cartDAO = new CartDAO();
        jest.spyOn(db, "all").mockImplementation((query, params, callback) => {
            callback(null, []);
            return {} as Database;
        });

        await expect(cartDAO.getCostumerCarts('userTest')).resolves.toEqual([]);
        expect(jest.spyOn(db, "all")).toHaveBeenCalledWith(expect.any(String), ['userTest'], expect.any(Function));
    });

    test('It should reject with an error when the database query fails', async () => {
        const errorMessage = 'DB test error';
        const cartDAO = new CartDAO();
        jest.spyOn(db, "all").mockImplementation((query, params, callback) => {
            callback(new Error(errorMessage), null);
            return {} as Database;
        });

        await expect(cartDAO.getCostumerCarts('userTest')).rejects.toThrow(errorMessage);
        expect(jest.spyOn(db, "all")).toHaveBeenCalledWith(expect.any(String),['userTest'], expect.any(Function));
    });
})


describe('getCartId', () => {
    afterEach(() => {
        jest.clearAllMocks();
    });

    test('should resolve with the cart ID when a cart is found', async () => {
        const mockRow = { id: 123 };
        const cartDAO = new CartDAO();
        jest.spyOn(db, "get").mockImplementation((query, params, callback) => {
            callback(null, mockRow);
            return {} as Database;
        });

        await expect(cartDAO.getCartId('userTest',false)).resolves.toEqual(123);
    });

    test('should resolve with undefined when no cart is found', async () => {
        const cartDAO = new CartDAO();
        jest.spyOn(db, "get").mockImplementation((query, params, callback) => {
            callback(null, null);
            return {} as Database;
        });

        await expect(cartDAO.getCartId('userTest', false)).resolves.toBeNull();
    });

    test('should reject with an error when the database query fails', async () => {
        const errorMessage = 'DB test error';
        const cartDAO = new CartDAO();
        jest.spyOn(db, "get").mockImplementation((query, params, callback) => {
            callback(new Error(errorMessage), null);
            return {} as Database;
        });
        await expect(cartDAO.getCartId('userTest',false)).rejects.toThrow(errorMessage);
    });
});

describe('getCartsIds', () => {
    afterEach(() => {
        jest.clearAllMocks();
    });

    test('It should resolve with an array of cart IDs when carts are found', async () => {
        const cartDAO = new CartDAO();
        const mockRows = [
            { id: 123 },
            { id: 456 }
        ];
        
        jest.spyOn(db, "all").mockImplementation((query, params, callback) => {
            callback(null, mockRows);
            return {} as Database;
        });

        await expect(cartDAO.getCartsIds('userTest', true)).resolves.toEqual([123, 456]);
    });

    test('It should resolve with an empty array when no carts are found', async () => {
        const cartDAO = new CartDAO();
        jest.spyOn(db, "all").mockImplementation((query, params, callback) => {
            callback(null, []);
            return {} as Database;
        });

        await expect(cartDAO.getCartsIds('userTest', true)).resolves.toEqual([]);
    });

    test('It should reject with an error when the database query fails', async () => {
        const errorMessage = 'DB test error';
        const cartDAO = new CartDAO();
        jest.spyOn(db, "all").mockImplementation((query, params, callback) => {
            callback(new Error(errorMessage), null);
            return {} as Database;
        });

        await expect(cartDAO.getCartsIds('userTest', true)).rejects.toThrow(errorMessage);
    });
});

describe('getAllCarts', () => {
    afterEach(() => {
        jest.clearAllMocks();
    });

    test('It should resolve with an array of Cart objects when carts are found', async () => {
        const cartDAO = new CartDAO();
        const mockRows = [
            { customer: 'user1', paid: true, payment_date: '2023-06-01', total: 100 },
            { customer: 'user2', paid: false, payment_date: '2023-06-02', total: 150 }
        ];
        
        jest.spyOn(db, "all").mockImplementation((query, params, callback) => {
            callback(null, mockRows);
            return {} as Database;
        });

        const expectedCarts = mockRows.map(row => new Cart(row.customer,row.paid,row.payment_date, row.total, []));
        await expect(cartDAO.getAllCarts()).resolves.toEqual(expectedCarts);
    });

    test('It should resolve with an empty array when no carts are found', async () => {
        const cartDAO = new CartDAO();
        jest.spyOn(db, "all").mockImplementation((query, params, callback) => {
            callback(null, []);
            return {} as Database;
        });

        await expect(cartDAO.getAllCarts()).resolves.toEqual([]);
    });

    test('It should reject with an error when the database query fails', async () => {
        const cartDAO = new CartDAO();
        const errorMessage = 'DB test error';
        
        jest.spyOn(db, "all").mockImplementation((query, params, callback) => {
            callback(new Error(errorMessage), null);
            return {} as Database;
        });

        await expect(cartDAO.getAllCarts()).rejects.toThrow(errorMessage);
    });
});

describe('getAllCartsIds', () => {
    afterEach(() => {
        jest.clearAllMocks();
    });

    test('It should resolve with an array of cart IDs when carts are found', async () => {
        const cartDAO = new CartDAO();
        const mockRows = [
            { id: 123 },
            { id: 456 }
        ];
        
        jest.spyOn(db, "all").mockImplementation((query, params, callback) => {
            callback(null, mockRows);
            return {} as Database;
        });

        await expect(cartDAO.getAllCartsIds()).resolves.toEqual([123, 456]);
    });

    test('It should resolve with an empty array when no carts are found', async () => {
        const cartDAO = new CartDAO();
        jest.spyOn(db, "all").mockImplementation((query, params, callback) => {
            callback(null, []);
            return {} as Database;
        });

        await expect(cartDAO.getAllCartsIds()).resolves.toEqual([]);
    });

    test('It should reject with an error when the database query fails', async () => {
        const cartDAO = new CartDAO();
        const errorMessage = 'DB test error';
        
        jest.spyOn(db, "all").mockImplementation((query, params, callback) => {
            callback(new Error(errorMessage), null);
            return {} as Database;
        });

        await expect(cartDAO.getAllCartsIds()).rejects.toThrow(errorMessage);
    });
});

describe('getProductsInCart', () => {
    afterEach(() => {
        jest.clearAllMocks();
    });

    test('It should resolve with an array of ProductInCart associated with the products in the cart', async() => {
        const cartDAO = new CartDAO();
        const cartId = 123;
        const mockRows = [
            { model: 'product1', quantity: 2, category: Category.SMARTPHONE, price: 100 },
            { model: 'product2', quantity: 3, category: Category.APPLIANCE, price: 150 }
        ];
        jest.spyOn(db, "all").mockImplementation((query, params, callback) => {
            callback(null, mockRows);
            return {} as Database;
        });
        const expectedCarts = mockRows.map(row => new ProductInCart(row.model,row.quantity,row.category, row.price));
        await expect(cartDAO.getProductsInCart(cartId)).resolves.toEqual(expectedCarts);
    });

    test('It should resolve with an array empty of ProductInCart when no products are in the cart', async() => {
        const cartDAO = new CartDAO();
        const cartId = 123;
        jest.spyOn(db, "all").mockImplementation((query, params, callback) => {
            callback(null, []);
            return {} as Database;
        });
        await expect(cartDAO.getProductsInCart(cartId)).resolves.toEqual([]);
    });

    test('It should reject with an error when the database query fails', async() => {
        const cartDAO = new CartDAO();
        const cartId = 123;
        const errorMessage = 'DB test error';
        jest.spyOn(db, "all").mockImplementation((query, params, callback) => {
            callback(new Error(errorMessage), null)
            return {} as Database;
        });
        await expect(cartDAO.getProductsInCart(cartId)).rejects.toThrow(errorMessage);
    });
})

describe('deleteAllCarts', () => {
    afterEach(() => {
        jest.clearAllMocks();
    });

    test('It should resolve with true when carts are deleted', async () => {
        const cartDAO = new CartDAO();
        jest.spyOn(db, "run").mockImplementation(function(query, params, callback) {
            expect(query).toBe('DELETE FROM Carts');
            expect(params).toEqual([]);
            callback.call({ changes: 1 }, null); // Call callback with a context having changes = 1
            return {} as Database;
        });

        await expect(cartDAO.deleteAllCarts()).resolves.toBe(true);
    });

    test('It should resolve with false when no carts are deleted', async () => {
        const cartDAO = new CartDAO();
        jest.spyOn(db, "run").mockImplementation(function(query, params, callback) {
            expect(query).toBe('DELETE FROM Carts');
            expect(params).toEqual([]);
            callback.call({ changes: 0 }, null); // Call callback with a context having changes = 0
            return {} as Database;
        });
        await expect(cartDAO.deleteAllCarts()).resolves.toBe(false);
    });

    test('It should reject with an error when the database query fails', async () => {
        const errorMessage = 'DB test error';
        const cartDAO = new CartDAO();
        jest.spyOn(db, "run").mockImplementation(function(query, params, callback) {
            expect(query).toBe('DELETE FROM Carts');
            expect(params).toEqual([]);
            callback(new Error(errorMessage));
            return {} as Database;
        });

        await expect(cartDAO.deleteAllCarts()).rejects.toThrow(errorMessage);
    });
});

describe('clearCart', () => {
    afterEach(() => {
        jest.clearAllMocks();
    });

    test('It should resolve with true when the cart is successfully cleared', async () => {
        const cartId = 1;
            const cartDAO = new CartDAO();
        jest.spyOn(db, "run").mockImplementation(function(query, params, callback) {
            expect(params).toEqual([cartId]);
            callback.call({ changes: 1 }, null); // Call callback with a context having changes = 1
            return {} as Database;
        });

        await expect(cartDAO.clearCart(cartId)).resolves.toBe(true);
    });

    test('It should reject with CartNotFoundError when the cart is not found', async () => {
        const cartId = 1;
        const cartDAO = new CartDAO();
        jest.spyOn(db, "run").mockImplementation(function(query, params, callback) {
            expect(params).toEqual([cartId]);
            callback.call({ changes: 0 }, null); // Call callback with a context having changes = 0
            return {} as Database;
        });

        await expect(cartDAO.clearCart(cartId)).rejects.toThrow(CartNotFoundError);
    });

    test('It should reject with an error when the database query fails', async () => {
        const errorMessage = 'DB test error';
        const cartId = 1;
        const cartDAO = new CartDAO();
        jest.spyOn(db, "run").mockImplementation(function(query, params, callback) {
            expect(params).toEqual([cartId]); // Assuming we're passing cartId = 1 for the test
            callback(new Error(errorMessage));
            return {} as Database;
        });

        await expect(cartDAO.clearCart(cartId)).rejects.toThrow(errorMessage);
    });
});

describe('delProdsFromCart', () => {
    afterEach(() => {
        jest.clearAllMocks();
    });

    test('It should resolve when products are successfully deleted from the cart', async () => {
        const cartDAO = new CartDAO();
        const cartId = 1;
        jest.spyOn(db, "run").mockImplementation(function(query, params, callback) {
            expect(params).toEqual([cartId]); 
            callback(null);
            return {} as Database;
        });

        await expect(cartDAO.delProdsFromCart(cartId)).resolves.toBeUndefined();
    });

    test('It should reject with an error when the database query fails', async () => {
        const errorMessage = 'DB test error';
        const cartDAO = new CartDAO();
        const cartId = 1;
        jest.spyOn(db, "run").mockImplementation(function(query, params, callback) {
            expect(params).toEqual([cartId]); 
            callback(new Error(errorMessage));
            return {} as Database;
        });

        await expect(cartDAO.delProdsFromCart(cartId)).rejects.toThrow(errorMessage);
    });
});

describe('removeProductFromCart', () => {
    afterEach(() => {
        jest.clearAllMocks();
    });

    test('should delete the product from the cart when b is 1', async () => {
        const cartDAO = new CartDAO();
        const b = 1;
        const cartId = 123;
        jest.spyOn(db, "run").mockImplementation(function(query, params, callback) {
            expect(query).toBe('DELETE FROM products_in_carts WHERE cart_id = ? AND product_model = ?');
            expect(params).toEqual([cartId, 'model1']);
            callback(null); // Simulate successful deletion
            return {} as Database;
        });

        await expect(cartDAO.removeProductFromCart(cartId, 'model1', b)).resolves.toBeUndefined();
    });

    test('It should decrement the product quantity in the cart when b is more than 1', async () => {
        const cartDAO = new CartDAO();
        const b = 2;
        const cartId = 123;
        jest.spyOn(db, "run").mockImplementation(function(query, params, callback) {
            expect(query).toBe('UPDATE products_in_carts SET quantity = quantity - 1 WHERE cart_id = ? AND product_model = ?');
            expect(params).toEqual([cartId, 'model1']);
            callback(null); // Simulate successful update
            return {} as Database;
        });

        await expect(cartDAO.removeProductFromCart(cartId, 'model1', b)).resolves.toBeUndefined();
    });

    test('It should reject with an error when the database query fails', async () => {
        const errorMessage = 'DB test error';
        const b = 2;
        const cartId = 123;
        const cartDAO = new CartDAO();
        jest.spyOn(db, "run").mockImplementation(function(query, params, callback) {
            expect(params).toEqual([cartId, 'model1']); // Assuming we're passing cartId = 1 and model = 'model1' for the test
            callback(new Error(errorMessage)); // Simulate database error
            return {} as Database;
        });

        await expect(cartDAO.removeProductFromCart(cartId, 'model1', b)).rejects.toThrow(errorMessage);
    }); 
});

describe('productExists', () => {
    afterEach(() => {
        jest.clearAllMocks();
    });

    test('should resolve with the selling price when the product exists', async () => {
        const mockModel = 'modelTest';
        const mockSellingPrice = 99.99;
        const mockRow = { id: 1, selling_price: 99.99, model: 'modelTest', category: 'SMARTPHONE', arrival_date: '2024-05-08', details: '...', quantity: 5 };
        const cartDAO = new CartDAO();

        jest.spyOn(db, "get").mockImplementation((query, params, callback) => {
            callback(null, mockRow);
            return {} as Database;
        });

        await expect(cartDAO.productExists(mockModel)).resolves.toBe(mockSellingPrice);
        expect(jest.spyOn(db, "get")).toHaveBeenCalledWith(expect.any(String), [mockModel], expect.any(Function));
    });

    test('It should reject with ProductNotFoundError when the product does not exist', async () => {
        const mockModel = 'non-existent-model';
        const cartDAO = new CartDAO();

        jest.spyOn(db, "get").mockImplementation((query, params, callback) => {
            callback(null, null);
            return {} as Database;
        });

        await expect(cartDAO.productExists(mockModel)).rejects.toThrow(ProductNotFoundError);
        expect(jest.spyOn(db, "get")).toHaveBeenCalledWith(expect.any(String), [mockModel], expect.any(Function));
    });

    test('It should reject with an error when there is a database error', async () => {
        const mockModel = 'test-model';
        const mockError = new Error('DB test error');
        const cartDAO = new CartDAO();

        jest.spyOn(db, "get").mockImplementation((query, params, callback) => {
            callback(mockError, null);
            return {} as Database;
        });

        await expect(cartDAO.productExists(mockModel)).rejects.toThrow('DB test error');
        expect(jest.spyOn(db, "get")).toHaveBeenCalledWith(expect.any(String), [mockModel], expect.any(Function));
    });
});


describe('alreadyInCart', () => {
    afterEach(() => {
        jest.clearAllMocks();
    });

    test('It should resolve with the quantity when the product is already in the cart', async () => {
        const mockCartId = 1;
        const mockModel = 'modelTest';
        const expectedQuantity = 3;
        const cartDAO = new CartDAO();
        const mockRow = { product_model: 'modelTest', cart_id: 1, quantity: 3};

        jest.spyOn(db, "get").mockImplementation((query, params, callback) => {
            callback(null, mockRow);
            return {} as Database;
        });

        await expect(cartDAO.alreadyInCart(mockCartId, mockModel)).resolves.toBe(expectedQuantity);
        expect(db.get).toHaveBeenCalledWith(expect.any(String), [mockModel, mockCartId], expect.any(Function));
    });

    test('It should resolve with null when the product is not in the cart', async () => {
        const mockCartId = 1;
        const mockModel = 'modelTest';
        const cartDAO = new CartDAO();
        const mockRow = { product_model: 'modelTest', cart_id: 1, quantity: 3};

        jest.spyOn(db, "get").mockImplementation((query, params, callback) => {
            callback(null, null);
            return {} as Database;
        });

        await expect(cartDAO.alreadyInCart(mockCartId, mockModel)).resolves.toBeNull();
        expect(db.get).toHaveBeenCalledWith(expect.any(String), [mockModel, mockCartId], expect.any(Function));
    });

    test('It should reject with an error when there is a database error', async () => {
        const mockCartId = 1;
        const mockModel = 'modelTest';
        const mockError = new Error('DB test error');
        const cartDAO = new CartDAO();

        jest.spyOn(db, "get").mockImplementation((query, params, callback) => {
            callback(mockError, null);
            return {} as Database;
        });

        await expect(cartDAO.alreadyInCart(mockCartId, mockModel)).rejects.toThrow('DB test error');
        expect(db.get).toHaveBeenCalledWith(expect.any(String), [mockModel, mockCartId], expect.any(Function));
    });
});

describe('cartIsEmpty', () => {
    afterEach(() => {
        jest.clearAllMocks();
    });

    test('It should resolve with false when the cart is not empty', async () => {
        const mockCartId = 1;
        const mockRow = { id: 1, customer: 'custTest', paid: false, payment_date:'', total: 100};
        const cartDAO = new CartDAO();

        jest.spyOn(db, "get").mockImplementation((query, params, callback) => {
            callback(null, mockRow);
            return {} as Database;
        });

        await expect(cartDAO.cartIsEmpty(mockCartId)).resolves.toBe(false);
        expect(jest.spyOn(db, "get")).toHaveBeenCalledWith(expect.any(String), [mockCartId], expect.any(Function));
    });

    test('It should resolve with true when the cart is empty', async () => {
        const mockCartId = 1;
        const cartDAO = new CartDAO();

        jest.spyOn(db, "get").mockImplementation((query, params, callback) => {
            callback(null, null);
            return {} as Database;
        });

        await expect(cartDAO.cartIsEmpty(mockCartId)).resolves.toBe(true);
        expect(db.get).toHaveBeenCalledWith(expect.any(String), [mockCartId], expect.any(Function));
    });

    test('It should reject with an error when there is a database error', async () => {
        const mockCartId = 1;
        const mockError = new Error('DB test error');
        const cartDAO = new CartDAO();

        jest.spyOn(db, "get").mockImplementation((query, params, callback) => {
            callback(mockError, null);
            return {} as Database;
        });

        await expect(cartDAO.cartIsEmpty(mockCartId)).rejects.toThrow('DB test error');
        expect(db.get).toHaveBeenCalledWith(expect.any(String), [mockCartId], expect.any(Function));
    });
});

describe('addToCart', () => {
    afterEach(() => {
        jest.clearAllMocks();
    });

    test('It should insert a new product into the cart when bool is false', async () => {
        const mockProduct = 'test-product';
        const mockCartId = 1;
        const mockBool = false;
        const cartDAO = new CartDAO();

        jest.spyOn(db, "run").mockImplementation((query, params, callback) => {
            callback(null);
            return {} as Database;
        });

        await expect(cartDAO.addToCart(mockProduct, mockCartId, mockBool)).resolves.toBeUndefined();
        expect(db.run).toHaveBeenCalledWith(expect.stringContaining('INSERT INTO'), [mockProduct, mockCartId], expect.any(Function));
    });

    test('It should update the quantity of the existing product in the cart when bool is true', async () => {
        const mockProduct = 'test-product';
        const mockCartId = 1;
        const mockBool = true;
        const cartDAO = new CartDAO();

        jest.spyOn(db, "run").mockImplementation((query, params, callback) => {
            callback(null);
            return {} as Database;
        });

        await expect(cartDAO.addToCart(mockProduct, mockCartId, mockBool)).resolves.toBeUndefined();
        expect(db.run).toHaveBeenCalledWith(expect.stringContaining('UPDATE'), [mockProduct, mockCartId], expect.any(Function));
    });

    test('It should reject with an error when there is a database error', async () => {
        const mockProduct = 'test-product';
        const mockCartId = 1;
        const mockBool = false;
        const mockError = new Error('DB test error');
        const cartDAO = new CartDAO();

        jest.spyOn(db, "run").mockImplementation((query, params, callback) => {
            callback(mockError);
            return {} as Database;
        });

        await expect(cartDAO.addToCart(mockProduct, mockCartId, mockBool)).rejects.toThrow('DB test error');
        expect(db.run).toHaveBeenCalledWith(expect.any(String), [mockProduct, mockCartId], expect.any(Function));
    });
});

describe('newCart', () => {
    afterEach(() => {
        jest.clearAllMocks();
    });

    test('It should resolve without error when a new cart is successfully created', async () => {
        const mockUserId = 'test-user';
        const cartDAO = new CartDAO();

        jest.spyOn(db, "run").mockImplementation((query, params, callback) => {
            callback(null);
            return {} as Database;
        });

        await expect(cartDAO.newCart(mockUserId)).resolves.toBeUndefined();
        expect(db.run).toHaveBeenCalledWith(expect.stringContaining('INSERT INTO'), [mockUserId, false, null, 0], expect.any(Function));
    });

    test('It should reject with an error when there is a database error', async () => {
        const mockUserId = 'test-user';
        const mockError = new Error('DB test error');
        const cartDAO = new CartDAO();

        jest.spyOn(db, "run").mockImplementation((query, params, callback) => {
            callback(mockError);
            return {} as Database;
        });

        await expect(cartDAO.newCart(mockUserId)).rejects.toThrow('DB test error');
        expect(db.run).toHaveBeenCalledWith(expect.stringContaining('INSERT INTO'), [mockUserId, false, null, 0], expect.any(Function));
    });
});

describe('updateTotal', () => {
    afterEach(() => {
        jest.clearAllMocks();
    });

    test('It should resolve without error when the total is successfully updated', async () => {
        const mockCartId = 1;
        const mockPrice = 99.99;
        const cartDAO = new CartDAO();

        jest.spyOn(db, "run").mockImplementation((query, params, callback) => {
            callback(null);
            return {} as Database;
        });

        await expect(cartDAO.updateTotal(mockCartId, mockPrice)).resolves.toBeUndefined();
        expect(db.run).toHaveBeenCalledWith(expect.stringContaining('UPDATE'), [mockPrice, mockCartId], expect.any(Function));
    });

    test('It should reject with an error when there is a database error', async () => {
        const mockCartId = 1;
        const mockPrice = 99.99;
        const mockError = new Error('Database error');
        const cartDAO = new CartDAO();

        jest.spyOn(db, "run").mockImplementation((query, params, callback) => {
            callback(mockError);
            return {} as Database;
        });

        await expect(cartDAO.updateTotal(mockCartId, mockPrice)).rejects.toThrow('Database error');
        expect(db.run).toHaveBeenCalledWith(expect.stringContaining('UPDATE'), [mockPrice, mockCartId], expect.any(Function));
    });
});

describe('checkQuantity', () => {
        afterEach(() => {
            jest.clearAllMocks();
        });
    
        test('It should resolve with an array of stock differences when quantities are sufficient', async () => {
            const mockCartId = 1;
            const cartDAO = new CartDAO();
            const mockRows = [
                { quantityInStock: 10, quantityInCart: 2 },
                { quantityInStock: 5, quantityInCart: 1 }
            ];
            const expectedResult = [8, 4];
    
            jest.spyOn(db, "all").mockImplementation((query, params, callback) => {
                callback(null, mockRows);
                return {} as Database;
            });
    
            await expect(cartDAO.checkQuantity(mockCartId)).resolves.toEqual(expectedResult);
            expect(db.all).toHaveBeenCalledWith(expect.any(String), [mockCartId], expect.any(Function));
        });
    
        test('should reject with EmptyProductStockError when a product is out of stock', async () => {
            const mockCartId = 1;
            const cartDAO = new CartDAO();
            const mockRows = [
                { quantityInStock: 0, quantityInCart: 1 }
            ];
    
            jest.spyOn(db, "all").mockImplementation((query, params, callback) => {
                callback(null, mockRows);
                return {} as Database;
            });
    
            await expect(cartDAO.checkQuantity(mockCartId)).rejects.toThrow(EmptyProductStockError);
            expect(db.all).toHaveBeenCalledWith(expect.any(String), [mockCartId], expect.any(Function));
        });
    
        test('It should reject with LowProductStockError when stock is lower than requested quantity', async () => {
            const mockCartId = 1;
            const cartDAO = new CartDAO();
            const mockRows = [
                { quantityInStock: 1, quantityInCart: 2 }
            ];
    
            jest.spyOn(db, "all").mockImplementation((query, params, callback) => {
                callback(null, mockRows);
                return {} as Database;
            });
    
            await expect(cartDAO.checkQuantity(mockCartId)).rejects.toThrow(LowProductStockError);
            expect(db.all).toHaveBeenCalledWith(expect.any(String), [mockCartId], expect.any(Function));
        });
    
        test('It should reject with an error when there is a database error', async () => {
            const mockCartId = 1;
            const mockError = new Error('DB test error');
            const cartDAO = new CartDAO();
    
            jest.spyOn(db, "all").mockImplementation((query, params, callback) => {
                callback(mockError);
                return {} as Database;
            });
    
            await expect(cartDAO.checkQuantity(mockCartId)).rejects.toThrow('DB test error');
            expect(db.all).toHaveBeenCalledWith(expect.any(String), [mockCartId], expect.any(Function));
        });
});

describe('setAsPaid', () => {
    afterEach(() => {
        jest.clearAllMocks();
    });

    test('It should resolve without error when the cart is successfully set as paid', async () => {
        const mockCartId = 1;
        const mockDate = dayjs().format('YYYY-MM-DD').toString();
        const cartDAO = new CartDAO();

        jest.spyOn(db, "run").mockImplementation((query: string, params: any[], callback: Function) => {
            callback(null);
            return {} as Database;
        });

        await expect(cartDAO.setAsPaid(mockCartId)).resolves.toBeUndefined();
        expect(db.run).toHaveBeenCalledWith(expect.stringContaining('UPDATE'),[mockDate, mockCartId], expect.any(Function)
        );
    });

    test('should reject with an error when there is a database error', async () => {
        const mockCartId = 1;
        const mockDate = dayjs().format('YYYY-MM-DD').toString();
        const mockError = new Error('Database error');
        const cartDAO = new CartDAO();

        jest.spyOn(db, "run").mockImplementation((query,  params, callback) => {
            callback(mockError);
            return {} as Database;
        });

        await expect(cartDAO.setAsPaid(mockCartId)).rejects.toThrow('Database error');
        expect(db.run).toHaveBeenCalledWith(expect.stringContaining('UPDATE'), [mockDate, mockCartId],expect.any(Function));
    });
});










