/**
 * src/schemas/evaluation.schema.js
 * 
 * Validation schemas for film evaluations.
 */

export const upsertEvaluationSchema = {
  params: {
    type: 'object',
    required: ['id'],
    properties: {
      id: { type: 'string' }
    }
  },
  body: {
    type: 'object',
    required: [
      'script_score',
      'cinematography_score',
      'editing_score',
      'production_score'
    ],
    properties: {
      script_score: { type: 'integer', minimum: 0, maximum: 10 },
      script_comment: { type: 'string', maxLength: 1000 },
      
      cinematography_score: { type: 'integer', minimum: 0, maximum: 10 },
      cinematography_comment: { type: 'string', maxLength: 1000 },
      
      editing_score: { type: 'integer', minimum: 0, maximum: 10 },
      editing_comment: { type: 'string', maxLength: 1000 },
      
      production_score: { type: 'integer', minimum: 0, maximum: 10 },
      production_comment: { type: 'string', maxLength: 1000 },
      
      overall_feedback: { type: 'string', maxLength: 2000 }
    },
    additionalProperties: false
  }
};

export const getEvaluationSchema = {
  params: {
    type: 'object',
    required: ['id'],
    properties: {
      id: { type: 'string' }
    }
  }
};
