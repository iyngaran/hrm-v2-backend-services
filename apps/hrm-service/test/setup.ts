import 'source-map-support/register'; // Enable for tests
// This must be the first import to ensure source-map-support is registered before any other code runs

// HRM Service specific test setup
jest.setTimeout(30000); // 30 seconds

// HRM Service specific configurations
process.env.NODE_ENV = 'test';
process.env.GRPC_PORT = '0'; // Use random available port for gRPC testing

// Mock external dependencies for HRM Service tests
beforeAll(async () => {
  // Setup test database connections, mock external gRPC services, etc.
});

afterAll(async () => {
  // Cleanup resources
});
