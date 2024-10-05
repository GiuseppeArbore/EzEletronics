import { body, check, param } from "express-validator"

const addReviewValidator = [
    check('score').notEmpty()
        .withMessage('Score cannot be empty')
        .isInt({min:1, max:5}).withMessage('Score must me an integer between 1 and 5 '),
    check('comment').notEmpty()
        .withMessage('Model cannot be empty')
]

const validateModelParam = (req: any, res: any, next: any) => {
    const model = req.params.model;
    if(typeof model === 'string' && model.trim() !== '')
        next();
    else
        res.status(422).json({error: "Model cannot be empty"})
}
export { addReviewValidator, validateModelParam }
