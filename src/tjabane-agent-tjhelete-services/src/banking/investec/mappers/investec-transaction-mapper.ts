import type { Transaction } from "../../transaction.interface.js";
import type { InvestecPostedTransactionDto } from "../dtos/investec-transaction.dto.js";

export function mapInvestecTransaction(dto: InvestecPostedTransactionDto): Transaction {
  return {
    id: dto.uuid,
    accountId: dto.accountId,
    direction: dto.type === "DEBIT" ? "debit" : "credit",
    transactionType: dto.transactionType,
    description: dto.description,
    postingDate: dto.postingDate,
    transactionDate: dto.transactionDate,
    amount: dto.amount,
  };
}
