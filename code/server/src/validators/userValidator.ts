const moment = require("moment");
import { check, param, query } from "express-validator"

const checkBirthDateValidator = [
    check('birthdate')
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
];

export { checkBirthDateValidator }