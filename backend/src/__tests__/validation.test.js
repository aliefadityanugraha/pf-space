import { describe, it, expect, vi } from 'vitest';
import { validateRequest } from '../middlewares/validation.middleware.js';
import { z } from 'zod';
import { ValidationError } from '../lib/errors.js';

describe('Validation Middleware', () => {
  const schema = z.object({
    name: z.string().min(3),
    age: z.number().positive()
  });

  it('should pass and update request data if validation succeeds', async () => {
    const middleware = validateRequest(schema, 'body');
    const request = {
      body: { name: 'Alief', age: 25, extra: 'field' }
    };
    const reply = {};

    await middleware(request, reply);

    // Zod should strip 'extra' if not in schema (by default if using standard object)
    // Wait, by default Zod objects allow extra fields unless .strict() is used.
    // Our middleware replaces request[source] with result.data
    expect(request.body).toEqual({ name: 'Alief', age: 25 });
    expect(request.body.extra).toBeUndefined();
  });

  it('should throw ValidationError if validation fails', async () => {
    const middleware = validateRequest(schema, 'body');
    const request = {
      body: { name: 'Al', age: -5 }
    };
    const reply = {};

    await expect(middleware(request, reply)).rejects.toThrow(ValidationError);
  });

  it('should validate other sources like params', async () => {
    const paramSchema = z.object({
      id: z.string().regex(/^\d+$/).transform(Number)
    });
    const middleware = validateRequest(paramSchema, 'params');
    const request = {
      params: { id: '123' }
    };
    
    await middleware(request, {});
    
    expect(request.params.id).toBe(123); // Transformed to number
  });
});
