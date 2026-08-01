import type { ToolResult } from "@tjabane-agent-tjhelete/agent";
import type { BankAccount, BankApiClient } from "@tjabane-agent-tjhelete/services";

type UnknownRecord = Record<string, unknown>;

export class ControlledToolError extends Error {
  public constructor(
    public readonly code: string,
    message: string,
  ) {
    super(message);
    this.name = new.target.name;
  }
}

export async function executeBankingAction(
  action: () => Promise<Readonly<Record<string, unknown>>>,
): Promise<ToolResult> {
  try {
    return { ok: true, data: await action() };
  } catch (error) {
    if (error instanceof ControlledToolError) {
      return {
        ok: false,
        error: {
          code: error.code,
          message: error.message,
          retryable: false,
        },
      };
    }

    return {
      ok: false,
      error: {
        code: "banking_unavailable",
        message: "Banking information is temporarily unavailable.",
        retryable: true,
      },
    };
  }
}

export function readArguments(value: unknown, allowedProperties: readonly string[]): UnknownRecord {
  if (typeof value !== "object" || value === null || Array.isArray(value)) {
    throw invalidArguments("Tool arguments must be an object.");
  }

  const arguments_ = value as UnknownRecord;
  const unsupportedProperty = Object.keys(arguments_).find(
    (property) => !allowedProperties.includes(property),
  );

  if (unsupportedProperty !== undefined) {
    throw invalidArguments(`Unsupported argument "${unsupportedProperty}".`);
  }

  return arguments_;
}

export function readAccountReferences(value: unknown): readonly string[] | undefined {
  if (value === undefined) {
    return undefined;
  }

  if (!Array.isArray(value) || value.length === 0) {
    throw invalidArguments("accountReferences must be a non-empty array when supplied.");
  }

  const references = value.map((reference) => {
    if (typeof reference !== "string" || reference.trim().length === 0) {
      throw invalidArguments("Each account reference must be a non-empty string.");
    }

    return reference.trim();
  });

  if (new Set(references.map(normalizeReference)).size !== references.length) {
    throw invalidArguments("accountReferences must not contain duplicates.");
  }

  return references;
}

export async function resolveAccounts(
  bankApiClient: BankApiClient,
  references: readonly string[] | undefined,
): Promise<readonly BankAccount[]> {
  const accounts = await bankApiClient.getAccounts();

  if (references === undefined) {
    return accounts;
  }

  return references.map((reference) => {
    const normalizedReference = normalizeReference(reference);
    const matches = accounts.filter(
      (account) => normalizeReference(account.referenceName) === normalizedReference,
    );

    if (matches.length === 0) {
      throw new ControlledToolError(
        "account_not_found",
        `No authorised account matches the reference "${reference}".`,
      );
    }

    if (matches.length > 1) {
      throw new ControlledToolError(
        "ambiguous_account_reference",
        `More than one authorised account matches the reference "${reference}".`,
      );
    }

    return matches[0]!;
  });
}

export function readRequiredDate(arguments_: UnknownRecord, property: string): string {
  const value = arguments_[property];

  if (typeof value !== "string" || !isIsoCalendarDate(value)) {
    throw invalidArguments(`${property} must be a valid calendar date in YYYY-MM-DD format.`);
  }

  return value;
}

export function readOptionalTrimmedString(value: unknown, property: string): string | undefined {
  if (value === undefined) {
    return undefined;
  }

  if (typeof value !== "string" || value.trim().length === 0) {
    throw invalidArguments(`${property} must be a non-empty string when supplied.`);
  }

  return value.trim();
}

export function readLimit(value: unknown, defaultValue: number): number {
  if (value === undefined) {
    return defaultValue;
  }

  if (typeof value !== "number" || !Number.isInteger(value) || value < 1 || value > 50) {
    throw invalidArguments("limit must be an integer from 1 to 50.");
  }

  return value;
}

export function invalidArguments(message: string): ControlledToolError {
  return new ControlledToolError("invalid_arguments", message);
}

function normalizeReference(value: string): string {
  return value.trim().toLocaleLowerCase("en-ZA");
}

function isIsoCalendarDate(value: string): boolean {
  const match = /^(\d{4})-(\d{2})-(\d{2})$/.exec(value);

  if (match === null) {
    return false;
  }

  const year = Number(match[1]);
  const month = Number(match[2]);
  const day = Number(match[3]);

  if (month < 1 || month > 12 || day < 1) {
    return false;
  }

  const daysInMonth = [31, isLeapYear(year) ? 29 : 28, 31, 30, 31, 30, 31, 31, 30, 31, 30, 31];
  return day <= daysInMonth[month - 1]!;
}

function isLeapYear(year: number): boolean {
  return year % 4 === 0 && (year % 100 !== 0 || year % 400 === 0);
}
