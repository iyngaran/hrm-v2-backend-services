# SWC (Speedy Web Compiler) Guide

This document provides a comprehensive overview of SWC and its core packages used in the project.

## Table of Contents

- [What is SWC?](#what-is-swc)
- [@swc/core](#swccore)
- [@swc/cli](#swccli)
- [Key Features](#key-features)
- [Performance Benefits](#performance-benefits)

### 3. **Monorepo Builds**

```bash
# Build multiple packages
swc packages/*/src -d packages/*/dist --config-file .swcrc
```

### 4. **Development Workflow**

- [Project Usage](#project-usage)
- [Configuration](#configuration)
- [Common Use Cases](#common-use-cases)
- [SWC vs Other Tools](#swc-vs-other-tools)

## What is SWC?

**SWC (Speedy Web Compiler)** is a super-fast TypeScript/JavaScript compiler written in **Rust**. It's designed to be a drop-in replacement for Babel and other JavaScript build tools, offering significantly faster compilation times.

> SWC is **20x faster** than Babel on a single thread and **70x faster** on four cores!

### Why SWC?

- **Performance**: Written in Rust for maximum speed
- **Modern**: Supports latest JavaScript and TypeScript features
- **Compatible**: Drop-in replacement for existing tools
- **Extensible**: Plugin system for custom transformations
- **Production Ready**: Used by major companies like Vercel, Deno, and ByteDance

## @swc/core

`@swc/core` is the **core compilation engine** of SWC. It contains the main Rust-based compiler that does the heavy lifting.

### What does @swc/core do?

- **Parsing**: Converts source code into Abstract Syntax Tree (AST)
- **Transformation**: Applies various transformations to the AST
- **Code Generation**: Converts transformed AST back to JavaScript/TypeScript
- **Minification**: Optimizes and compresses the output code
- **Source Maps**: Generates source maps for debugging

### Key Capabilities

```typescript
// TypeScript/ES6+ Input
import { Component } from 'react';
class MyComponent extends Component<Props> {
  async fetchData(): Promise<Data> {
    const response = await fetch('/api/data');
    return response.json();
  }
}

// Compiled Output (ES5)
var MyComponent = /** @class */ (function (_super) {
  __extends(MyComponent, _super);
  function MyComponent() {
    return (_super !== null && _super.apply(this, arguments)) || this;
  }
  MyComponent.prototype.fetchData = function () {
    return __awaiter(this, void 0, void 0, function () {
      var response;
      return __generator(this, function (_a) {
        switch (_a.label) {
          case 0:
            return [4 /*yield*/, fetch('/api/data')];
          case 1:
            response = _a.sent();
            return [2 /*return*/, response.json()];
        }
      });
    });
  };
  return MyComponent;
})(Component);
```

### Transformations Supported

- **TypeScript** → JavaScript
- **JSX** → Regular JavaScript
- **ES6+ Syntax** → ES5/ES3
- **Decorators** → Standard JavaScript
- **Import/Export** → CommonJS/AMD/UMD
- **Async/Await** → Promises with generators

## @swc/cli

`@swc/cli` is the **command-line interface** for SWC. It provides a convenient way to use SWC from the terminal or in build scripts.

### Installation

```bash
# Install both core and CLI
npm install --save-dev @swc/core @swc/cli

# Or with pnpm
pnpm add -D @swc/core @swc/cli
```

### Basic Usage

```bash
# Compile a single file
swc src/index.ts -o dist/index.js

# Compile entire directory
swc src -d dist

# Watch mode for development
swc src -d dist --watch

# Compile with source maps
swc src -d dist --source-maps

# Compile and minify
swc src -d dist --minify
```

### CLI Options

| Option              | Description            | Example                                |
| ------------------- | ---------------------- | -------------------------------------- |
| `-o, --out-file`    | Output file path       | `swc input.ts -o output.js`            |
| `-d, --out-dir`     | Output directory       | `swc src -d dist`                      |
| `-w, --watch`       | Watch for file changes | `swc src -d dist --watch`              |
| `-s, --source-maps` | Generate source maps   | `swc src -d dist --source-maps`        |
| `--minify`          | Minify output          | `swc src -d dist --minify`             |
| `--config-file`     | Custom config file     | `swc src -d dist --config-file .swcrc` |

### Advanced CLI Usage

```bash
# Custom configuration
swc src -d dist --config-file custom.swcrc

# Include/exclude patterns
swc src -d dist --ignore "**/*.test.ts"

# Different module systems
swc src -d dist --env-name production

# Copy non-JS files
swc src -d dist --copy-files

# Strip TypeScript types only
swc src -d dist --strip-leading-paths
```

## Key Features

### 1. **Speed & Performance**

- **Rust-based**: Native performance without JavaScript overhead
- **Parallel Processing**: Multi-threaded compilation
- **Incremental Compilation**: Only recompiles changed files

### 2. **Language Support**

- **TypeScript**: Full TypeScript support including decorators
- **JSX/TSX**: React and other JSX frameworks
- **Modern JavaScript**: ES2015+ features
- **Experimental Features**: Stage 1-3 proposals

### 3. **Output Targets**

- **Multiple Environments**: Browser, Node.js, Web Workers
- **Module Systems**: ES Modules, CommonJS, AMD, UMD
- **Legacy Support**: ES5, ES3 compatibility

### 4. **Developer Experience**

- **Source Maps**: Accurate debugging information
- **Error Messages**: Clear and helpful error reporting
- **Watch Mode**: Fast rebuilds during development

## Performance Benefits

### Compilation Speed Comparison

| Tool       | Time (1000 files) | Relative Speed |
| ---------- | ----------------- | -------------- |
| SWC        | 0.8s              | 1x (fastest)   |
| esbuild    | 1.2s              | 1.5x slower    |
| Babel      | 16s               | 20x slower     |
| TypeScript | 25s               | 31x slower     |

### Memory Usage

- **Low Memory Footprint**: Efficient Rust implementation
- **Garbage Collection**: No JavaScript GC pauses
- **Streaming**: Processes files as streams when possible

## Project Usage

### In NestJS Projects

```typescript
// nest-cli.json
{
  "collection": "@nestjs/schematics",
  "sourceRoot": "src",
  "compilerOptions": {
    "builder": "swc",
    "typeCheck": true
  }
}
```

### In Build Scripts

```json
{
  "scripts": {
    "build": "swc src -d dist",
    "build:watch": "swc src -d dist --watch",
    "build:prod": "swc src -d dist --minify --source-maps"
  }
}
```

### Integration with Testing

```bash
# Use SWC for test compilation
jest --transform '{"^.+\\.(t|j)sx?$": "@swc/jest"}'
```

## Configuration

### .swcrc Configuration

```json
{
  "jsc": {
    "parser": {
      "syntax": "typescript",
      "tsx": true,
      "decorators": true,
      "dynamicImport": true
    },
    "transform": {
      "legacyDecorator": true,
      "decoratorMetadata": true
    },
    "target": "es2020",
    "loose": false,
    "externalHelpers": false,
    "keepClassNames": true
  },
  "module": {
    "type": "commonjs",
    "strict": false,
    "strictMode": true,
    "lazy": false,
    "noInterop": false
  },
  "minify": false,
  "sourceMaps": true,
  "inlineSourcesContent": true
}
```

### Environment-Specific Configuration

```json
{
  "env": {
    "development": {
      "sourceMaps": "inline",
      "minify": false
    },
    "production": {
      "sourceMaps": true,
      "minify": true,
      "jsc": {
        "minify": {
          "compress": true,
          "mangle": true
        }
      }
    }
  }
}
```

## Common Use Cases

### 1. **TypeScript Compilation**

```bash
# Replace tsc with swc
swc src --out-dir dist --strip-leading-paths
```

### 2. **JSX/React Projects**

```bash
# Compile React components
swc src -d dist --config-file .swcrc
```

### 3. **Monorepo Package Builds**

```bash
# Build multiple packages
swc packages/*/src -d packages/*/dist --config-file .swcrc
```

### 4. **Development Builds**

```bash
# Fast development builds
swc src -d dist --watch --source-maps inline
```

## SWC vs Other Tools

### SWC vs Babel

| Feature              | SWC        | Babel      |
| -------------------- | ---------- | ---------- |
| **Speed**            | 20x faster | Baseline   |
| **Language**         | Rust       | JavaScript |
| **Plugin Ecosystem** | Growing    | Mature     |
| **TypeScript**       | Native     | Via preset |
| **Configuration**    | Simple     | Complex    |

### SWC vs esbuild

| Feature          | SWC          | esbuild             |
| ---------------- | ------------ | ------------------- |
| **Speed**        | Faster       | Fast                |
| **TypeScript**   | Full support | Type stripping only |
| **Decorators**   | Full support | Limited             |
| **Plugins**      | SWC plugins  | esbuild plugins     |
| **Minification** | Advanced     | Basic               |

### SWC vs TypeScript Compiler

| Feature           | SWC          | TypeScript    |
| ----------------- | ------------ | ------------- |
| **Speed**         | 31x faster   | Baseline      |
| **Type Checking** | Optional     | Built-in      |
| **Incremental**   | File-level   | Project-level |
| **Bundling**      | No           | No            |
| **Standards**     | Follows TC39 | Microsoft-led |

## Best Practices

### 1. **Development Setup**

- Use `--watch` mode for development
- Enable source maps for debugging
- Keep type checking separate with `tsc --noEmit`

### 2. **Production Builds**

- Enable minification for smaller bundles
- Use external source maps for debugging
- Consider target environment for optimal output

### 3. **Performance Optimization**

- Use `.swcrc` for consistent configuration
- Leverage SWC's caching mechanisms
- Profile builds to identify bottlenecks

### 4. **Migration Strategy**

- Start with simple TypeScript compilation
- Gradually migrate complex Babel plugins
- Test thoroughly in CI/CD pipelines

## Conclusion

SWC provides a **significant performance boost** over traditional JavaScript/TypeScript compilation tools while maintaining compatibility and feature parity. The combination of `@swc/core` for the compilation engine and `@swc/cli` for command-line usage makes it an excellent choice for modern web development projects.

**Key Takeaways:**

- **@swc/core**: The Rust-based compilation engine
- **@swc/cli**: Command-line interface for easy usage
- **Performance**: 20-70x faster than traditional tools
- **Compatibility**: Drop-in replacement for existing workflows
- **Future-proof**: Active development and growing ecosystem
