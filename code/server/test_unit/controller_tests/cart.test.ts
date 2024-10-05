import {test, jest, expect, describe, afterEach, beforeEach} from "@jest/globals"
import CartDAO from "../../src/dao/cartDAO"
import { Category, Product } from "../../src/components/product";
import ProductDAO from "../../src/dao/productDAO"

import CartController from "../../src/controllers/cartController";
import { Role, User } from "../../src/components/user";
import { EmptyProductStockError, ProductNotFoundError } from "../../src/errors/productError";
import { Cart, ProductInCart } from "../../src/components/cart";
import { CartNotFoundError, EmptyCartError, ProductNotInCartError } from "../../src/errors/cartError";

jest.mock("../../src/dao/cartDAO")
jest.mock("../../src/dao/productDAO")
jest.setTimeout(100000);

const mockUser: User = { 
    username: 'testuser',
    name: 'testName', 
    surname: 'testSurname', 
    role: Role.CUSTOMER, 
    address: 'Street Test', 
    birthdate: '1990-01-01'
};

describe('addToCart', () => {
    const mockProduct: Product = { 
        model: 'test-product', 
        category: Category.SMARTPHONE, 
        quantity: 5, sellingPrice: 10.99, 
        arrivalDate: '2024-03-03', 
        details:'details test'};
    const testCartId = 1;
    const controller = new CartController();
    afterEach(() => {
        jest.clearAllMocks();
    });

    test('It should add product to cart and update total if product exists and there is enough stock', async() => {
        jest.spyOn(ProductDAO.prototype,'getProductByModel').mockResolvedValue(mockProduct);
        jest.spyOn(CartDAO.prototype,'getCartId').mockResolvedValue(testCartId);
        jest.spyOn(CartDAO.prototype,'alreadyInCart').mockResolvedValue(null);

        await expect(controller.addToCart(mockUser, 'test-product')).resolves.toBe(true);

        expect(ProductDAO.prototype.getProductByModel).toHaveBeenCalledWith('test-product');
        expect(CartDAO.prototype.getCartId).toHaveBeenCalledWith('testuser', false);
        expect(CartDAO.prototype.addToCart).toHaveBeenCalledWith('test-product', 1, false);
        expect(CartDAO.prototype.updateTotal).toHaveBeenCalledWith(testCartId, mockProduct.sellingPrice);
    })

    test('It should create new cart if user does not have a cart', async () => {
        const mockProduct: Product = { model: 'test-product', category: Category.SMARTPHONE, quantity: 5, sellingPrice: 10.99, arrivalDate: '2024-03-03', details: 'details test'};
        const controller = new CartController();

        jest.spyOn(ProductDAO.prototype,'getProductByModel').mockResolvedValue(mockProduct);
        jest.spyOn(CartDAO.prototype,'getCartId').mockResolvedValueOnce(null);
        jest.spyOn(CartDAO.prototype,'newCart').mockResolvedValue(undefined);
        jest.spyOn(CartDAO.prototype,'getCartId').mockResolvedValue(2);


        await expect(controller.addToCart(mockUser, 'test-product')).resolves.toBe(true);

        expect(ProductDAO.prototype.getProductByModel).toHaveBeenCalledWith('test-product');
        expect(CartDAO.prototype.getCartId).toHaveBeenCalledWith('testuser', false);
        expect(CartDAO.prototype.newCart).toHaveBeenCalledWith('testuser');
        expect(CartDAO.prototype.getCartId).toHaveBeenCalledWith('testuser', false);
        expect(CartDAO.prototype.addToCart).toHaveBeenCalledWith('test-product', 2, false);
        expect(CartDAO.prototype.updateTotal).toHaveBeenCalledWith(2, mockProduct.sellingPrice);
    });

    test('It should reject with ProductNotFoundError if product does not exist', async() => {
        const outOfStockProduct = { 
            ...mockProduct, 
            quantity: 0 
        };
        
        jest.spyOn(ProductDAO.prototype,'getProductByModel').mockResolvedValue(outOfStockProduct);
        
        await expect(controller.addToCart(mockUser, 'product-out-of-stock')).rejects.toThrow(EmptyProductStockError);
        
        expect(ProductDAO.prototype.getProductByModel).toHaveBeenCalledWith('product-out-of-stock');
    });

    test('It should reject with EmptyProductStockError if product is out of stock', async() => {
        jest.spyOn(ProductDAO.prototype,'getProductByModel').mockResolvedValue(null!);
        await expect(controller.addToCart(mockUser, 'non-existent-product')).rejects.toThrow(ProductNotFoundError);
        expect(ProductDAO.prototype.getProductByModel).toHaveBeenCalledWith('non-existent-product');
    });
});

