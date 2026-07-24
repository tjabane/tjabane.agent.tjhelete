import type {
  InvestecPostedTransactionDto,
  InvestecTransactionsResponseDto,
} from "./investec-transaction.dto.js";
import { ProviderResponseValidationError } from "./provider-response-validation-error.js";

type UnknownRecord = Record<string, unknown>;

export function decodeInvestecTransactionResponse(body: unknown): InvestecTransactionsResponseDto {
  const response = readRecord(body, "response");
  const data = readRecord(response.data, "data");
  const transactions = readArray(data.transactions, "data.transactions").map((transaction, index) =>
    decodeTransaction(transaction, `data.transactions[${index}]`),
  );
  const links = readRecord(response.links, "links");
  const meta = readRecord(response.meta, "meta");
  const totalPages = readNonNegativeInteger(meta.totalPages, "meta.totalPages");

  return {
    data: { transactions },
    links: {
      self: readNonEmptyString(links.self, "links.self"),
    },
    meta: { totalPages },
  };
}

export function isIsoCalendarDate(value: string): boolean {
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

function decodeTransaction(value: unknown, path: string): InvestecPostedTransactionDto {
  const transaction = readRecord(value, path);

  return {
    accountId: readNonEmptyString(transaction.accountId, `${path}.accountId`),
    type: readTransactionDirection(transaction.type, `${path}.type`),
    transactionType: readNonEmptyString(transaction.transactionType, `${path}.transactionType`),
    status: readPostedStatus(transaction.status, `${path}.status`),
    description: readString(transaction.description, `${path}.description`),
    cardNumber: readString(transaction.cardNumber, `${path}.cardNumber`),
    postedOrder: readFiniteNumber(transaction.postedOrder, `${path}.postedOrder`),
    postingDate: readCalendarDate(transaction.postingDate, `${path}.postingDate`),
    valueDate: readCalendarDate(transaction.valueDate, `${path}.valueDate`),
    actionDate: readCalendarDate(transaction.actionDate, `${path}.actionDate`),
    transactionDate: readCalendarDate(transaction.transactionDate, `${path}.transactionDate`),
    amount: readFiniteNumber(transaction.amount, `${path}.amount`),
    runningBalance: readFiniteNumber(transaction.runningBalance, `${path}.runningBalance`),
    uuid: readNonEmptyString(transaction.uuid, `${path}.uuid`),
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

function readString(value: unknown, path: string): string {
  if (typeof value !== "string") {
    throw invalid(path, "must be a string");
  }

  return value;
}

function readNonEmptyString(value: unknown, path: string): string {
  const stringValue = readString(value, path);

  if (stringValue.trim().length === 0) {
    throw invalid(path, "must not be empty");
  }

  return stringValue;
}

function readFiniteNumber(value: unknown, path: string): number {
  if (typeof value !== "number" || !Number.isFinite(value)) {
    throw invalid(path, "must be a finite number");
  }

  return value;
}

function readNonNegativeInteger(value: unknown, path: string): number {
  const numberValue = readFiniteNumber(value, path);

  if (!Number.isInteger(numberValue) || numberValue < 0) {
    throw invalid(path, "must be a non-negative integer");
  }

  return numberValue;
}

function readCalendarDate(value: unknown, path: string): string {
  const date = readString(value, path);

  if (!isIsoCalendarDate(date)) {
    throw invalid(path, "must be a valid calendar date in YYYY-MM-DD format");
  }

  return date;
}

function readTransactionDirection(value: unknown, path: string): "DEBIT" | "CREDIT" {
  if (value !== "DEBIT" && value !== "CREDIT") {
    throw invalid(path, 'must be either "DEBIT" or "CREDIT"');
  }

  return value;
}

function readPostedStatus(value: unknown, path: string): "POSTED" {
  if (value !== "POSTED") {
    throw invalid(path, 'must be "POSTED"');
  }

  return value;
}

function isLeapYear(year: number): boolean {
  return year % 4 === 0 && (year % 100 !== 0 || year % 400 === 0);
}

function invalid(path: string, reason: string): ProviderResponseValidationError {
  return new ProviderResponseValidationError(`${path} ${reason}.`);
}
