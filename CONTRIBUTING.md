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

Every push to `main`, including a PR merge or a direct commit, runs CI and then
semantic-release. Pull requests run the same checks without publishing.

semantic-release examines **all commits since the last release tag**, not just the
merge commit's subject. The highest applicable bump wins:

- `feat:` / `feat(scope):` → minor
- `fix:` / `perf:` (with optional scopes) → patch
- Any conventional commit with `!`, or a `BREAKING CHANGE:` footer → major
- Only `docs:`, `test:`, `chore:`, or other non-release commits → no release

Use a conventional PR title when squash-merging: the squash commit is the history
that the release job sees. For a regular merge or rebase, the individual commits
remain available for analysis.

After lint, unit tests, build, MCP protocol tests, and a package dry run pass, the
release job publishes `@jmoak/chrono-mcp` to npm's `latest` tag and creates a `vX.Y.Z`
Git tag and GitHub release with generated notes. Release jobs are serialized.
The existing `v0.4.2` tag anchors the first release under this pipeline, including
the accumulated unreleased features.

The package version is assigned in the release workspace; `prepack` builds the
package after that version is assigned. The MCP server reads the package version,
so its handshake matches the installed release. No version-bump commit is pushed
back to `main`: the manifest in source is a baseline, while npm and release tags
are the published-version record. Do not manually bump it to trigger a release.

### npm authentication (one-time package-owner setup)

In the npm settings for `@jmoak/chrono-mcp`, configure a GitHub Actions trusted
publisher with these exact values:

- Organization or user: `JMoak`
- Repository: `chrono-mcp`
- Workflow filename: `ci-cd.yml`
- Environment: leave empty
- Allowed actions: enable **`npm publish`** (stage-only access does not permit
  this automatic release workflow)

The job has `id-token: write` and uses OIDC; it does not consume `NPM_TOKEN` or
require a maintainer to approve each package. A new trusted publisher must make
its first successful publish within two days. See the
[npm trusted-publishing guide](https://docs.npmjs.com/trusted-publishers/).

The workflow also supports **Run workflow** on `main` to retry after an
authentication/configuration repair. It still runs CI and releases only when
unreleased conventional commits warrant a version. A rerun with no new release
commits does not create another version.

## Questions?

If you have questions or need help:
- Check existing [issues](https://github.com/JMoak/chrono-mcp/issues)
- Open a new issue with the "question" label
- Join the discussion

Thank you for contributing! 🌹