describe('getCart', () => {
    const mockCart: Cart = { 
        customer: 'testuser', 
        paid: false, 
        paymentDate: null! , 
        total: 100, 
        products: [] 
    };
    const mockCartEmpty: Cart = { 
        ...mockCart, 
        total: 0
    };
    const mockError = new Error('DB test error');
    const controller = new CartController();

    afterEach(() => {
        jest.clearAllMocks();
    });

    test('should retrieve the cart with products if the cart total is not zero', async () => {
        const mockCartId = 1;
        const mockProductsInCart: ProductInCart[] = [
            { model: 'product1', quantity: 2, category: Category.SMARTPHONE, price: 10.99 },
            { model: 'product2', quantity: 1, category: Category.LAPTOP, price: 20.99 },
        ];

        jest.spyOn(CartDAO.prototype,'getCart').mockResolvedValue(mockCart);
        jest.spyOn(CartDAO.prototype, 'getCartId').mockResolvedValue(mockCartId);
        jest.spyOn(CartDAO.prototype,'getProductsInCart').mockResolvedValue(mockProductsInCart);

        const result = await controller.getCart(mockUser);

        expect(result).toEqual({
            customer: 'testuser',
            paid: false,
            paymentDate: null,
            total: 100,
            products: mockProductsInCart,
        });
        expect(CartDAO.prototype.getCart).toHaveBeenCalledWith('testuser');
        expect(CartDAO.prototype.getCartId).toHaveBeenCalledWith('testuser', false);
        expect(CartDAO.prototype.getProductsInCart).toHaveBeenCalledWith(mockCartId);
    });

    test('It should retrieve the cart without products if the cart total is zero', async () => {
        const controller = new CartController();

        jest.spyOn(CartDAO.prototype,'getCart').mockResolvedValue(mockCartEmpty);

        const result = await controller.getCart(mockUser);

        expect(result).toEqual(mockCartEmpty);
        expect(CartDAO.prototype.getCart).toHaveBeenCalledWith('testuser');
        expect(CartDAO.prototype.getCartId).not.toHaveBeenCalled();
        expect(CartDAO.prototype.getProductsInCart).not.toHaveBeenCalled();
    });

    test('It should reject if there is an error retrieving the cart', async () => {

        jest.spyOn(CartDAO.prototype,'getCart').mockRejectedValue(mockError);

        await expect(controller.getCart(mockUser)).rejects.toThrow('DB test error');
        expect(CartDAO.prototype.getCart).toHaveBeenCalledWith('testuser');
        expect(CartDAO.prototype.getCartId).not.toHaveBeenCalled();
        expect(CartDAO.prototype.getProductsInCart).not.toHaveBeenCalled();
    });
});

