import type { BankAccountBalance } from "./bank-account-balance.interface.js";
import type { BankAccount } from "./bank-account.interface.js";
import type { Transaction } from "./transaction.interface.js";
import type { TransactionQuery } from "./transaction-query.interface.js";

export interface BankApiClient {
  getAccounts(): Promise<readonly BankAccount[]>;
  getAccountBalance(accountId: string): Promise<BankAccountBalance>;
  getTransactions(accountId: string, query: TransactionQuery): Promise<readonly Transaction[]>;
}
