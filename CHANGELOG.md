# Changelog

All notable changes to this project will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.0.0/),
and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

## [Unreleased]

## [0.5.0] - 2026-08-09

### Added
- RFC 9557 (IXDTF) support: all datetime inputs accept bracketed IANA zone annotations with Temporal-compatible offset-consistency validation; new `ixdtf` output format
- `expand` operation: RFC 5545 RRULE and ISO 8601 repeating-interval expansion via rrule-temporal — DST-correct, window-bounded, with explicit truncation reporting
- Temporal context envelope: every tool response carries current time, weekday, elapsed-since-last-call, session age, and (first call) the tzdb version; disable with `CHRONO_ENVELOPE=off`
- Batch error isolation: `stats` and `sort` skip and report invalid entries (`invalid_count`, `invalid_inputs_sample`) instead of failing the batch
- Vibrissa protocol contract suites for envelope, IXDTF, expand, and isolation behavior
- Vibrissa protocol contracts for core operations (add, diff, duration_between, pairwise batching) including DST wall-clock preservation
- `npm run bench`: Vitest benchmark suite proving every batch operation at the `MAX_OPERATIONS` cap (10,000 items) completes in under 100ms

### Fixed
- HTTP transport now creates one Server/transport pair per MCP session (GHSA-345p-7cg4-v4c7 cross-client leak); sessions tracked by cryptographically random ids with lifecycle cleanup
- Operational failures surface as tool error responses instead of protocol-level exceptions

### Changed
- `@modelcontextprotocol/sdk` upgraded 1.18 → 1.30 (clears all audit advisories)

### Earlier unreleased items
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