describe('checkoutCart', () => {
    const controller = new CartController();
    const mockCartId = 1;
    afterEach(() => {
        jest.clearAllMocks();
    });

    test('It should successfully checkout cart with products and update quantities', async () => {
        const mockCart: Cart = { customer: 'testuser', paid: false, paymentDate: null!, total: 100, products: [
            { model: 'product1', quantity: 2, category: Category.SMARTPHONE, price: 10.99 },
            { model: 'product2', quantity: 1, category: Category.APPLIANCE, price: 20.99 },
        ]};
        const mockNewQuantities: number[] = [3, 4];

        jest.spyOn(CartDAO.prototype, 'getCartId').mockResolvedValue(mockCartId);
        jest.spyOn(CartDAO.prototype,'getCart').mockResolvedValue(mockCart);
        jest.spyOn(CartDAO.prototype,'getProductsInCart').mockResolvedValue(mockCart.products);
        jest.spyOn(CartDAO.prototype,'checkQuantity').mockResolvedValue(mockNewQuantities);

        const result = await controller.checkoutCart(mockUser);

        expect(result).toBe(true);
        expect(CartDAO.prototype.getCartId).toHaveBeenCalledWith('testuser', false);
        expect(CartDAO.prototype.getCart).toHaveBeenCalledWith('testuser');
        expect(CartDAO.prototype.getProductsInCart).toHaveBeenCalledWith(mockCartId);
        expect(CartDAO.prototype.checkQuantity).toHaveBeenCalledWith(mockCartId);
        expect(ProductDAO.prototype.updateProductQuantity).toHaveBeenCalledWith('product1', 3);
        expect(ProductDAO.prototype.updateProductQuantity).toHaveBeenCalledWith('product2', 4);
        expect(CartDAO.prototype.setAsPaid).toHaveBeenCalledWith(mockCartId);
    });

    test('It should reject with CartNotFoundError if cart does not exist', async () => {
        jest.spyOn(CartDAO.prototype, 'getCartId').mockResolvedValue(null);

        await expect(controller.checkoutCart(mockUser)).rejects.toThrow(CartNotFoundError);
        
        expect(CartDAO.prototype.getCartId).toHaveBeenCalledWith('testuser', false);
        expect(CartDAO.prototype.getCart).not.toHaveBeenCalled();
        expect(CartDAO.prototype.getProductsInCart).not.toHaveBeenCalled();
        expect(CartDAO.prototype.checkQuantity).not.toHaveBeenCalled();
        expect(ProductDAO.prototype.updateProductQuantity).not.toHaveBeenCalled();
        expect(CartDAO.prototype.setAsPaid).not.toHaveBeenCalled();
    });

    test('It should reject with EmptyCartError if cart total is zero', async () => {
        const mockEmptyCart: Cart = { customer: 'testuser', paid: false, paymentDate: null!, total: 0, products: [] };
        const controller = new CartController();
        
        jest.spyOn(CartDAO.prototype, 'getCartId').mockResolvedValue(mockCartId);
        jest.spyOn(CartDAO.prototype, 'getCart').mockResolvedValue(mockEmptyCart);

        await expect(controller.checkoutCart(mockUser)).rejects.toThrow(EmptyCartError);
        expect(CartDAO.prototype.getCartId).toHaveBeenCalledWith('testuser', false);
        expect(CartDAO.prototype.getCart).toHaveBeenCalledWith('testuser');
        expect(CartDAO.prototype.getProductsInCart).not.toHaveBeenCalled();
        expect(CartDAO.prototype.checkQuantity).not.toHaveBeenCalled();
        expect(ProductDAO.prototype.updateProductQuantity).not.toHaveBeenCalled();
        expect(CartDAO.prototype.setAsPaid).not.toHaveBeenCalled();
    });

    test('It should reject with error if there is an issue during checkout', async () => {
        const mockError = new Error('DB test error');

        jest.spyOn(CartDAO.prototype, 'getCartId').mockResolvedValue(mockCartId);
        jest.spyOn(CartDAO.prototype, 'getCart').mockRejectedValue(mockError);

        await expect(controller.checkoutCart(mockUser)).rejects.toThrow('DB test error');
        expect(CartDAO.prototype.getCartId).toHaveBeenCalledWith('testuser', false);
        expect(CartDAO.prototype.getCart).toHaveBeenCalledWith('testuser');
        expect(CartDAO.prototype.getProductsInCart).not.toHaveBeenCalled();
        expect(CartDAO.prototype.checkQuantity).not.toHaveBeenCalled();
        expect(ProductDAO.prototype.updateProductQuantity).not.toHaveBeenCalled();
        expect(CartDAO.prototype.setAsPaid).not.toHaveBeenCalled();
    });
});

