import type {
  AgentTool,
  ToolDefinition,
  ToolExecutionContext,
  ToolResult,
} from "@tjabane-agent-tjhelete/agent";
import type { BankApiClient } from "@tjabane-agent-tjhelete/services";
import { executeBankingAction, readArguments } from "./tool-support.js";

const definition: ToolDefinition = {
  name: "list_accounts",
  description:
    "List the user's authorised bank accounts using safe reference and product names. Call this when account-specific context is needed.",
  inputSchema: {
    type: "object",
    properties: {},
    additionalProperties: false,
  },
};

export class ListAccountsTool implements AgentTool {
  public readonly definition = definition;

  public constructor(private readonly bankApiClient: BankApiClient) {}

  public async execute(_context: ToolExecutionContext, arguments_: unknown): Promise<ToolResult> {
    return executeBankingAction(async () => {
      readArguments(arguments_, []);
      const accounts = await this.bankApiClient.getAccounts();

      return {
        accounts: accounts.map((account) => ({
          referenceName: account.referenceName,
          productName: account.productName,
        })),
      };
    });
  }
}
