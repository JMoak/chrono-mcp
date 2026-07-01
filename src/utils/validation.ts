/**
 * Validation schemas for chrono-mcp tool parameters.
 *
 * This module provides Zod schemas for validating tool inputs,
 * including timezone identifiers, datetime formats, and locales.
 * These schemas are used by both tool implementations and can be
 * composed into larger validation schemas.
 *
 * @module validation
 *
 * @example
 * ```typescript
 * import { TimezoneSchema, DateTimeFormatSchema } from './validation.js';
 *
 * // Validate a timezone
 * const result = TimezoneSchema.safeParse('America/New_York');
 * if (result.success) {
 *   console.log('Valid timezone:', result.data);
 * }
 * ```
 */

import { z } from "zod";

/**
 * Schema for validating IANA timezone identifiers.
 *
 * Validates that the string is a valid timezone recognized by the
 * Intl.DateTimeFormat API. Provides a clear error message on validation failure.
 *
 * @example
 * ```typescript
 * TimezoneSchema.parse('America/New_York');  // ✓ Valid
 * TimezoneSchema.parse('Invalid/Zone');      // ✗ Throws validation error
 * ```
 */
export const TimezoneSchema = z
	.string()
	.describe("IANA timezone identifier (e.g., 'America/New_York', 'UTC')")
	.refine(
		(tz) => {
			try {
				Intl.DateTimeFormat(undefined, { timeZone: tz });
				return true;
			} catch {
				return false;
			}
		},
		{ message: "Invalid timezone identifier" },
	);

/**
 * Schema for datetime format validation.
 *
 * Defines the supported output formats for datetime values.
 * Defaults to "iso" if not specified.
 *
 * Supported formats:
 * - `iso` - ISO 8601 format (e.g., "2024-12-25T15:00:00.000Z")
 * - `rfc2822` - RFC 2822 format (e.g., "Wed, 25 Dec 2024 15:00:00 GMT")
 * - `http` - HTTP header format (e.g., "Wed, 25 Dec 2024 15:00:00 GMT")
 * - `sql` - SQL datetime format (e.g., "2024-12-25 15:00:00.000")
 * - `local` - Local string representation
 * - `localeString` - Locale-aware datetime string
 * - `short` - Short date format
 * - `medium` - Medium date format
 * - `long` - Long date format
 * - `full` - Full datetime format
 *
 * @example
 * ```typescript
 * DateTimeFormatSchema.parse('iso');      // ✓ Returns "iso"
 * DateTimeFormatSchema.parse('invalid');  // ✗ Throws validation error
 * ```
 */
export const DateTimeFormatSchema = z
	.enum([
		"iso",
		"rfc2822",
		"http",
		"sql",
		"local",
		"localeString",
		"short",
		"medium",
		"long",
		"full",
	])
	.default("iso")
	.describe("Output format for datetime");

/**
 * Schema for locale string validation.
 *
 * Validates locale identifiers for internationalization support.
 * Common values include 'en-US', 'fr-FR', 'de-DE', 'ja-JP', etc.
 *
 * @example
 * ```typescript
 * LocaleSchema.parse('en-US');  // ✓ Returns "en-US"
 * LocaleSchema.parse('fr-FR');  // ✓ Returns "fr-FR"
 * ```
 */
export const LocaleSchema = z
	.string()
	.optional()
	.describe("Locale for formatting (e.g., 'en-US', 'fr-FR')");

/**
 * Type inference helper for timezone values.
 *
 * @example
 * ```typescript
 * import type { Timezone } from './validation.js';
 *
 * function processTimezone(tz: Timezone): void {
 *   // tz is guaranteed to be a valid timezone string
 * }
 * ```
 */
export type Timezone = z.infer<typeof TimezoneSchema>;

/**
 * Type inference helper for datetime format values.
 *
 * @example
 * ```typescript
 * import type { DateTimeFormat } from './validation.js';
 *
 * function formatOutput(format: DateTimeFormat): string {
 *   // format is guaranteed to be a valid format enum value
 * }
 * ```
 */
export type DateTimeFormat = z.infer<typeof DateTimeFormatSchema>;

/**
 * Type inference helper for locale values.
 *
 * @example
 * ```typescript
 * import type { Locale } from './validation.js';
 *
 * function applyLocale(locale: Locale): void {
 *   // locale is string | undefined
 * }
 * ```
 */
export type Locale = z.infer<typeof LocaleSchema>;
