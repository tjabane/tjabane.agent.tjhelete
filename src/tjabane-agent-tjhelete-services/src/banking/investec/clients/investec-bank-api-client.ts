import type { BankApiClient } from "../../bank-api-client.interface.js";
import type { BankAccountBalance } from "../../bank-account-balance.interface.js";
import type { BankAccount } from "../../bank-account.interface.js";
import type { Transaction } from "../../transaction.interface.js";
import type { TransactionQuery } from "../../transaction-query.interface.js";
import type { HttpClient } from "../../../http/http-client.interface.js";
import type { InvestecAccessTokenProvider } from "../auth/investec-access-token-provider.interface.js";
import { decodeInvestecAccountBalanceResponse } from "../decoders/investec-account-balance.decoder.js";
import { decodeInvestecAccountsResponse } from "../decoders/investec-account.decoder.js";
import {
  decodeInvestecTransactionResponse,
  isIsoCalendarDate,
} from "../decoders/investec-transaction.decoder.js";
import { ProviderResponseValidationError } from "../errors/provider-response-validation-error.js";
import { mapInvestecAccountBalance } from "../mappers/investec-account-balance-mapper.js";
import { mapInvestecAccount } from "../mappers/investec-account-mapper.js";
import { mapInvestecTransaction } from "../mappers/investec-transaction-mapper.js";

export class InvestecBankApiClient implements BankApiClient {
  public constructor(
    private readonly httpClient: HttpClient,
    private readonly accessTokens: InvestecAccessTokenProvider,
    private readonly baseUrl: URL,
    private readonly requestTimeoutMs = 10_000,
  ) {
    if (!Number.isFinite(this.requestTimeoutMs) || this.requestTimeoutMs <= 0) {
      throw new RangeError("Investec request timeout must be a positive finite number.");
    }
  }

  public async getAccounts(): Promise<readonly BankAccount[]> {
    const accessToken = await this.accessTokens.getAccessToken();
    const response = await this.httpClient.request({
      method: "GET",
      url: new URL("/za/pb/v1/accounts", this.baseUrl),
      headers: {
        Accept: "application/json",
        Authorization: `Bearer ${accessToken}`,
      },
      timeoutMs: this.requestTimeoutMs,
    });
    const dto = decodeInvestecAccountsResponse(response.body);

    this.rejectIncompletePage(dto.meta.totalPages);

    return dto.data.accounts.map(mapInvestecAccount);
  }

  public async getAccountBalance(accountId: string): Promise<BankAccountBalance> {
    this.validateAccountId(accountId);

    const accessToken = await this.accessTokens.getAccessToken();
    const response = await this.httpClient.request({
      method: "GET",
      url: new URL(`/za/pb/v1/accounts/${encodeURIComponent(accountId)}/balance`, this.baseUrl),
      headers: {
        Accept: "application/json",
        Authorization: `Bearer ${accessToken}`,
      },
      timeoutMs: this.requestTimeoutMs,
    });
    const dto = decodeInvestecAccountBalanceResponse(response.body);

    this.rejectIncompletePage(dto.meta.totalPages);

    if (dto.data.accountId !== accountId) {
      throw new ProviderResponseValidationError(
        "data.accountId does not match the requested account.",
      );
    }

    return mapInvestecAccountBalance(dto.data);
  }

  public async getTransactions(
    accountId: string,
    query: TransactionQuery,
  ): Promise<readonly Transaction[]> {
    this.validateAccountId(accountId);
    this.validateQuery(query);

    const accessToken = await this.accessTokens.getAccessToken();
    const response = await this.httpClient.request({
      method: "GET",
      url: this.createTransactionsUrl(accountId, query),
      headers: {
        Accept: "application/json",
        Authorization: `Bearer ${accessToken}`,
      },
      timeoutMs: this.requestTimeoutMs,
    });
    const dto = decodeInvestecTransactionResponse(response.body);

    this.rejectIncompletePage(dto.meta.totalPages);

    for (const [index, transaction] of dto.data.transactions.entries()) {
      if (transaction.accountId !== accountId) {
        throw new ProviderResponseValidationError(
          `data.transactions[${index}].accountId does not match the requested account.`,
        );
      }
    }

    return dto.data.transactions.map(mapInvestecTransaction);
  }

  private createTransactionsUrl(accountId: string, query: TransactionQuery): URL {
    const url = new URL(
      `/za/pb/v1/accounts/${encodeURIComponent(accountId)}/transactions`,
      this.baseUrl,
    );

    url.searchParams.set("fromDate", query.fromDate);
    url.searchParams.set("toDate", query.toDate);

    if (query.transactionType !== undefined) {
      url.searchParams.set("transactionType", query.transactionType);
    }

    return url;
  }

  private validateAccountId(accountId: string): void {
    if (accountId.length === 0 || accountId.length > 30 || accountId !== accountId.trim()) {
      throw new TypeError(
        "Investec account ID must be non-empty, trimmed, and no longer than 30 characters.",
      );
    }
  }

  private rejectIncompletePage(totalPages: number): void {
    if (totalPages > 1) {
      throw new ProviderResponseValidationError(
        "meta.totalPages is greater than one, but the documented Private Bank API provides no page request parameter.",
      );
    }
  }

  private validateQuery(query: TransactionQuery): void {
    if (!isIsoCalendarDate(query.fromDate)) {
      throw new TypeError(
        "Transaction fromDate must be a valid calendar date in YYYY-MM-DD format.",
      );
    }

    if (!isIsoCalendarDate(query.toDate)) {
      throw new TypeError("Transaction toDate must be a valid calendar date in YYYY-MM-DD format.");
    }

    if (query.fromDate > query.toDate) {
      throw new RangeError("Transaction fromDate must not be after transaction toDate.");
    }

    if (
      query.transactionType !== undefined &&
      (query.transactionType.trim().length === 0 ||
        query.transactionType !== query.transactionType.trim())
    ) {
      throw new TypeError("Transaction type must be a non-empty, trimmed string when supplied.");
    }
  }
}
