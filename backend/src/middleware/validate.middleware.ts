import { Request, Response, NextFunction } from 'express';
import Joi from 'joi';

/**
 * Reusable request validation middleware (SRS 4.11 — Input validation).
 *
 * Validates the chosen part of the request against a Joi schema. On failure it
 * returns the SRS 8.6 error envelope with a machine-readable `errors` array,
 * without leaking internal implementation details.
 */

type RequestPart = 'body' | 'params' | 'query';

export const validate = (schema: Joi.ObjectSchema, part: RequestPart = 'body') => {
  return (req: Request, res: Response, next: NextFunction): void => {
    const { error, value } = schema.validate(req[part], {
      abortEarly: false, // report every problem at once
      stripUnknown: true, // drop fields the schema does not declare
      convert: true,
    });

    if (error) {
      res.status(400).json({
        success: false,
        message: error.details[0].message,
        errors: error.details.map((detail) => ({
          field: detail.path.join('.'),
          message: detail.message,
        })),
      });
      return;
    }

    // Replace with the sanitized value so controllers only ever see known fields
    req[part] = value;
    next();
  };
};
