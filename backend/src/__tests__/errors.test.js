import { describe, it, expect } from 'vitest';
import {
  AppError,
  NotFoundError,
  ValidationError,
  AuthenticationError,
  AuthorizationError,
  ConflictError
} from '../lib/errors.js';

describe('Error Classes', () => {
  it('AppError should set properties correctly', () => {
    const details = { field: 'test' };
    const error = new AppError('Custom error', 501, 'CUSTOM_CODE', details);

    expect(error).toBeInstanceOf(Error);
    expect(error.name).toBe('AppError');
    expect(error.message).toBe('Custom error');
    expect(error.statusCode).toBe(501);
    expect(error.code).toBe('CUSTOM_CODE');
    expect(error.details).toEqual(details);
    expect(error.stack).toBeDefined();
  });

  it('NotFoundError should map to 404', () => {
    const error = new NotFoundError('Item not found');

    expect(error).toBeInstanceOf(AppError);
    expect(error.name).toBe('NotFoundError');
    expect(error.message).toBe('Item not found');
    expect(error.statusCode).toBe(404);
    expect(error.code).toBe('NOT_FOUND');
  });

  it('ValidationError should map to 400 with details', () => {
    const details = { field: 'username', issue: 'taken' };
    const error = new ValidationError('Invalid input', details);

    expect(error).toBeInstanceOf(AppError);
    expect(error.name).toBe('ValidationError');
    expect(error.message).toBe('Invalid input');
    expect(error.statusCode).toBe(400);
    expect(error.code).toBe('VALIDATION_ERROR');
    expect(error.details).toEqual(details);
  });

  it('AuthenticationError should map to 401', () => {
    const error = new AuthenticationError('Please login');

    expect(error).toBeInstanceOf(AppError);
    expect(error.name).toBe('AuthenticationError');
    expect(error.message).toBe('Please login');
    expect(error.statusCode).toBe(401);
    expect(error.code).toBe('UNAUTHORIZED');
  });

  it('AuthorizationError should map to 403', () => {
    const error = new AuthorizationError('Access denied');

    expect(error).toBeInstanceOf(AppError);
    expect(error.name).toBe('AuthorizationError');
    expect(error.message).toBe('Access denied');
    expect(error.statusCode).toBe(403);
    expect(error.code).toBe('FORBIDDEN');
  });

  it('ConflictError should map to 409', () => {
    const error = new ConflictError('Already exists');

    expect(error).toBeInstanceOf(AppError);
    expect(error.name).toBe('ConflictError');
    expect(error.message).toBe('Already exists');
    expect(error.statusCode).toBe(409);
    expect(error.code).toBe('CONFLICT');
  });
});
