# Protocol Buffers Dependencies Guide

## Overview

This guide covers the essential dependencies required when working with Protocol Buffers (protobuf) in a TypeScript/NestJS environment, particularly focusing on generated TypeScript files from `.proto` definitions.

## Common Dependency Issues

### 1. Missing `long` Module

**Error:**

```typescript
error TS2307: Cannot find module 'long' or its corresponding type declarations.
8 import Long from "long";
```

**Cause:**

- Generated protobuf TypeScript files require the `long` package for handling 64-bit integers
- Google's protobuf timestamp and duration types use `Long` for precise time calculations
- The `protoc-gen-ts_proto` generator automatically imports `Long` in generated files

**Solution:**

```bash
pnpm add long
```

**Note:** Do NOT install `@types/long` as it's deprecated. The `long` package provides its own TypeScript definitions.

## Required Dependencies for Protocol Buffers

### Core Dependencies

```json
{
  "dependencies": {
    "@grpc/grpc-js": "^1.13.4",
    "@grpc/proto-loader": "^0.7.15",
    "long": "^5.3.2"
  }
}
```

### NestJS gRPC Integration

```json
{
  "dependencies": {
    "@nestjs/microservices": "^11.1.3",
    "rxjs": "^7.8.1"
  }
}
```

## Generated File Structure

When using `protoc-gen-ts_proto`, your generated files will typically import:

```typescript
import Long from 'long'; // For 64-bit integers
import _m0 from 'protobufjs/minimal'; // For protobuf runtime
```

## Proto Compilation Best Practices

### 1. Include Directories

Always specify include directories for proper import resolution:

```typescript
loader: {
  includeDirs: [
    join(__dirname, '../../../../proto'),
    join(__dirname, '../../../../proto/common'),
  ],
}
```

### 2. Package Naming

Use consistent package naming across proto files:

```protobuf
syntax = "proto3";

package user.v1;
option go_package = "github.com/your-org/proto/user/v1";
```

### 3. Common Types

Place shared types in a common directory:

```
proto/
├── common/
│   ├── types.proto
│   └── header.proto
├── user-service/
│   └── users/
│       └── user.proto
└── hrm/
    └── organization/
        └── organization.proto
```

## Troubleshooting

### Issue: Import Resolution Errors

**Solution:** Ensure proto files are in the correct directory structure and include directories are properly configured.

### Issue: Type Compilation Errors

**Solution:**

1. Install missing dependencies (`long`, `protobufjs`)
2. Regenerate TypeScript files if proto definitions changed
3. Verify tsconfig.json paths are correctly configured

### Issue: Runtime gRPC Errors

**Solution:**

1. Check that proto file paths in microservice configuration are correct
2. Ensure package names match between proto files and service configuration
3. Verify loader includeDirs are properly set

## Useful Commands

```bash
# Install required protobuf dependencies
pnpm add long @grpc/grpc-js @grpc/proto-loader

# Type check after proto generation
pnpm type:check

# Build project to verify compilation
pnpm build

# Run proto generation (if you have scripts)
pnpm proto:build
```

## Integration with Jest E2E Tests

When writing E2E tests for gRPC services, ensure proper resource cleanup:

```typescript
afterEach(async () => {
  if (app) {
    await app.close();
  }
});
```

And configure Jest for better handling of async operations:

```json
{
  "testTimeout": 30000,
  "forceExit": true,
  "detectOpenHandles": true
}
```

## References

- [Protocol Buffers Documentation](https://developers.google.com/protocol-buffers)
- [NestJS gRPC Documentation](https://docs.nestjs.com/microservices/grpc)
- [protoc-gen-ts_proto](https://github.com/stephenh/ts-proto)
- [Long.js Documentation](https://github.com/dcodeIO/long.js)
