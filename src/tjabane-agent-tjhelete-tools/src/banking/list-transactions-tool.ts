import type {
  AgentTool,
  ToolDefinition,
  ToolExecutionContext,
  ToolResult,
} from "@tjabane-agent-tjhelete/agent";
import type { BankApiClient, TransactionQuery } from "@tjabane-agent-tjhelete/services";
import {
  executeBankingAction,
  invalidArguments,
  readAccountReferences,
  readArguments,
  readLimit,
  readOptionalTrimmedString,
  readRequiredDate,
  resolveAccounts,
} from "./tool-support.js";

const defaultLimit = 10;

const definition: ToolDefinition = {
  name: "list_transactions",
  description:
    "List recent posted transactions for all authorised accounts or selected account references within an explicit date range.",
  inputSchema: {
    type: "object",
    properties: {
      fromDate: { type: "string", format: "date" },
      toDate: { type: "string", format: "date" },
      accountReferences: {
        type: "array",
        items: { type: "string", minLength: 1 },
        minItems: 1,
        uniqueItems: true,
      },
      transactionType: { type: "string", minLength: 1 },
      limit: { type: "integer", minimum: 1, maximum: 50 },
    },
    required: ["fromDate", "toDate"],
    additionalProperties: false,
  },
};

export class ListTransactionsTool implements AgentTool {
  public readonly definition = definition;

  public constructor(private readonly bankApiClient: BankApiClient) {}

  public async execute(_context: ToolExecutionContext, arguments_: unknown): Promise<ToolResult> {
    return executeBankingAction(async () => {
      const input = readArguments(arguments_, [
        "fromDate",
        "toDate",
        "accountReferences",
        "transactionType",
        "limit",
      ]);
      const query = this.readQuery(input);
      const references = readAccountReferences(input.accountReferences);
      const limit = readLimit(input.limit, defaultLimit);
      const accounts = await resolveAccounts(this.bankApiClient, references);
      const accountResults = await Promise.all(
        accounts.map(async (account) => {
          const [transactions, balance] = await Promise.all([
            this.bankApiClient.getTransactions(account.id, query),
            this.bankApiClient.getAccountBalance(account.id),
          ]);
          return { account, transactions, currency: balance.currency };
        }),
      );
      const transactions = accountResults
        .flatMap(({ account, transactions: accountTransactions, currency }) =>
          accountTransactions.map((transaction) => ({
            id: transaction.id,
            referenceName: account.referenceName,
            description: transaction.description,
            direction: transaction.direction,
            transactionType: transaction.transactionType,
            postingDate: transaction.postingDate,
            transactionDate: transaction.transactionDate,
            amount: transaction.amount,
            currency,
          })),
        )
        .sort(
          (left, right) =>
            right.postingDate.localeCompare(left.postingDate) ||
            right.transactionDate.localeCompare(left.transactionDate) ||
            right.id.localeCompare(left.id),
        );

      return {
        transactions: transactions
          .slice(0, limit)
          .map(({ id: _id, ...transaction }) => transaction),
        truncated: transactions.length > limit,
      };
    });
  }

  private readQuery(input: Record<string, unknown>): TransactionQuery {
    const fromDate = readRequiredDate(input, "fromDate");
    const toDate = readRequiredDate(input, "toDate");

    if (fromDate > toDate) {
      throw invalidArguments("fromDate must not be after toDate.");
    }

    const transactionType = readOptionalTrimmedString(input.transactionType, "transactionType");
    return {
      fromDate,
      toDate,
      ...(transactionType === undefined ? {} : { transactionType }),
    };
  }
}