describe('getCustomerCarts', () => {
    const controller = new CartController();
    afterEach(() => {
        jest.clearAllMocks();
    });

    test('It should return paid carts with products for a user', async () => {
        const mockCartIds = [1, 2];
        const mockCarts: Cart[] = [
            { customer: 'testuser', paid: true, paymentDate: '2023-06-05', total: 100, products: [] },
            { customer: 'testuser', paid: true, paymentDate: '2023-06-06', total: 150, products: [] }
        ];
        const mockProducts1: ProductInCart[] = [{ model: 'product1', quantity: 2, category: Category.SMARTPHONE, price: 10.99 }];
        const mockProducts2: ProductInCart[] = [{ model: 'product2', quantity: 1, category: Category.LAPTOP, price: 20.99 }];
        
        jest.spyOn(CartDAO.prototype,'getCostumerCarts').mockResolvedValue(mockCarts);
        jest.spyOn(CartDAO.prototype,'getCartsIds').mockResolvedValue(mockCartIds);
        jest.spyOn(CartDAO.prototype,'getProductsInCart')
            .mockResolvedValueOnce(mockProducts1)
            .mockResolvedValueOnce(mockProducts2);

        const result = await controller.getCustomerCarts(mockUser);

        expect(result).toEqual([
            { ...mockCarts[0], products: mockProducts1 },
            { ...mockCarts[1], products: mockProducts2 }
        ]);
        expect(CartDAO.prototype.getCostumerCarts).toHaveBeenCalledWith('testuser');
        expect(CartDAO.prototype.getCartsIds).toHaveBeenCalledWith('testuser', true);
        expect(CartDAO.prototype.getProductsInCart).toHaveBeenCalledWith(mockCartIds[0]);
        expect(CartDAO.prototype.getProductsInCart).toHaveBeenCalledWith(mockCartIds[1]);
    });

    test('It should reject with an error if fetching customer carts fails', async () => {
        const mockError = new Error('DB test error');

        jest.spyOn(CartDAO.prototype,'getCostumerCarts').mockRejectedValue(mockError);

        await expect(controller.getCustomerCarts(mockUser)).rejects.toThrow('DB test error');
        expect(CartDAO.prototype.getCostumerCarts).toHaveBeenCalledWith('testuser');
        expect(CartDAO.prototype.getCartId).not.toHaveBeenCalled();
        expect(CartDAO.prototype.getCartsIds).not.toHaveBeenCalled();
        expect(CartDAO.prototype.getProductsInCart).not.toHaveBeenCalled();
    });
});

