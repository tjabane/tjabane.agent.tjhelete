import type {
  AgentTool,
  ToolDefinition,
  ToolExecutionContext,
  ToolResult,
} from "@tjabane-agent-tjhelete/agent";
import type { BankApiClient } from "@tjabane-agent-tjhelete/services";
import { Type } from "@sinclair/typebox";
import { createArgumentValidator } from "../schema/argument-validator.js";
import { executeBankingAction } from "./tool-support.js";

const inputSchema = Type.Object({}, { additionalProperties: false });
const validateArguments = createArgumentValidator(inputSchema);

const definition: ToolDefinition = {
  name: "list_accounts",
  description:
    "List the user's authorised bank accounts using safe reference and product names. Call this when account-specific context is needed.",
  inputSchema,
};

export class ListAccountsTool implements AgentTool {
  public readonly definition = definition;

  public constructor(private readonly bankApiClient: BankApiClient) {}

  public async execute(_context: ToolExecutionContext, arguments_: unknown): Promise<ToolResult> {
    return executeBankingAction(async () => {
      validateArguments(arguments_);
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
