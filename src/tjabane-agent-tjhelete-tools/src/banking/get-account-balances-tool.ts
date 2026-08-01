import type {
  AgentTool,
  ToolDefinition,
  ToolExecutionContext,
  ToolResult,
} from "@tjabane-agent-tjhelete/agent";
import type { BankApiClient } from "@tjabane-agent-tjhelete/services";
import {
  executeBankingAction,
  readAccountReferences,
  readArguments,
  resolveAccounts,
} from "./tool-support.js";

const definition: ToolDefinition = {
  name: "get_account_balances",
  description:
    "Get balances for all authorised accounts or selected accounts named by reference. Omit accountReferences to include every account.",
  inputSchema: {
    type: "object",
    properties: {
      accountReferences: {
        type: "array",
        items: { type: "string", minLength: 1 },
        minItems: 1,
        uniqueItems: true,
      },
    },
    additionalProperties: false,
  },
};

export class GetAccountBalancesTool implements AgentTool {
  public readonly definition = definition;

  public constructor(private readonly bankApiClient: BankApiClient) {}

  public async execute(_context: ToolExecutionContext, arguments_: unknown): Promise<ToolResult> {
    return executeBankingAction(async () => {
      const input = readArguments(arguments_, ["accountReferences"]);
      const references = readAccountReferences(input.accountReferences);
      const accounts = await resolveAccounts(this.bankApiClient, references);
      const balances = await Promise.all(
        accounts.map((account) => this.bankApiClient.getAccountBalance(account.id)),
      );

      return {
        accounts: accounts.map((account, index) => {
          const balance = balances[index]!;
          return {
            referenceName: account.referenceName,
            productName: account.productName,
            currentBalance: balance.currentBalance,
            availableBalance: balance.availableBalance,
            budgetBalance: balance.budgetBalance,
            straightBalance: balance.straightBalance,
            cashBalance: balance.cashBalance,
            currency: balance.currency,
          };
        }),
      };
    });
  }
}
