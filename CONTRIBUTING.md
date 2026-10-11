# Contributing to UNOMP

Thank you for your interest in contributing to UNOMP! This document provides guidelines for contributing to the project.

## Code of Conduct

By participating in this project, you agree to abide by our Code of Conduct. Please be respectful and constructive in all interactions.

## How to Contribute

### Reporting Bugs

1. Check if the bug has already been reported in [Issues](https://github.com/PreCogSecurity/unomp/issues)
2. If not, create a new issue with:
   - Clear title and description
   - Steps to reproduce
   - Expected vs actual behavior
   - Environment details (Node.js version, OS, etc.)
   - Relevant logs (sanitized of sensitive data)

### Suggesting Features

1. Check existing issues and discussions
2. Create a feature request issue with:
   - Clear description of the feature
   - Use cases and benefits
   - Possible implementation approach

### Pull Requests

1. Fork the repository
2. Create a feature branch: `git checkout -b feature/your-feature-name`
3. Make your changes following the guidelines below
4. Run tests and linting: `npm test && npm run lint`
5. Commit with clear messages
6. Push to your fork and create a Pull Request

## Development Setup

### Prerequisites

- Node.js >= 18.0.0
- Redis >= 7.0
- npm >= 9.0.0

### Installation

```bash
# Clone your fork
git clone https://github.com/your-username/unomp.git
cd unomp

# Install dependencies
npm ci

# Copy example config
cp config.json.example config.json
cp .env.example .env

# Edit config.json and .env with your settings
# Start Redis
redis-server

# Run tests
npm test

# Run linter
npm run lint

# Start development server
npm start
```

## Coding Standards

### JavaScript Style

- Use 4 spaces for indentation
- Use single quotes for strings
- Always use semicolons
- Use `const` by default, `let` when reassignment needed
- No `var` declarations
- Use arrow functions for callbacks
- Use template literals for string interpolation

### ESLint

Run `npm run lint` before committing. The project uses ESLint with the following key rules:

- `indent: 4`
- `quotes: single`
- `semi: always`
- `no-var: error`
- `prefer-const: error`
- `eqeqeq: always`

### Security Guidelines

- **Never commit secrets** (passwords, API keys, private keys)
- Use environment variables for all configuration
- Validate all external input
- Use constant-time comparison for secrets
- Bind internal services to localhost only
- Keep dependencies updated and pinned
- Run `npm audit` regularly

### Testing

- Write tests for new functionality
- Maintain or improve code coverage
- Test both success and error paths
- Use descriptive test names

```bash
# Run all tests with coverage
npm test

# Run specific test file
npm test -- tests/validation.test.js
```

### Git Commit Messages

Follow conventional commits format:

```
type(scope): description

[optional body]

[optional footer]
```

Types:
- `feat`: New feature
- `fix`: Bug fix
- `docs`: Documentation changes
- `style`: Code style changes (formatting, etc.)
- `refactor`: Code refactoring
- `test`: Adding or updating tests
- `chore`: Maintenance tasks
- `security`: Security improvements

Examples:
```
feat(validation): add address validation for multiple currencies
fix(auth): use constant-time comparison for admin password
docs(readme): update installation instructions
security(deps): pin all dependency versions
```

## Pull Request Process

1. Ensure all CI checks pass (lint, test, audit)
2. Update documentation if needed
3. Add tests for new functionality
4. Update CHANGELOG.md with your changes
5. Request review from maintainers
6. Address review feedback
7. Squash commits if requested
8. Merge after approval

## Release Process

Releases are managed by maintainers:

1. Update version in package.json
2. Update CHANGELOG.md
3. Create git tag
4. GitHub Actions builds and publishes Docker image
5. Deploy to staging/production

## Getting Help

- Join our [Slack](http://slack.unomp.org)
- Open a [Discussion](https://github.com/PreCogSecurity/unomp/discussions)
- Check existing [Issues](https://github.com/PreCogSecurity/unomp/issues)

## License

By contributing, you agree that your contributions will be licensed under the GNU General Public License v2.0.