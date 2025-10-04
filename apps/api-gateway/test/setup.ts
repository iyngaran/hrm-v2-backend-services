import 'source-map-support/register'; // Enable for tests
// This must be the first import to ensure source-map-support is registered before any other code runs

// API Gateway specific test setup
jest.setTimeout(30000); // 30 seconds

// API Gateway specific configurations
process.env.NODE_ENV = 'test';
process.env.PORT = '0'; // Use random available port for testing

// Mock external services for API Gateway tests
beforeAll(async () => {
  // Setup test database connections, mock gRPC clients, etc.
});

afterAll(async () => {
  // Cleanup resources
});