describe('removeProductFromCart', () => {
    afterEach(() => {
        jest.clearAllMocks();
    });

    test('It should resolve true when the product is successfully removed from the cart', async () => {
        const mockProduct = 'test-product';
        const mockPrice = 100;
        const mockCartId = 1;
        const mockQuantity = 2;
        const controller = new CartController();

        jest.spyOn(CartDAO.prototype,'productExists').mockResolvedValue(mockPrice);
        jest.spyOn(CartDAO.prototype,'getCartId').mockResolvedValue(mockCartId);
        jest.spyOn(CartDAO.prototype,'cartIsEmpty').mockResolvedValue(false);
        jest.spyOn(CartDAO.prototype,'alreadyInCart').mockResolvedValue(mockQuantity);

        const result = await controller.removeProductFromCart(mockUser, mockProduct);

        expect(result).toBe(true);
        expect(CartDAO.prototype.productExists).toHaveBeenCalledWith(mockProduct);
        expect(CartDAO.prototype.getCartId).toHaveBeenCalledWith(mockUser.username, false);
        expect(CartDAO.prototype.cartIsEmpty).toHaveBeenCalledWith(mockCartId);
        expect(CartDAO.prototype.alreadyInCart).toHaveBeenCalledWith(mockCartId, mockProduct);
        expect(CartDAO.prototype.removeProductFromCart).toHaveBeenCalledWith(mockCartId, mockProduct, mockQuantity);
        expect(CartDAO.prototype.updateTotal).toHaveBeenCalledWith(mockCartId, -mockPrice);
    });

    test('It should reject with ProductNotFoundError if the product does not exist', async () => {
        const mockProduct = 'test-product';
        const controller = new CartController();

        jest.spyOn(CartDAO.prototype,'productExists').mockRejectedValue(new ProductNotFoundError());

        await expect(controller.removeProductFromCart(mockUser, mockProduct)).rejects.toThrow(ProductNotFoundError);
        expect(CartDAO.prototype.productExists).toHaveBeenCalledWith(mockProduct);
        expect(CartDAO.prototype.getCartId).not.toHaveBeenCalled();
        expect(CartDAO.prototype.cartIsEmpty).not.toHaveBeenCalled();
        expect(CartDAO.prototype.alreadyInCart).not.toHaveBeenCalled();
        expect(CartDAO.prototype.removeProductFromCart).not.toHaveBeenCalled();
        expect(CartDAO.prototype.updateTotal).not.toHaveBeenCalled();
    });

    test('It should reject with CartNotFoundError if the cart does not exist', async () => {
        const mockProduct = 'test-product';
        const mockPrice = 100;
        const controller = new CartController();

        jest.spyOn(CartDAO.prototype,'productExists').mockResolvedValue(mockPrice);
        jest.spyOn(CartDAO.prototype,'getCartId').mockResolvedValue(null);

        await expect(controller.removeProductFromCart(mockUser, mockProduct)).rejects.toThrow(CartNotFoundError);
        expect(CartDAO.prototype.productExists).toHaveBeenCalledWith(mockProduct);
        expect(CartDAO.prototype.getCartId).toHaveBeenCalledWith(mockUser.username, false);
        expect(CartDAO.prototype.cartIsEmpty).not.toHaveBeenCalled();
        expect(CartDAO.prototype.alreadyInCart).not.toHaveBeenCalled();
        expect(CartDAO.prototype.removeProductFromCart).not.toHaveBeenCalled();
        expect(CartDAO.prototype.updateTotal).not.toHaveBeenCalled();
    });

    test('It should reject with EmptyCartError if the cart is empty', async () => {
        const mockProduct = 'test-product';
        const mockPrice = 100;
        const mockCartId = 1;
        const controller = new CartController();

        jest.spyOn(CartDAO.prototype,'productExists').mockResolvedValue(mockPrice);
        jest.spyOn(CartDAO.prototype,'getCartId').mockResolvedValue(mockCartId);
        jest.spyOn(CartDAO.prototype,'cartIsEmpty').mockResolvedValue(true);

        await expect(controller.removeProductFromCart(mockUser, mockProduct)).rejects.toThrow(CartNotFoundError);
        expect(CartDAO.prototype.productExists).toHaveBeenCalledWith(mockProduct);
        expect(CartDAO.prototype.getCartId).toHaveBeenCalledWith(mockUser.username, false);
        expect(CartDAO.prototype.cartIsEmpty).toHaveBeenCalledWith(mockCartId);
        expect(CartDAO.prototype.alreadyInCart).not.toHaveBeenCalled();
        expect(CartDAO.prototype.removeProductFromCart).not.toHaveBeenCalled();
        expect(CartDAO.prototype.updateTotal).not.toHaveBeenCalled();
    });

    test('It should reject with ProductNotInCartError if the product is not in the cart', async () => {
        const mockProduct = 'test-product';
        const mockPrice = 100;
        const mockCartId = 1;
        const controller = new CartController();

        jest.spyOn(CartDAO.prototype,'productExists').mockResolvedValue(mockPrice);
        jest.spyOn(CartDAO.prototype,'getCartId').mockResolvedValue(mockCartId);
        jest.spyOn(CartDAO.prototype,'cartIsEmpty').mockResolvedValue(false);
        jest.spyOn(CartDAO.prototype,'alreadyInCart').mockResolvedValue(null);

        await expect(controller.removeProductFromCart(mockUser, mockProduct)).rejects.toThrow(ProductNotInCartError);
        expect(CartDAO.prototype.productExists).toHaveBeenCalledWith(mockProduct);
        expect(CartDAO.prototype.getCartId).toHaveBeenCalledWith(mockUser.username, false);
        expect(CartDAO.prototype.cartIsEmpty).toHaveBeenCalledWith(mockCartId);
        expect(CartDAO.prototype.alreadyInCart).toHaveBeenCalledWith(mockCartId, mockProduct);
        expect(CartDAO.prototype.removeProductFromCart).not.toHaveBeenCalled();
        expect(CartDAO.prototype.updateTotal).not.toHaveBeenCalled();
    });
});

