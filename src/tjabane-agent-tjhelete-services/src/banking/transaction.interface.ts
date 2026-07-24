export interface Transaction {
  readonly id: string;
  readonly accountId: string;
  readonly direction: "debit" | "credit";
  readonly transactionType: string;
  readonly description: string;
  readonly postingDate: string;
  readonly transactionDate: string;
  readonly amount: number;
}
