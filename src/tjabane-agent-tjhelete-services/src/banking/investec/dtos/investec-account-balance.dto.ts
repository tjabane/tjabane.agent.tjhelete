export interface InvestecAccountBalanceDto {
  readonly accountId: string;
  readonly currentBalance: number;
  readonly availableBalance: number;
  readonly budgetBalance: number;
  readonly straightBalance: number;
  readonly cashBalance: number;
  readonly currency: string;
}

export interface InvestecAccountBalanceResponseDto {
  readonly data: InvestecAccountBalanceDto;
  readonly links: {
    readonly self: string;
  };
  readonly meta: {
    readonly totalPages: number;
  };
}
