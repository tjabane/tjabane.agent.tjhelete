export interface InvestecAccountDto {
  readonly accountId: string;
  readonly accountNumber: string;
  readonly accountName: string;
  readonly referenceName: string;
  readonly productName: string;
  readonly kycCompliant: boolean;
  readonly profileId: string;
  readonly profileName: string;
}

export interface InvestecAccountsResponseDto {
  readonly data: {
    readonly accounts: readonly InvestecAccountDto[];
  };
  readonly links: {
    readonly self: string;
  };
  readonly meta: {
    readonly totalPages: number;
  };
}
