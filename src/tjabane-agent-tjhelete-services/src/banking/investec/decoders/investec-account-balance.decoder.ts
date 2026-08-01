import type { InvestecAccountBalanceResponseDto } from "../dtos/investec-account-balance.dto.js";
import { ProviderResponseValidationError } from "../errors/provider-response-validation-error.js";

type UnknownRecord = Record<string, unknown>;

export function decodeInvestecAccountBalanceResponse(
  body: unknown,
): InvestecAccountBalanceResponseDto {
  const response = readRecord(body, "response");
  const data = readRecord(response.data, "data");
  const links = readRecord(response.links, "links");
  const meta = readRecord(response.meta, "meta");
  const accountId = readNonEmptyString(data.accountId, "data.accountId");

  if (accountId.length > 30) {
    throw invalid("data.accountId", "must be no longer than 30 characters");
  }

  return {
    data: {
      accountId,
      currentBalance: readFiniteNumber(data.currentBalance, "data.currentBalance"),
      availableBalance: readFiniteNumber(data.availableBalance, "data.availableBalance"),
      budgetBalance: readFiniteNumber(data.budgetBalance, "data.budgetBalance"),
      straightBalance: readFiniteNumber(data.straightBalance, "data.straightBalance"),
      cashBalance: readFiniteNumber(data.cashBalance, "data.cashBalance"),
      currency: readNonEmptyString(data.currency, "data.currency"),
    },
    links: {
      self: readNonEmptyString(links.self, "links.self"),
    },
    meta: {
      totalPages: readNonNegativeInteger(meta.totalPages, "meta.totalPages"),
    },
  };
}

function readRecord(value: unknown, path: string): UnknownRecord {
  if (typeof value !== "object" || value === null || Array.isArray(value)) {
    throw invalid(path, "must be an object");
  }

  return value as UnknownRecord;
}

function readNonEmptyString(value: unknown, path: string): string {
  if (typeof value !== "string") {
    throw invalid(path, "must be a string");
  }

  if (value.trim().length === 0) {
    throw invalid(path, "must not be empty");
  }

  return value;
}

function readFiniteNumber(value: unknown, path: string): number {
  if (typeof value !== "number" || !Number.isFinite(value)) {
    throw invalid(path, "must be a finite number");
  }

  return value;
}

function readNonNegativeInteger(value: unknown, path: string): number {
  if (typeof value !== "number" || !Number.isInteger(value) || value < 0) {
    throw invalid(path, "must be a non-negative integer");
  }

  return value;
}

function invalid(path: string, reason: string): ProviderResponseValidationError {
  return new ProviderResponseValidationError(`${path} ${reason}.`);
}
