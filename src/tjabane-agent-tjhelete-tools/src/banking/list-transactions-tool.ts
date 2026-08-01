import type {
  AgentTool,
  ToolDefinition,
  ToolExecutionContext,
  ToolResult,
} from "@tjabane-agent-tjhelete/agent";
import type { BankApiClient, TransactionQuery } from "@tjabane-agent-tjhelete/services";
import { Type, type Static } from "@sinclair/typebox";
import { createArgumentValidator } from "../schema/argument-validator.js";
import {
  executeBankingAction,
  normalizeAccountReferences,
  normalizeOptionalString,
  resolveAccounts,
} from "./tool-support.js";
import { invalidArguments } from "../tool-errors.js";

const defaultLimit = 10;

const inputSchema = Type.Object(
  {
    fromDate: Type.String({ format: "date" }),
    toDate: Type.String({ format: "date" }),
    accountReferences: Type.Optional(
      Type.Array(Type.String({ minLength: 1, pattern: "\\S" }), {
        minItems: 1,
        uniqueItems: true,
      }),
    ),
    transactionType: Type.Optional(Type.String({ minLength: 1, pattern: "\\S" })),
    limit: Type.Optional(Type.Integer({ minimum: 1, maximum: 50 })),
  },
  { additionalProperties: false },
);
type ListTransactionsArguments = Static<typeof inputSchema>;
const validateArguments = createArgumentValidator(inputSchema);

const definition: ToolDefinition = {
  name: "list_transactions",
  description:
    "List recent posted transactions for all authorised accounts or selected account references within an explicit date range.",
  inputSchema,
};

export class ListTransactionsTool implements AgentTool {
  public readonly definition = definition;

  public constructor(private readonly bankApiClient: BankApiClient) {}

  public async execute(_context: ToolExecutionContext, arguments_: unknown): Promise<ToolResult> {
    return executeBankingAction(async () => {
      const input = validateArguments(arguments_);
      const query = this.readQuery(input);
      const references = normalizeAccountReferences(input.accountReferences);
      const limit = input.limit ?? defaultLimit;
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

  private readQuery(input: ListTransactionsArguments): TransactionQuery {
    if (input.fromDate > input.toDate) {
      throw invalidArguments("fromDate must not be after toDate.");
    }

    const transactionType = normalizeOptionalString(input.transactionType);
    return {
      fromDate: input.fromDate,
      toDate: input.toDate,
      ...(transactionType === undefined ? {} : { transactionType }),
    };
  }
}
