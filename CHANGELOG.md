# Changelog

All notable changes to this project will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.0.0/),
and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

## [Unreleased]

### Security
- Replaced all wildcard dependency versions with pinned versions
- Removed insecure `git://` protocol dependency for merged-pooler
- Added input validation for all API endpoints
- Added constant-time password comparison for admin authentication
- Restricted CLI listener to localhost only (127.0.0.1)
- Removed hardcoded default admin password
- Added structured logging with JSON output option
- Added security audit logging

### Added
- Health check endpoint (`/health`)
- Prometheus-compatible metrics endpoint (`/metrics`)
- ESLint configuration for code quality
- Jest test suite with validation, config loader, logger, and website tests
- GitHub Actions CI/CD pipeline with lint, test, audit, and build stages
- Dockerfile with multi-stage build and non-root user
- docker-compose.yml with Redis and optional Redis Commander
- .env.example for secure configuration management
- Config loader with environment variable substitution
- Structured logger with audit, security, and performance logging
- Input validation utilities
- CHANGELOG.md and CONTRIBUTING.md

### Changed
- Updated Node.js engine requirement from >=0.12 to >=18.0.0
- Replaced log4js with custom structured logger
- Configuration now supports environment variable substitution
- Admin password now loaded from environment variable
- Improved error handling with standardized error responses

### Fixed
- Dependency hygiene: all dependencies now have pinned versions
- CLI listener now binds to localhost only
- Admin authentication uses constant-time comparison
- Input validation prevents injection attacks

## [0.0.5] - 2026-09-21

### Added
- Initial release of Unified NOMP
- Merged mining support
- Multi-coin support
- Payment processing
- Website with stats
- Profit switching
- CLI interface

---

## Release Notes Template

### [Version] - YYYY-MM-DD

#### Security
- Security-related changes

#### Added
- New features

#### Changed
- Changes in existing functionality

#### Deprecated
- Soon-to-be removed features

#### Removed
- Removed features

#### Fixed
- Bug fixes