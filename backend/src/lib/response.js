/**
 * src/lib/response.js
 * 
 * Standardized API response format helper for consistent
 * success and error messages across the application.
 */
export class ApiResponse {
  /**
   * Send a success response
   * @param {import('fastify').FastifyReply} reply 
   * @param {any} data 
   * @param {string} message 
   * @param {number} code 
   * @param {object} pagination Optional pagination metadata
   */
  static success(reply, data = null, message = 'Success', code = 200, pagination = null) {
    const response = {
      success: true,
      message,
      data
    };

    if (pagination) {
      response.pagination = pagination;
    }

    return reply.status(code).send(response);
  }

  /**
   * Send an error response
   * @param {import('fastify').FastifyReply} reply 
   * @param {string} message 
   * @param {number} code 
   * @param {any} details 
   */
  static error(reply, message = 'Internal Server Error', code = 500, details = null) {
    const response = {
      success: false,
      message
    };

    if (details) {
      response.details = details;
    }

    return reply.status(code).send(response);
  }

  /**
   * Send a 404 response
   */
  static notFound(reply, message = 'Resource not found') {
    return this.error(reply, message, 404);
  }

  /**
   * Send a 400 response
   */
  static badRequest(reply, message = 'Bad request', details = null) {
    return this.error(reply, message, 400, details);
  }

  /**
   * Send a 401 response
   */
  static unauthorized(reply, message = 'Unauthorized') {
    return this.error(reply, message, 401);
  }
}
