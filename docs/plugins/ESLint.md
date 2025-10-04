# ESLint & Prettier Configuration Guide

This document provides an overview of ESLint and Prettier configurations used in the project.

## Table of Contents

- [ESLint](#eslint)
- [Prettier](#prettier)
- [ESLint + Prettier Integration](#eslint--prettier-integration)

## ESLint

ESLint is a static code analysis tool for **JavaScript** and **TypeScript**. It helps developers identify and fix problems in their code, ensuring it follows best practices and consistent coding styles.

> Think of it as a **spell-checker** + **style guide enforcer** for your code.

### Key Features

- **Linting**: Analyzes your code without running it, catching issues like:
  - Unused variables
  - Undefined variables
  - Dangerous patterns

- **Style Enforcement**: Ensures consistency in:
  - Indentation
  - Quotes (`'` vs `"`)
  - Semicolons
  - Other formatting rules

- **Extensible**: You can use pre-made configurations:
  - Airbnb
  - Google
  - StandardJS
  - Or create custom rules

- **Integrations**: Works seamlessly with:
  - Editors (VS Code, WebStorm, etc.)
  - Build tools
  - CI/CD pipelines

- **Auto-fix**: Automatically fixes many problems:
  - Code reformatting
  - Removing unused imports
  - Other common issues

### Project Configuration

In this project, we use:

- **ESLint 9+** with modern flat config
- Configuration file: `eslint.config.js`
- **No legacy** `.eslintrc` files

ESLint helps maintain high-quality, readable, and consistent code in JavaScript/TypeScript projects.

## Prettier

Prettier is an opinionated code formatter for **JavaScript**, **TypeScript**, **HTML**, **CSS**, and more. It automatically formats your code to ensure a consistent style across your entire codebase.

### Core Features

- **Opinionated**: Prettier enforces a consistent style by parsing your code and re-printing it with its own rules

- **Wide Integration**: Works with:
  - Most editors
  - Build processes
  - Version control hooks

- **Zero Configuration**: Prettier comes with sensible defaults, so you don't have to spend time configuring it

Prettier helps maintain a consistent code style in your projects, making it easier to read and collaborate on code.

## ESLint + Prettier Integration

When used together, ESLint and Prettier complement each other perfectly:

| Tool         | Focus Area                        | Purpose                               |
| ------------ | --------------------------------- | ------------------------------------- |
| **ESLint**   | Code quality and potential errors | Catches bugs, enforces best practices |
| **Prettier** | Code formatting and style         | Ensures consistent visual formatting  |

This combination provides comprehensive code quality assurance covering both functional correctness and visual consistency.
