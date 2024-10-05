import { check, param, query } from "express-validator"

//addProduct e removeProductFromCart: gli passi solo model (request body) (post)
const modelValidator = [
    check('model').notEmpty().withMessage('Model cannot be empty')
    .isString().withMessage('Model must be a string')
];

const modelParamValidator = [
    param('model').notEmpty().withMessage('Model cannot be empty')
    .isString().withMessage('Model must be a string')
];
export {modelValidator, modelParamValidator};