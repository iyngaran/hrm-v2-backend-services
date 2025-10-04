import 'source-map-support/register'; // Enable for tests
// This must be the first import to ensure source-map-support is registered before any other code runs

// HRM Service specific test setup
jest.setTimeout(30000); // 30 seconds

// HRM Service specific configurations
process.env.NODE_ENV = 'test';
process.env.GRPC_PORT = '0'; // Use random available port for gRPC testing

// Global cleanup to ensure Jest exits properly
afterAll(async () => {
  // Force cleanup of any remaining connections
  await new Promise((resolve) => setTimeout(resolve, 100));
});
