const Joi = require('joi');

const createProductSchema = Joi.object({
    name: Joi.string().trim().min(1).max(256).required(),
    mrp: Joi.number().precision(2).min(0).required(),
    price: Joi.number().precision(2).min(0).required(),
    discount: Joi.number().precision(2).min(0).optional(), // Auto-calculated from MRP - price
    unit: Joi.string().valid('box', 'dozen', 'both').required(),
    description: Joi.string().allow('', null).max(2000).default(''),
    images: Joi.array().items(
        Joi.object({
            url: Joi.string().uri().required(),
            order_index: Joi.number().integer().min(0).default(0)
        })
    ).default([]),
    category_id: Joi.string().allow(null).default(null)
});

const updateProductSchema = Joi.object({
    name: Joi.string().trim().min(1).max(256),
    mrp: Joi.number().precision(2).min(0),
    price: Joi.number().precision(2).min(0),
    discount: Joi.number().precision(2).min(0).optional(), // Auto-calculated from MRP - price
    unit: Joi.string().valid('box', 'dozen', 'both'),
    description: Joi.string().allow('', null).max(2000),
    images: Joi.array().items(
        Joi.object({
            url: Joi.string().uri().required(),
            order_index: Joi.number().integer().min(0).default(0)
        })
    ),
    is_active: Joi.boolean(),
    category_id: Joi.string().allow(null)
}).min(1);

function validate(schema) {
    return (req, res, next) => {
        const { error, value } = schema.validate(req.body, {
            stripUnknown: true,
            abortEarly: false
        });

        if (error) {
            return res.status(400).json({
                success: false,
                message: 'Validation error',
                errors: error.details.map(d => d.message)
            });
        }

        req.validatedBody = value;
        next();
    };
}

module.exports = {
    createProductSchema,
    updateProductSchema,
    validate
};
