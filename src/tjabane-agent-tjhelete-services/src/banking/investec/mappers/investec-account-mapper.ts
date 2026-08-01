import type { BankAccount } from "../../bank-account.interface.js";
import type { InvestecAccountDto } from "../dtos/investec-account.dto.js";

export function mapInvestecAccount(dto: InvestecAccountDto): BankAccount {
  return {
    id: dto.accountId,
    referenceName: dto.referenceName,
    productName: dto.productName,
  };
}
