import type {
  InvestecAccountDto,
  InvestecAccountsResponseDto,
} from "../dtos/investec-account.dto.js";
import { ProviderResponseValidationError } from "../errors/provider-response-validation-error.js";

type UnknownRecord = Record<string, unknown>;

export function decodeInvestecAccountsResponse(body: unknown): InvestecAccountsResponseDto {
  const response = readRecord(body, "response");
  const data = readRecord(response.data, "data");
  const accounts = readArray(data.accounts, "data.accounts").map((account, index) =>
    decodeAccount(account, `data.accounts[${index}]`),
  );
  const links = readRecord(response.links, "links");
  const meta = readRecord(response.meta, "meta");

  return {
    data: { accounts },
    links: {
      self: readNonEmptyString(links.self, "links.self"),
    },
    meta: {
      totalPages: readNonNegativeInteger(meta.totalPages, "meta.totalPages"),
    },
  };
}

function decodeAccount(value: unknown, path: string): InvestecAccountDto {
  const account = readRecord(value, path);
  const accountId = readNonEmptyString(account.accountId, `${path}.accountId`);

  if (accountId.length > 30) {
    throw invalid(`${path}.accountId`, "must be no longer than 30 characters");
  }

  return {
    accountId,
    accountNumber: readNonEmptyString(account.accountNumber, `${path}.accountNumber`),
    accountName: readNonEmptyString(account.accountName, `${path}.accountName`),
    referenceName: readNonEmptyString(account.referenceName, `${path}.referenceName`),
    productName: readNonEmptyString(account.productName, `${path}.productName`),
    kycCompliant: readBoolean(account.kycCompliant, `${path}.kycCompliant`),
    profileId: readNonEmptyString(account.profileId, `${path}.profileId`),
    profileName: readNonEmptyString(account.profileName, `${path}.profileName`),
  };
}

function readRecord(value: unknown, path: string): UnknownRecord {
  if (typeof value !== "object" || value === null || Array.isArray(value)) {
    throw invalid(path, "must be an object");
  }

  return value as UnknownRecord;
}

function readArray(value: unknown, path: string): readonly unknown[] {
  if (!Array.isArray(value)) {
    throw invalid(path, "must be an array");
  }

  return value;
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

function readBoolean(value: unknown, path: string): boolean {
  if (typeof value !== "boolean") {
    throw invalid(path, "must be a boolean");
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
