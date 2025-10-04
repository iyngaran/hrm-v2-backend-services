import 'source-map-support/register'; // Enable for tests
// This must be the first import to ensure source-map-support is registered before any other code runs

// Set global timeout for all tests
jest.setTimeout(30000); // 30 seconds

// Global teardown to handle gRPC cleanup
afterAll(async () => {
  // Force cleanup of any remaining gRPC connections
  await new Promise((resolve) => setTimeout(resolve, 200));
});
