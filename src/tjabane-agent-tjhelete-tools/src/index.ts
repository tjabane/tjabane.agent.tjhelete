import type { AgentTool } from "@tjabane-agent-tjhelete/agent";
import type { BankApiClient } from "@tjabane-agent-tjhelete/services";
import { GetAccountBalancesTool } from "./banking/get-account-balances-tool.js";
import { ListAccountsTool } from "./banking/list-accounts-tool.js";
import { ListTransactionsTool } from "./banking/list-transactions-tool.js";

export { GetAccountBalancesTool } from "./banking/get-account-balances-tool.js";
export { ListAccountsTool } from "./banking/list-accounts-tool.js";
export { ListTransactionsTool } from "./banking/list-transactions-tool.js";

export function createBankingTools(bankApiClient: BankApiClient): readonly AgentTool[] {
  return [
    new ListAccountsTool(bankApiClient),
    new GetAccountBalancesTool(bankApiClient),
    new ListTransactionsTool(bankApiClient),
  ];
}
