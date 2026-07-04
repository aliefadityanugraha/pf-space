import { ValidationError } from '../lib/errors.js';

/**
 * Middleware generator for Zod schema validation
 * @param {import('zod').ZodSchema} schema
 * @param {'body'|'query'|'params'} source
 */
export const validateRequest = (schema, source = 'body') => async (request, reply) => {
  const data = request[source];
  const result = schema.safeParse(data);

  if (!result.success) {
    const rawErrors = Array.isArray(result.error?.errors) ? result.error.errors : [];
    const errors = rawErrors.map(err => ({
      field: err.path.join('.'),
      message: err.message
    }));
    throw new ValidationError('Validation failed', errors);
  }

  // Replace request data with validated (and potentially transformed) data
  request[source] = result.data;
};
