import { check, param, query } from "express-validator"
import { Category } from "../../src/components/product"
const moment = require("moment");

const registerProductValidator = [
    check('model').notEmpty()
        .withMessage('Model cannot be empty'), //validation middleware
    check('category')
        .notEmpty().withMessage('Category cannot be empty')
        .isIn(Object.values(Category)).withMessage(`Category must be one of ${Object.values(Category).join(', ')}`),
    check('quantity').notEmpty().withMessage('Quantity cannot be empty')
        .isInt({ min: 1 }).withMessage('Quantity cannot be less than 1'),
    check('sellingPrice').notEmpty().withMessage('Selling price cannot be empty')
        .isInt({ min: 1 }).withMessage('Selling price must be greater than 0'),
    check('arrivalDate')
        .optional()
        .custom((value) => {
            if (!moment(value, 'YYYY-MM-DD', true).isValid()) {
                throw new Error('Arrival date must be in YYYY-MM-DD format');
            }
            if (moment(value).isAfter(moment(), 'day')) {
                throw new Error('Arrival date cannot be greater than today');
            }
            return true;
        })
];

const changeProductQuantityValidator = [
    check('quantity').notEmpty().withMessage('Quantity cannot be empty')
        .isInt({ min: 1 }).withMessage('Quantity should be greater than 0'),
    check('changeDate')
        .optional()
        .custom((value) => {
            if (!moment(value, 'YYYY-MM-DD', true).isValid()) {
                throw new Error('Provided date is not valid or does not respect required format');
            }
            if (moment(value).isAfter(moment(), 'day')) {
                throw new Error('Change date cannot be greater than today');
            }
            return true;
        }),
    param('model').notEmpty().withMessage('Model param cannot be empty')

];

const validateGrouping = (value: any, { req }: any) => {
    const model = req.query.model;
    const category = req.query.category;

    if (value===null) {
        // If grouping is null, model and category should also be null
        if (model || category) {
            throw new Error('If grouping is null, model and category must also be null');
        }
        return true; // Validation passed
    } else if (value === 'model') {
        // If grouping contains 'model', category should be null and model should contain a string
        if (category || !model) {
            throw new Error('If grouping is set to model, category should be null and model should contain a string');
        }
        return true; // Validation passed
    } else if (value === 'category') {
        // If grouping contains 'category', model should be null and category should contain a string
        if (model || !category || (category !== Category.APPLIANCE && category !== Category.SMARTPHONE && category !== Category.LAPTOP)) {
            throw new Error('If grouping is set to category, model should be null and category should contain a string');
        }
        return true; // Validation passed
    } else {
        // Any other value for grouping should fail validation
        throw new Error('Invalid value for grouping');
    }
};

const retrieveProductsValidator = [
    // Optional parameter validation for grouping
    query('grouping').optional().custom(validateGrouping),
    // Validation for model
    query('model').optional().isString().withMessage('Model must be a string'),
    // Validation for category
    query('category').optional().isString().withMessage('Category must be a string')
];

const sellProductValidator = [
    check('sellingDate')
        .optional()
        .custom((value) => {
            if (!moment(value, 'YYYY-MM-DD', true).isValid()) {
                throw new Error('Selling date must be in YYYY-MM-DD format');
            }
            if (moment(value).isAfter(moment(), 'day')) {
                throw new Error('Selling date cannot be greater than today');
            }
            return true;
        }),
    check('quantity').notEmpty().withMessage('Quantity cannot be empty')
        .isInt({ min: 1 }).withMessage('Quantity cannot be less than 1'),
    param('model')
        .notEmpty().withMessage('Model should be provided')
        .isString().withMessage('Model must be a string'),


];

const validateModel = [
    param('model')
        .notEmpty().withMessage('Model should be provided')
        .isString().withMessage('Model must be a string')
];


export { registerProductValidator, changeProductQuantityValidator, retrieveProductsValidator, sellProductValidator, validateModel}
