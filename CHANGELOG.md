# Changelog

All notable changes to this project will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.0.0/),
and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

## [Unreleased]

### Added
- Enhanced documentation with examples directory
- CONTRIBUTING.md guidelines for contributors
- SECURITY.md security policy
- CODE_OF_CONDUCT.md community guidelines
- GitHub issue templates

## [0.4.2] - 2025-02-21

### Fixed
- Error handling improvements for invalid timestamps
- Timezone conversion edge cases

## [0.4.1] - 2025-02-20

### Added
- Batch processing support for time calculations
- Stats operation for statistical analysis of timestamps
- Sort operation for chronological sorting
- Interaction modes: single_to_many, many_to_single, pairwise, cross_product

## [0.4.0] - 2025-02-18

### Added
- TIME CALCULATOR tool with add, subtract, diff, and duration_between operations
- Comprehensive timezone support for all operations
- Human-readable duration formatting
- Debug mode configuration

### Changed
- Refactored tool architecture for better maintainability
- Enhanced error messages with more context

## [0.3.0] - 2025-02-15

### Added
- Multiple output formats (ISO, RFC2822, SQL, locale strings)
- Locale support for international formatting
- Offset inclusion option

### Fixed
- DST transition handling improvements

## [0.2.0] - 2025-02-10

### Added
- GET TIME tool implementation
- Basic timezone conversion support
- Initial test suite

## [0.1.0] - 2025-02-01

### Added
- Initial project setup
- MCP server foundation
- Basic datetime functionality
- Project documentation

---

## Release Notes Format

Each release should include:
- **Added** for new features
- **Changed** for changes in existing functionality
- **Deprecated** for soon-to-be removed features
- **Removed** for now removed features
- **Fixed** for any bug fixes
- **Security** for vulnerability fixes
