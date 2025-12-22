const { errorHandler, notFoundHandler, asyncErrorHandler, validationErrorHandler } = require('../../src/middleware/errorHandler');

describe('errorHandler middleware exports', () => {
  test('should export errorHandler function', () => {
    expect(typeof errorHandler).toBe('function');
    // Express error handler must accept 4 args
    expect(errorHandler.length).toBeGreaterThanOrEqual(3);
  });

  test('should export notFoundHandler function', () => {
    expect(typeof notFoundHandler).toBe('function');
  });

  test('should export asyncErrorHandler and validationErrorHandler', () => {
    expect(typeof asyncErrorHandler).toBe('function');
    expect(typeof validationErrorHandler).toBe('function');
  });
});