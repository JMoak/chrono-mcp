# Security Policy

## Supported Versions

The following versions of chrono-mcp are currently supported with security updates:

| Version | Supported          |
| ------- | ------------------ |
| 0.4.x   | :white_check_mark: |
| 0.3.x   | :x:                |
| < 0.3   | :x:                |

## Reporting a Vulnerability

We take security seriously. If you discover a security vulnerability, please follow these steps:

### 1. Do Not Open a Public Issue

Please do **not** create a public GitHub issue for security vulnerabilities. This could expose the vulnerability before a fix is available.

### 2. Report Privately

Send an email to security concerns to the repository owner through GitHub's private vulnerability reporting feature, or contact the maintainer directly.

### 3. Include Details

Your report should include:
- Description of the vulnerability
- Steps to reproduce (if applicable)
- Potential impact
- Suggested fix (if any)
- Your contact information for follow-up

### 4. Response Timeline

You can expect:
- **Acknowledgment**: Within 48 hours
- **Initial assessment**: Within 5 business days
- **Fix timeline**: Based on severity (see below)

## Security Measures

This project implements the following security measures:

### Input Validation

- All user inputs are validated using Zod schemas
- Strict type checking with TypeScript
- Maximum operation limits to prevent DoS

### Dependencies

- Regular dependency updates via Dependabot
- Minimal dependency footprint
- No known vulnerable dependencies

### Safe Defaults

- Default to safe, limited operations
- No arbitrary code execution
- No network access (stdio transport only)

## Vulnerability Severity

### Critical
- Remote code execution
- Arbitrary file system access
- Credential exposure

**Response time**: 24-48 hours

### High
- Denial of service
- Information disclosure
- Input validation bypass

**Response time**: 3-5 business days

### Medium
- Resource exhaustion
- Configuration exposure
- Non-critical validation issues

**Response time**: 1-2 weeks

### Low
- Documentation issues
- Best practice violations

**Response time**: Next release cycle

## Security Best Practices for Users

### MCP Client Configuration

When configuring chrono-mcp in your MCP client:

```json
{
  "mcpServers": {
    "chrono-mcp": {
      "command": "npx",
      "args": ["-y", "@jmoak/chrono-mcp@latest"]
    }
  }
}
```

### Running Locally

For local development:

```bash
# Use specific version
npx @jmoak/chrono-mcp@0.4.2

# Or run from source after verifying
git clone https://github.com/JMoak/chrono-mcp.git
cd chrono-mcp
npm ci  # Uses locked dependencies
npm run build
```

### Updating

Keep your installation up to date:

```bash
# Update to latest version
npx @jmoak/chrono-mcp@latest

# Check installed version
npx @jmoak/chrono-mcp --version
```

## Acknowledgments

We appreciate responsible disclosure of security issues. Contributors who report vulnerabilities will be acknowledged in release notes (unless they prefer anonymity).

## Security-related Configuration

### Environment Variables

- `DEBUG`: Enable debug mode (should be false in production)
- `MCP_TRANSPORT`: Transport mode (`stdio` or `http`)

### HTTP Mode Security

When running in HTTP mode:
- Bind to localhost only by default
- Use reverse proxy for external access
- Consider adding authentication for production use

## Contact

For security concerns, please use GitHub's private vulnerability reporting feature or contact the maintainers.