describe('clearCart', () => {
    const mockCartId = 1;
    const mockError = new Error('DB test error');
    const controller = new CartController();

    afterEach(() => {
        jest.clearAllMocks();
    });

    test('It should resolve to true if clearing the cart is successful', async () => {
        jest.spyOn(CartDAO.prototype, 'getCartId').mockResolvedValue(mockCartId);
        jest.spyOn(CartDAO.prototype, 'delProdsFromCart').mockResolvedValue();
        jest.spyOn(CartDAO.prototype, 'clearCart').mockResolvedValue(true);

        await expect(controller.clearCart(mockUser)).resolves.toBe(true);
        expect(CartDAO.prototype.getCartId).toHaveBeenCalledWith('testuser', false);
        expect(CartDAO.prototype.delProdsFromCart).toHaveBeenCalledWith(mockCartId);
        expect(CartDAO.prototype.clearCart).toHaveBeenCalledWith(mockCartId);
    });

    test('It should reject with an error if fetching the cart id fails', async () => {
        jest.spyOn(CartDAO.prototype, 'getCartId').mockRejectedValue(mockError);

        await expect(controller.clearCart(mockUser)).rejects.toThrow('DB test error');
        expect(CartDAO.prototype.getCartId).toHaveBeenCalledWith('testuser', false);
        expect(CartDAO.prototype.delProdsFromCart).not.toHaveBeenCalled();
        expect(CartDAO.prototype.clearCart).not.toHaveBeenCalled();
    });

    test('It should reject with an error if deleting products from cart fails', async () => {
        jest.spyOn(CartDAO.prototype, 'getCartId').mockResolvedValue(mockCartId);
        jest.spyOn(CartDAO.prototype, 'delProdsFromCart').mockRejectedValue(mockError);

        await expect(controller.clearCart(mockUser)).rejects.toThrow('DB test error');
        expect(CartDAO.prototype.getCartId).toHaveBeenCalledWith('testuser', false);
        expect(CartDAO.prototype.delProdsFromCart).toHaveBeenCalledWith(mockCartId);
        expect(CartDAO.prototype.clearCart).not.toHaveBeenCalled();
    });

    test('It should reject with an error if clearing the cart fails', async () => {
        jest.spyOn(CartDAO.prototype, 'getCartId').mockResolvedValue(mockCartId);
        jest.spyOn(CartDAO.prototype, 'delProdsFromCart').mockResolvedValue();
        jest.spyOn(CartDAO.prototype, 'clearCart').mockRejectedValue(mockError);

        await expect(controller.clearCart(mockUser)).rejects.toThrow('DB test error');
        expect(CartDAO.prototype.getCartId).toHaveBeenCalledWith('testuser', false);
        expect(CartDAO.prototype.delProdsFromCart).toHaveBeenCalledWith(mockCartId);
        expect(CartDAO.prototype.clearCart).toHaveBeenCalledWith(mockCartId);
    });
});

describe('deleteAllCarts', () => {
    const mockError = new Error('DB test error');
    const controller = new CartController();

    afterEach(() => {
        jest.clearAllMocks();
    });

    test('It should resolve to true if deleting all carts is successful', async () => {
        jest.spyOn(CartDAO.prototype, 'deleteAllCarts').mockResolvedValue(true);

        await expect(controller.deleteAllCarts()).resolves.toBe(true);
        expect(CartDAO.prototype.deleteAllCarts).toHaveBeenCalled();
    });

    test('It should resolve to false if no carts were deleted', async () => {
        jest.spyOn(CartDAO.prototype, 'deleteAllCarts').mockResolvedValue(false);

        await expect(controller.deleteAllCarts()).resolves.toBe(false);
        expect(CartDAO.prototype.deleteAllCarts).toHaveBeenCalled();
    });

    test('It should reject with an error if deleting all carts fails', async () => {
        jest.spyOn(CartDAO.prototype, 'deleteAllCarts').mockRejectedValue(mockError);

        await expect(controller.deleteAllCarts()).rejects.toThrow('DB test error');
        expect(CartDAO.prototype.deleteAllCarts).toHaveBeenCalled();
    });
});

