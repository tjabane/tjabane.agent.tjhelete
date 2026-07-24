export interface InvestecPostedTransactionDto {
  readonly accountId: string;
  readonly type: "DEBIT" | "CREDIT";
  readonly transactionType: string;
  readonly status: "POSTED";
  readonly description: string;
  readonly cardNumber: string;
  readonly postedOrder: number;
  readonly postingDate: string;
  readonly valueDate: string;
  readonly actionDate: string;
  readonly transactionDate: string;
  readonly amount: number;
  readonly runningBalance: number;
  readonly uuid: string;
}

export interface InvestecTransactionsResponseDto {
  readonly data: {
    readonly transactions: readonly InvestecPostedTransactionDto[];
  };
  readonly links: {
    readonly self: string;
  };
  readonly meta: {
    readonly totalPages: number;
  };
}
