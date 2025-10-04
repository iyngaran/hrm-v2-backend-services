# Globals Package Guide

This document provides a comprehensive overview of the `globals` package and its usage in ESLint configurations.

## Table of Contents

- [What is the Globals Package?](#what-is-the-globals-package)
- [ESLint Evolution](#eslint-evolution)
- [Why We Need It](#why-we-need-it)
- [Installation](#installation)
- [Usage in ESLint Config](#usage-in-eslint-config)
- [Available Global Environments](#available-global-environments)
- [Project-Specific Usage](#project-specific-usage)
- [Common Patterns](#common-patterns)
- [Troubleshooting](#troubleshooting)
- [Best Practices](#best-practices)

## What is the Globals Package?

The `globals` package is a curated list of **global variables** that are available in different JavaScript runtime environments. It helps linting tools like ESLint understand which global variables are legitimate and shouldn't be flagged as "undefined" errors.

### Key Purpose

- **Defines legitimate globals** for different environments (Browser, Node.js, Jest, etc.)
- **Prevents false positives** in ESLint when using environment-specific globals
- **Standardizes global definitions** across the JavaScript ecosystem
- **Maintains compatibility** across different runtime environments

## ESLint Evolution

The usage of `globals` has evolved significantly with ESLint versions:

### ESLint 8 and Earlier (Legacy)

```javascript
// .eslintrc.js (Legacy Configuration)
module.exports = {
  env: {
    node: true, // Automatically included Node.js globals
    es2021: true, // Automatically included ES2021 globals
    jest: true, // Automatically included Jest globals
  },
};
```

- **Globals were built-in** to ESLint
- **Environment presets** automatically included relevant globals
- **No separate package** needed for basic environments

### ESLint 9+ (Modern Flat Config)

```javascript
// eslint.config.mjs (Modern Configuration)
import globals from 'globals';

export default [
  {
    languageOptions: {
      globals: {
        ...globals.node, // Must explicitly import Node.js globals
        ...globals.es2021, // Must explicitly import ES2021 globals
        ...globals.jest, // Must explicitly import Jest globals
      },
    },
  },
];
```

- **Explicit dependency** on `globals` package required
- **Manual import and configuration** needed
- **More granular control** over which globals to include
- **Better tree-shaking** and performance

### Why the Change?

1. **Performance**: Smaller bundle size, only include needed globals
2. **Explicitness**: Clear about which globals are available
3. **Flexibility**: Mix and match different environment globals
4. **Maintainability**: Centralized global definitions in separate package

## Why We Need It

### Without Globals Package

```javascript
// This would cause ESLint errors
console.log(process.env.NODE_ENV); // ❌ 'process' is not defined
const buffer = Buffer.from('hello'); // ❌ 'Buffer' is not defined

describe('User Service', () => {
  // ❌ 'describe' is not defined
  it('should create user', () => {
    // ❌ 'it' is not defined
    expect(true).toBe(true); // ❌ 'expect' is not defined
  });
});
```

### With Globals Package

```javascript
// With proper globals configuration - No ESLint errors
console.log(process.env.NODE_ENV); // ✅ Valid Node.js global
const buffer = Buffer.from('hello'); // ✅ Valid Node.js global

describe('User Service', () => {
  // ✅ Valid Jest global
  it('should create user', () => {
    // ✅ Valid Jest global
    expect(true).toBe(true); // ✅ Valid Jest global
  });
});
```

## Installation

### Package Installation

```bash
# Using npm
npm install --save-dev globals

# Using pnpm (recommended for this project)
pnpm add -D globals

# Using yarn
yarn add --dev globals
```

### Version Compatibility

```json
{
  "devDependencies": {
    "eslint": "^9.18.0", // ESLint 9+ required
    "globals": "^16.0.0" // Latest globals package
  }
}
```

## Usage in ESLint Config

### Basic Configuration

```javascript
// eslint.config.mjs
import globals from 'globals';

export default [
  {
    files: ['**/*.{js,mjs,cjs,ts}'],
    languageOptions: {
      globals: {
        ...globals.node, // Node.js environment globals
        ...globals.es2021, // Modern JavaScript globals
      },
    },
  },
];
```

### Advanced Configuration

```javascript
// eslint.config.mjs
import js from '@eslint/js';
import globals from 'globals';
import tseslint from 'typescript-eslint';

export default [
  // Base configuration for all files
  {
    files: ['**/*.{js,mjs,cjs,ts}'],
    languageOptions: {
      ecmaVersion: 2022,
      sourceType: 'module',
      globals: {
        ...globals.node,
        ...globals.es2021,
      },
    },
  },

  // Test-specific configuration
  {
    files: ['**/*.{test,spec}.{js,ts}', '**/test/**/*.{js,ts}'],
    languageOptions: {
      globals: {
        ...globals.node,
        ...globals.es2021,
        ...globals.jest, // Add Jest globals for test files
      },
    },
  },

  // Apply recommended configs
  js.configs.recommended,
  ...tseslint.configs.recommended,
];
```

### Environment-Specific Configurations

```javascript
// Different configurations for different file types
export default [
  // Server-side files
  {
    files: ['src/**/*.{js,ts}', 'apps/**/*.{js,ts}'],
    languageOptions: {
      globals: {
        ...globals.node,
        ...globals.es2021,
      },
    },
  },

  // Test files
  {
    files: ['**/*.{test,spec}.{js,ts}'],
    languageOptions: {
      globals: {
        ...globals.node,
        ...globals.es2021,
        ...globals.jest,
      },
    },
  },

  // Build scripts (if any browser-related)
  {
    files: ['scripts/**/*.{js,ts}'],
    languageOptions: {
      globals: {
        ...globals.node,
        ...globals.es2021,
        ...globals.browser, // If scripts interact with DOM
      },
    },
  },
];
```

## Available Global Environments

### Core Environments

| Environment      | Usage             | Common Globals                                  |
| ---------------- | ----------------- | ----------------------------------------------- |
| `globals.es2021` | Modern JavaScript | `Promise`, `Map`, `Set`, `Symbol`, `globalThis` |
| `globals.es2020` | ES2020 features   | `BigInt`, `globalThis`                          |
| `globals.es6`    | ES6/ES2015        | `Promise`, `Map`, `Set`, `Symbol`               |
| `globals.es5`    | Legacy JavaScript | Basic JavaScript globals                        |

### Runtime Environments

| Environment             | Usage                | Common Globals                                           |
| ----------------------- | -------------------- | -------------------------------------------------------- |
| `globals.node`          | Node.js applications | `process`, `Buffer`, `global`, `__dirname`, `__filename` |
| `globals.browser`       | Browser applications | `window`, `document`, `localStorage`, `fetch`            |
| `globals.webextensions` | Browser extensions   | Extension-specific APIs                                  |
| `globals.worker`        | Web Workers          | `self`, `importScripts`                                  |

### Testing Frameworks

| Environment       | Usage           | Common Globals                                        |
| ----------------- | --------------- | ----------------------------------------------------- |
| `globals.jest`    | Jest testing    | `describe`, `it`, `expect`, `beforeEach`, `afterEach` |
| `globals.mocha`   | Mocha testing   | `describe`, `it`, `before`, `after`                   |
| `globals.jasmine` | Jasmine testing | `describe`, `it`, `expect`, `spyOn`                   |
| `globals.vitest`  | Vitest testing  | `describe`, `it`, `expect`, `vi`                      |

### Build Tools & Libraries

| Environment           | Usage               | Common Globals                 |
| --------------------- | ------------------- | ------------------------------ |
| `globals.commonjs`    | CommonJS modules    | `require`, `module`, `exports` |
| `globals.amd`         | AMD modules         | `define`, `require`            |
| `globals.jquery`      | jQuery applications | `$`, `jQuery`                  |
| `globals.prototypejs` | Prototype.js        | `$`, `$$`, `Element`           |

## Project-Specific Usage

### For NestJS Backend (Current Project)

```javascript
// eslint.config.mjs - Recommended for this project
import js from '@eslint/js';
import globals from 'globals';
import tseslint from 'typescript-eslint';

export default [
  {
    files: ['**/*.{js,mjs,cjs,ts}'],
    languageOptions: {
      ecmaVersion: 2022,
      sourceType: 'module',
      globals: {
        ...globals.node, // Essential for NestJS/Node.js
        ...globals.es2021, // Modern JavaScript features
      },
    },
  },

  // Test files configuration
  {
    files: [
      '**/*.{test,spec}.{js,ts}',
      '**/test/**/*.{js,ts}',
      '**/*.e2e-spec.{js,ts}',
    ],
    languageOptions: {
      globals: {
        ...globals.node,
        ...globals.es2021,
        ...globals.jest, // Jest testing globals
      },
    },
  },

  js.configs.recommended,
  ...tseslint.configs.recommended,
];
```

### Required Globals for This Project

```javascript
// Node.js globals (Essential)
process; // Environment variables, arguments
Buffer; // Binary data handling
global; // Node.js global object
__dirname; // Current directory path
__filename; // Current file path
console; // Logging (though usually available everywhere)

// ES2021 globals (Modern JavaScript)
Promise; // Async operations
Map; // Key-value collections
Set; // Unique value collections
Symbol; // Unique identifiers
globalThis; // Universal global object
BigInt; // Large integers

// Jest globals (Testing)
describe; // Test suites
it; // Individual tests
expect; // Assertions
beforeEach; // Setup hooks
afterEach; // Cleanup hooks
beforeAll; // Global setup
afterAll; // Global cleanup
```

## Common Patterns

### 1. **Basic Node.js Application**

```javascript
export default [
  {
    languageOptions: {
      globals: {
        ...globals.node,
        ...globals.es2021,
      },
    },
  },
];
```

### 2. **Full-Stack Application**

```javascript
export default [
  // Server-side
  {
    files: ['server/**/*.js', 'api/**/*.js'],
    languageOptions: {
      globals: {
        ...globals.node,
        ...globals.es2021,
      },
    },
  },

  // Client-side
  {
    files: ['client/**/*.js', 'src/**/*.js'],
    languageOptions: {
      globals: {
        ...globals.browser,
        ...globals.es2021,
      },
    },
  },
];
```

### 3. **Library Development**

```javascript
export default [
  {
    languageOptions: {
      globals: {
        ...globals.es2021,
        // Minimal globals for maximum compatibility
      },
    },
  },
];
```

### 4. **Custom Globals**

```javascript
export default [
  {
    languageOptions: {
      globals: {
        ...globals.node,
        ...globals.es2021,

        // Custom globals specific to your project
        myCustomGlobal: 'readonly',
        APP_VERSION: 'readonly',
        DEBUG: 'writable',
      },
    },
  },
];
```

## Troubleshooting

### Common Issues

#### 1. **"'process' is not defined" Error**

**Problem**: ESLint complains about Node.js globals

```javascript
console.log(process.env.NODE_ENV); // ❌ 'process' is not defined
```

**Solution**: Add Node.js globals

```javascript
import globals from 'globals';

export default [
  {
    languageOptions: {
      globals: {
        ...globals.node, // ✅ Includes process, Buffer, etc.
      },
    },
  },
];
```

#### 2. **"'describe' is not defined" Error**

**Problem**: ESLint complains about Jest globals in test files

```javascript
describe('User Service', () => { // ❌ 'describe' is not defined
```

**Solution**: Add Jest globals for test files

```javascript
export default [
  {
    files: ['**/*.test.js', '**/*.spec.js'],
    languageOptions: {
      globals: {
        ...globals.jest, // ✅ Includes describe, it, expect
      },
    },
  },
];
```

#### 3. **"'window' is not defined" Error**

**Problem**: ESLint complains about browser globals

```javascript
window.location.href = '/login'; // ❌ 'window' is not defined
```

**Solution**: Add browser globals (if applicable)

```javascript
export default [
  {
    languageOptions: {
      globals: {
        ...globals.browser, // ✅ Includes window, document, etc.
      },
    },
  },
];
```

### Debugging Tips

#### 1. **Check Which Globals Are Available**

```javascript
// Add this to see all available globals
console.log('Node globals:', Object.keys(globals.node));
console.log('Jest globals:', Object.keys(globals.jest));
console.log('Browser globals:', Object.keys(globals.browser));
```

#### 2. **Verify ESLint Configuration**

```bash
# Check ESLint configuration
npx eslint --print-config src/app.module.ts
```

#### 3. **Test Specific Files**

```bash
# Lint specific file to isolate issues
npx eslint src/app.module.ts --fix
```

## Best Practices

### 1. **Use Environment-Specific Configurations**

```javascript
// ✅ Good: Different configs for different file types
export default [
  // Production code
  {
    files: ['src/**/*.ts'],
    languageOptions: {
      globals: { ...globals.node, ...globals.es2021 }
    }
  },

  // Test code
  {
    files: ['**/*.test.ts'],
    languageOptions: {
      globals: { ...globals.node, ...globals.es2021, ...globals.jest }
    }
  }
];

// ❌ Avoid: Same config for all files
export default [
  {
    languageOptions: {
      globals: { ...globals.node, ...globals.browser, ...globals.jest }
    }
  }
];
```

### 2. **Be Explicit About Required Globals**

```javascript
// ✅ Good: Only include what you need
export default [
  {
    languageOptions: {
      globals: {
        ...globals.node,      // Backend needs Node.js
        ...globals.es2021     // Modern JavaScript features
      }
    }
  }
];

// ❌ Avoid: Including unnecessary globals
export default [
  {
    languageOptions: {
      globals: {
        ...globals.node,
        ...globals.browser,   // Not needed for backend
        ...globals.jquery,    // Not using jQuery
        ...globals.jest       // Should be test-specific
      }
    }
  }
];
```

### 3. **Keep Package Up to Date**

```bash
# Check for updates
pnpm update globals

# Or check outdated packages
pnpm outdated
```

### 4. **Document Your Global Usage**

```javascript
// eslint.config.mjs
import globals from 'globals';

export default [
  {
    files: ['**/*.{js,ts}'],
    languageOptions: {
      globals: {
        // Node.js runtime globals for NestJS backend
        ...globals.node,

        // Modern JavaScript features (Promise, Map, Set, etc.)
        ...globals.es2021,

        // Note: Jest globals are added separately for test files
      },
    },
  },
];
```

### 5. **Validate Configuration**

```javascript
// Add a simple test to ensure globals work
export default [
  {
    languageOptions: {
      globals: {
        ...globals.node,
        ...globals.es2021,
      },
    },
    rules: {
      // Ensure undefined globals cause errors
      'no-undef': 'error',
    },
  },
];
```

## Conclusion

The `globals` package is **essential for ESLint 9+ flat config** setups. It provides:

- **Legitimate global definitions** for different runtime environments
- **Prevention of false positive** linting errors
- **Granular control** over which globals are available where
- **Better performance** through explicit imports

### Key Takeaways

- **ESLint 9+ requires explicit `globals` dependency**
- **Different file types may need different global sets**
- **Environment-specific configuration prevents false positives**
- **Keep the package updated for latest global definitions**
- **Use minimal globals for better code clarity**

### For This Project

```json
{
  "devDependencies": {
    "globals": "^16.0.0" // ✅ Required for ESLint 9+ flat config
  }
}
```

The `globals` package is not optional—it's a necessary dependency for modern ESLint configurations in Node.js projects like this NestJS backend.
