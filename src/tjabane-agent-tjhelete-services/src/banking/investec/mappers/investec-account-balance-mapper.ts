import type { BankAccountBalance } from "../../bank-account-balance.interface.js";
import type { InvestecAccountBalanceDto } from "../dtos/investec-account-balance.dto.js";

export function mapInvestecAccountBalance(dto: InvestecAccountBalanceDto): BankAccountBalance {
  return {
    accountId: dto.accountId,
    currentBalance: dto.currentBalance,
    availableBalance: dto.availableBalance,
    budgetBalance: dto.budgetBalance,
    straightBalance: dto.straightBalance,
    cashBalance: dto.cashBalance,
    currency: dto.currency,
  };
}
