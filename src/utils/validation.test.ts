import { describe, expect, it } from "vitest";
import {
	DateTimeFormatSchema,
	LocaleSchema,
	TimezoneSchema,
} from "./validation.js";

describe("validation schemas", () => {
	describe("TimezoneSchema", () => {
		it("should validate valid timezones", () => {
			const result1 = TimezoneSchema.safeParse("UTC");
			expect(result1.success).toBe(true);

			const result2 = TimezoneSchema.safeParse("America/New_York");
			expect(result2.success).toBe(true);

			const result3 = TimezoneSchema.safeParse("Europe/London");
			expect(result3.success).toBe(true);

			const result4 = TimezoneSchema.safeParse("Asia/Tokyo");
			expect(result4.success).toBe(true);
		});

		it("should reject invalid timezones", () => {
			const result1 = TimezoneSchema.safeParse("Invalid/Timezone");
			expect(result1.success).toBe(false);

			const result2 = TimezoneSchema.safeParse("NotAZone");
			expect(result2.success).toBe(false);

			const result3 = TimezoneSchema.safeParse("");
			expect(result3.success).toBe(false);
		});

		it("should provide helpful error message", () => {
			const result = TimezoneSchema.safeParse("Invalid/Timezone");
			if (!result.success) {
				// Zod 4 uses 'issues' instead of 'errors'
				const issues = result.error.issues || [];
				expect(issues[0]?.message).toBe("Invalid timezone identifier");
			}
		});
	});

	describe("DateTimeFormatSchema", () => {
		it("should validate all supported formats", () => {
			const formats = [
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
			];

			for (const format of formats) {
				const result = DateTimeFormatSchema.safeParse(format);
				expect(result.success).toBe(true);
			}
		});

		it("should reject invalid formats", () => {
			const result1 = DateTimeFormatSchema.safeParse("invalid");
			expect(result1.success).toBe(false);

			const result2 = DateTimeFormatSchema.safeParse("ISO"); // case sensitive
			expect(result2.success).toBe(false);

			const result3 = DateTimeFormatSchema.safeParse("");
			expect(result3.success).toBe(false);
		});

		it("should default to 'iso' when not specified", () => {
			const result = DateTimeFormatSchema.safeParse(undefined);
			expect(result.success).toBe(true);
			if (result.success) {
				expect(result.data).toBe("iso");
			}
		});
	});

	describe("LocaleSchema", () => {
		it("should validate locale strings", () => {
			const result1 = LocaleSchema.safeParse("en-US");
			expect(result1.success).toBe(true);

			const result2 = LocaleSchema.safeParse("fr-FR");
			expect(result2.success).toBe(true);

			const result3 = LocaleSchema.safeParse("de-DE");
			expect(result3.success).toBe(true);

			const result4 = LocaleSchema.safeParse("ja-JP");
			expect(result4.success).toBe(true);
		});

		it("should allow undefined (optional)", () => {
			const result = LocaleSchema.safeParse(undefined);
			expect(result.success).toBe(true);
			if (result.success) {
				expect(result.data).toBeUndefined();
			}
		});

		it("should allow any string value", () => {
			// LocaleSchema doesn't actually validate locale validity,
			// just that it's a string or undefined
			const result = LocaleSchema.safeParse("any-string");
			expect(result.success).toBe(true);
		});
	});
});
