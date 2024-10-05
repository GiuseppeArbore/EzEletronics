const PRODUCT_NOT_FOUND = "Product not found"
const PRODUCT_ALREADY_EXISTS = "The product already exists"
const PRODUCT_SOLD = "Product already sold"
const EMPTY_PRODUCT_STOCK = "Product stock is empty"
const EMPTY_PRODUCT_STOCK_FOR_CATEGORY = "Product stock is empty for the selected category"
const LOW_PRODUCT_STOCK = "Product stock cannot satisfy the requested quantity"
const PAST_CHANGE_DATE = "Proposed date is before the product's arrival date"

/**
 * Represents an error that occurs when a product is not found.
 */
class ProductNotFoundError extends Error {
    customMessage: string
    customCode: number

    constructor() {
        super()
        this.customMessage = PRODUCT_NOT_FOUND
        this.customCode = 404
    }
}

/**
 * Represents an error that occurs when a product id already exists.
 */
class ProductAlreadyExistsError extends Error {
    customMessage: string
    customCode: number

    constructor() {
        super()
        this.customMessage = PRODUCT_ALREADY_EXISTS
        this.customCode = 409
    }
}

/**
 * Represents an error that occurs when a product is already sold.
 */
class ProductSoldError extends Error {
    customMessage: string
    customCode: number

    constructor() {
        super()
        this.customMessage = PRODUCT_SOLD
        this.customCode = 409
    }
}

/**
 * Represents an error that occours when changing the arrivalDate to a 
 * prior changeDate (changeDate < saved arrivalDate)
 */

class ProposedDateTooEarlyError extends Error {
    customMessage: string
    customCode: number

    constructor() {
        super()
        this.customMessage = PAST_CHANGE_DATE
        this.customCode = 400
    }
}

class EmptyProductStockError extends Error {
    customMessage: string
    customCode: number

    constructor() {
        super()
        this.customMessage = EMPTY_PRODUCT_STOCK
        this.customCode = 409
    }
}

class EmptyProductStockForCategoryError extends Error {
    customMessage: string
    customCode: number

    constructor() {
        super()
        this.customMessage = EMPTY_PRODUCT_STOCK_FOR_CATEGORY
        this.customCode = 409
    }
}

class LowProductStockError extends Error {
    customMessage: string
    customCode: number

    constructor() {
        super()
        this.customMessage = LOW_PRODUCT_STOCK
        this.customCode = 409
    }
}

export { ProductNotFoundError, ProductAlreadyExistsError, ProposedDateTooEarlyError, ProductSoldError, EmptyProductStockError, EmptyProductStockForCategoryError, LowProductStockError }