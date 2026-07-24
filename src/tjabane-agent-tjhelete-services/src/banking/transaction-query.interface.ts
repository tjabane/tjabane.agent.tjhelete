export interface TransactionQuery {
  readonly fromDate: string;
  readonly toDate: string;
  readonly transactionType?: string;
}
