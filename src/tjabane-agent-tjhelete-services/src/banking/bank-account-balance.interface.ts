export interface BankAccountBalance {
  readonly accountId: string;
  readonly currentBalance: number;
  readonly availableBalance: number;
  readonly budgetBalance: number;
  readonly straightBalance: number;
  readonly cashBalance: number;
  readonly currency: string;
}
