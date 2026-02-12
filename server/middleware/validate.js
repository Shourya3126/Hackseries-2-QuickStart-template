/**
 * Joi validation middleware factory.
 * Usage: validate(joiSchema)  →  middleware
 */
function validate(schema) {
    return (req, res, next) => {
        const { error, value } = schema.validate(req.body, {
            abortEarly: false,
            stripUnknown: true,
        });

        if (error) {
            const messages = error.details.map((d) => d.message);
            return res.status(400).json({ error: "Validation failed", details: messages });
        }

        req.body = value; // use sanitized value
        next();
    };
}

module.exports = validate;
