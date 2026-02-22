/**
 * src/middlewares/errorHandler.js
 * 
 * Global error handler for Fastify.
 * Catches all errors and formats them using ApiResponse.
 */

import { ApiResponse } from '../lib/response.js';
import { AppError } from '../lib/errors.js';
import { ZodError } from 'zod';

/**
 * Global error handler — catches all unhandled errors and returns
 * a standardized JSON response based on error type.
 * @param {Error} error - Thrown error
 * @param {import('fastify').FastifyRequest} request 
 * @param {import('fastify').FastifyReply} reply 
 */
export const globalErrorHandler = (error, request, reply) => {
  // 1. Handle Trusted App Errors
  if (error instanceof AppError) {
    return ApiResponse.error(
      reply, 
      error.message, 
      error.statusCode, 
      error.details
    );
  }

  // 2. Handle Zod Validation Errors (if they bubble up)
  if (error instanceof ZodError) {
    const issues = Array.isArray(error.errors) ? error.errors : [];
    const details = issues.map(err => {
      let message = err.message;
      if (message.includes('match format uri')) message = 'Format URL tidak valid';
      
      return {
        field: err.path.join('.'),
        message: message
      };
    });
    return ApiResponse.badRequest(reply, 'Validasi gagal', details);
  }

  // 3. Handle Fastify/JsonSchema Validation Errors
  if (error.validation) {
    const details = error.validation.map(err => {
      let message = err.message;
      if (err.params?.format === 'uri') message = 'Format URL tidak valid';
      if (message === 'is required') message = 'Wajib diisi';
      
      return {
        field: err.instancePath.replace(/^\//, '').replace(/\//g, '.') || err.params?.missingProperty,
        message: message
      };
    });
    return ApiResponse.badRequest(reply, 'Validasi gagal', details);
  }

  // 4. Handle Database Errors (Objection/Knex/MySQL)
  if (error.code === 'ER_DUP_ENTRY') {
    return ApiResponse.error(reply, 'Duplicate entry found', 409);
  }

  // 5. Handle Unknown Errors (500)
  const message = process.env.NODE_ENV === 'production' 
    ? 'Internal Server Error' 
    : error.message;

  return ApiResponse.error(reply, message, 500);
};
