# Contributing to chrono-mcp

Thank you for your interest in contributing to chrono-mcp! This document provides guidelines and instructions for contributing to this project.

## Table of Contents

- [Code of Conduct](#code-of-conduct)
- [Getting Started](#getting-started)
- [Development Setup](#development-setup)
- [How to Contribute](#how-to-contribute)
- [Style Guidelines](#style-guidelines)
- [Testing](#testing)
- [Commit Messages](#commit-messages)
- [Release Process](#release-process)

## Code of Conduct

This project adheres to a code of conduct. By participating, you are expected to uphold this code. Please read our [CODE_OF_CONDUCT.md](CODE_OF_CONDUCT.md) before contributing.

## Getting Started

1. Fork the repository on GitHub
2. Clone your fork locally
3. Create a new branch for your contribution
4. Make your changes
5. Run tests and linting
6. Submit a pull request

## Development Setup

### Prerequisites

- Node.js >= 22.0.0
- npm >= 10.0.0

### Installation

```bash
# Clone your fork
git clone https://github.com/YOUR_USERNAME/chrono-mcp.git
cd chrono-mcp

# Install dependencies
npm install

# Build the project
npm run build

# Run tests
npm test
```

## How to Contribute

### Reporting Bugs

Before creating a bug report, please:

1. Check if the issue already exists in the [issue tracker](https://github.com/JMoak/chrono-mcp/issues)
2. Ensure you're using the latest version
3. Collect information about the bug (steps to reproduce, expected behavior, actual behavior)

When submitting a bug report, please include:
- A clear, descriptive title
- Steps to reproduce the issue
- Expected behavior
- Actual behavior
- Node.js version
- Operating system
- Any error messages or stack traces

### Suggesting Features

Feature requests are welcome! Please provide:
- A clear description of the feature
- The use case or problem it solves
- Any potential implementation ideas
- Whether you'd be willing to implement it

### Pull Requests

1. Create a new branch from `main` for your changes
2. Make your changes following our style guidelines
3. Add or update tests as necessary
4. Ensure all tests pass: `npm test`
5. Run linting: `npm run lint`
6. Update documentation if needed
7. Submit a pull request with a clear description

#### Pull Request Process

1. Update the README.md or other documentation if your changes affect usage
2. Update the CHANGELOG.md with details of your changes
3. Ensure your PR passes all CI checks
4. Request review from maintainers
5. Address any review feedback

## Style Guidelines

### Code Style

We use [Biome](https://biomejs.dev/) for linting and formatting:

```bash
# Check for linting issues
npm run lint

# Auto-fix linting issues
npm run lint:fix
```

### TypeScript Guidelines

- Use strict TypeScript settings
- Prefer explicit types over implicit
- Use interfaces for object shapes
- Document public APIs with JSDoc comments

### File Organization

```
src/
├── index.ts           # Main server entry point
├── cli.ts             # CLI entry point
├── tools/             # MCP tool implementations
│   ├── get-time.ts
│   └── time-calculator.ts
└── utils/             # Utility functions
    ├── config.ts
    ├── date-utils.ts
    └── validation.ts
```

## Testing

### Running Tests

```bash
# Run all tests
npm test

# Run tests with UI
npm run test:ui

# Run tests in watch mode (during development)
npx vitest
```

### Writing Tests

- Place test files next to the code they test (e.g., `get-time.test.ts`)
- Use descriptive test names that explain the behavior
- Test both success and error cases
- Mock external dependencies when appropriate

### Test Coverage

We aim for high test coverage. Please ensure your changes:
- Have comprehensive test coverage
- Don't decrease overall coverage
- Include edge cases and error conditions

## Commit Messages

We follow [Conventional Commits](https://www.conventionalcommits.org/):

```
<type>[optional scope]: <description>

[optional body]

[optional footer(s)]
```

Types:
- **feat**: A new feature
- **fix**: A bug fix
- **docs**: Documentation only changes
- **style**: Changes that don't affect code meaning (formatting, semicolons, etc.)
- **refactor**: Code change that neither fixes a bug nor adds a feature
- **perf**: Performance improvement
- **test**: Adding or correcting tests
- **chore**: Changes to build process or auxiliary tools

Examples:
```
feat: add business days calculation
fix: handle invalid timezone error
docs: update README with new examples
test: add tests for DST transitions
```

## Release Process

Releases are automated via GitHub Actions when commits are merged to main:

- `feat:` commits trigger a minor version bump
- `fix:` commits trigger a patch version bump
- `feat!:` or commits with `BREAKING CHANGE` trigger a major version bump

The CI pipeline will:
1. Run tests and linting
2. Build the project
3. Bump the version
4. Publish to npm
5. Create a git tag

## Questions?

If you have questions or need help:
- Check existing [issues](https://github.com/JMoak/chrono-mcp/issues)
- Open a new issue with the "question" label
- Join the discussion

Thank you for contributing! 🌹
