import type { Transaction } from "./transaction.interface.js";
import type { TransactionQuery } from "./transaction-query.interface.js";

export interface BankApiClient {
  getTransactions(accountId: string, query: TransactionQuery): Promise<readonly Transaction[]>;
}
