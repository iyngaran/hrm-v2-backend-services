1. **ESLint**

ESLint is a static code analysis tool for **JavaScript** and **TypeScript**. It helps developers identify and fix problems in their code, ensuring it follows best practices and consistent coding styles.

Think of it as a **spell-checker** + **style guide enforcer** for your code.

Key Points:

- **Linting**: Analyzes your code without running it, catching issues like unused variables, undefined variables, or dangerous patterns.

- **Style enforcement**: Ensures consistency in things like indentation, quotes (' vs "), semicolons, etc.

- **Extensible**: You can use pre-made configurations (like Airbnb, Google, or StandardJS) or create custom rules.

- **Integrations**: Works with editors (VS Code, WebStorm, etc.), build tools, and CI pipelines.

- **Autofix**: Can automatically fix many problems (e.g., reformatting code, removing unused imports).

In summary, ESLint helps maintain high-quality, readable, and consistent code in JavaScript/TypeScript projects.

In this project, I am using ESLint 9+ with modern flat config. (`eslint.config.js`) and no legacy `.eslintrc` files.

2. **Prettier**

Prettier is an opinionated code formatter for **JavaScript**, **TypeScript**, **HTML**, **CSS**, and more. It automatically formats your code to ensure a consistent style across your entire codebase.

Key Points:

- **Opinionated**: Prettier enforces a consistent style by parsing your code and re-printing it with its own rules.

- **Integration**: Works with most editors and can be integrated into build processes.

- **No configuration**: Prettier comes with sensible defaults, so you don't have to spend time configuring it.

In summary, Prettier helps maintain a consistent code style in your projects, making it easier to read and collaborate on code.

3. **ESLint + Prettier Together**

When used together, ESLint and Prettier complement each other:

- **ESLint** focuses on code quality and potential errors.
- **Prettier** focuses on code formatting and style.
