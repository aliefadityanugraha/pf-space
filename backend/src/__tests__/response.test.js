import { describe, it, expect, vi } from 'vitest';
import { ApiResponse } from '../lib/response.js';

describe('ApiResponse', () => {
  it('should format a success response correctly', () => {
    const mockReply = {
      status: vi.fn().mockReturnThis(),
      send: vi.fn().mockReturnThis()
    };

    const data = { id: 1, name: 'Test' };
    const pagination = { page: 1, limit: 10, total: 100 };

    ApiResponse.success(mockReply, data, 'Success message', 200, pagination);

    expect(mockReply.status).toHaveBeenCalledWith(200);
    expect(mockReply.send).toHaveBeenCalledWith({
      success: true,
      message: 'Success message',
      data: data,
      pagination: pagination
    });
  });

  it('should format an error response correctly', () => {
    const mockReply = {
      status: vi.fn().mockReturnThis(),
      send: vi.fn().mockReturnThis()
    };

    const details = { field: 'name', error: 'Required' };

    ApiResponse.error(mockReply, 'Error message', 500, details);

    expect(mockReply.status).toHaveBeenCalledWith(500);
    expect(mockReply.send).toHaveBeenCalledWith({
      success: false,
      message: 'Error message',
      details: details
    });
  });

  it('should return a 404 response', () => {
    const mockReply = {
      status: vi.fn().mockReturnThis(),
      send: vi.fn().mockReturnThis()
    };

    ApiResponse.notFound(mockReply, 'Not found');

    expect(mockReply.status).toHaveBeenCalledWith(404);
    expect(mockReply.send).toHaveBeenCalledWith({
      success: false,
      message: 'Not found'
    });
  });

  it('should return a 400 response', () => {
    const mockReply = {
      status: vi.fn().mockReturnThis(),
      send: vi.fn().mockReturnThis()
    };

    const details = { issue: 'invalid input' };
    ApiResponse.badRequest(mockReply, 'Bad request', details);

    expect(mockReply.status).toHaveBeenCalledWith(400);
    expect(mockReply.send).toHaveBeenCalledWith({
      success: false,
      message: 'Bad request',
      details: details
    });
  });

  it('should return a 401 response', () => {
    const mockReply = {
      status: vi.fn().mockReturnThis(),
      send: vi.fn().mockReturnThis()
    };

    ApiResponse.unauthorized(mockReply, 'Unauthorized');

    expect(mockReply.status).toHaveBeenCalledWith(401);
    expect(mockReply.send).toHaveBeenCalledWith({
      success: false,
      message: 'Unauthorized'
    });
  });
});