describe('getAllCarts', () => {
    const mockCarts: Cart[] = [
        { customer: 'customer1', paid: true, paymentDate: '2023-01-01', total: 100, products: [] },
        { customer: 'customer2', paid: false, paymentDate: null!, total: 0, products: [] },
        { customer: 'customer3', paid: true, paymentDate: '2023-01-02', total: 200, products: [] }
    ];

    const mockCartIds: number[] = [1, 2, 3];
    const mockProductsInCart: ProductInCart[] = [
        { model: 'product1', quantity: 2, category: Category.SMARTPHONE, price: 50 },
        { model: 'product2', quantity: 1, category: Category.LAPTOP, price: 100 }
    ];

    const controller = new CartController();

    beforeEach(() => {
        jest.spyOn(CartDAO.prototype, 'getAllCarts').mockResolvedValue(mockCarts);
        jest.spyOn(CartDAO.prototype, 'getAllCartsIds').mockResolvedValue(mockCartIds);
        jest.spyOn(CartDAO.prototype, 'getProductsInCart').mockResolvedValue(mockProductsInCart);
    });

    afterEach(() => {
        jest.clearAllMocks();
    });

    test('It should resolve with a list of carts with products', async () => {
        const result = await controller.getAllCarts();

        expect(result).toEqual([
            { ...mockCarts[0], products: mockProductsInCart },
            mockCarts[1], // No products because total is 0
            { ...mockCarts[2], products: mockProductsInCart }
        ]);

        expect(CartDAO.prototype.getAllCarts).toHaveBeenCalled();
        expect(CartDAO.prototype.getAllCartsIds).toHaveBeenCalled();

        expect(CartDAO.prototype.getProductsInCart).toHaveBeenCalledWith(mockCartIds[0]);
        expect(CartDAO.prototype.getProductsInCart).not.toHaveBeenCalledWith(mockCartIds[1]); // No products for cart with total 0
        expect(CartDAO.prototype.getProductsInCart).toHaveBeenCalledWith(mockCartIds[2]);
    });

    test('It should reject with an error if fetching carts fails', async () => {
        const mockError = new Error('DB test error');
        jest.spyOn(CartDAO.prototype, 'getAllCarts').mockRejectedValue(mockError);

        await expect(controller.getAllCarts()).rejects.toThrow('DB test error');

        expect(CartDAO.prototype.getAllCarts).toHaveBeenCalled();
        expect(CartDAO.prototype.getAllCartsIds).not.toHaveBeenCalled();
        expect(CartDAO.prototype.getProductsInCart).not.toHaveBeenCalled();
    });

    test('It should reject with an error if fetching cart IDs fails', async () => {
        const mockError = new Error('DB test error');
        jest.spyOn(CartDAO.prototype, 'getAllCartsIds').mockRejectedValue(mockError);

        await expect(controller.getAllCarts()).rejects.toThrow('DB test error');

        expect(CartDAO.prototype.getAllCarts).toHaveBeenCalled();
        expect(CartDAO.prototype.getAllCartsIds).toHaveBeenCalled();
        expect(CartDAO.prototype.getProductsInCart).not.toHaveBeenCalled();
    });

    test('It should reject with an error if fetching products in cart fails', async () => {
        const mockError = new Error('DB test error');
        jest.spyOn(CartDAO.prototype, 'getProductsInCart').mockRejectedValue(mockError);

        await expect(controller.getAllCarts()).rejects.toThrow('DB test error');

        expect(CartDAO.prototype.getAllCarts).toHaveBeenCalled();
        expect(CartDAO.prototype.getAllCartsIds).toHaveBeenCalled();
        expect(CartDAO.prototype.getProductsInCart).toHaveBeenCalledWith(mockCartIds[0]);
    });
});