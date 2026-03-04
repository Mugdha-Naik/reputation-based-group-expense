interface BalanceItem {
  userId: string;
  balance: number;
}

interface GeneratedSettlement {
  fromUser: string;
  toUser: string;
  amount: number;
}

const toCents = (value: number) => Math.round(value * 100);
const toAmount = (valueInCents: number) => Number((valueInCents / 100).toFixed(2));

export function generateSettlements(
  balances: BalanceItem[]
): GeneratedSettlement[] {
  const creditors = balances
    .filter((item) => item.balance > 0)
    .map((item) => ({
      userId: item.userId,
      amountInCents: toCents(item.balance),
    }))
    .filter((item) => item.amountInCents > 0)
    .sort((a, b) => b.amountInCents - a.amountInCents);

  const debtors = balances
    .filter((item) => item.balance < 0)
    .map((item) => ({
      userId: item.userId,
      amountInCents: Math.abs(toCents(item.balance)),
    }))
    .filter((item) => item.amountInCents > 0)
    .sort((a, b) => b.amountInCents - a.amountInCents);

  const settlements: GeneratedSettlement[] = [];

  let debtorIndex = 0;
  let creditorIndex = 0;

  while (debtorIndex < debtors.length && creditorIndex < creditors.length) {
    const debtor = debtors[debtorIndex];
    const creditor = creditors[creditorIndex];
    const transferInCents = Math.min(debtor.amountInCents, creditor.amountInCents);

    if (transferInCents > 0) {
      settlements.push({
        fromUser: debtor.userId,
        toUser: creditor.userId,
        amount: toAmount(transferInCents),
      });
    }

    debtor.amountInCents -= transferInCents;
    creditor.amountInCents -= transferInCents;

    if (debtor.amountInCents === 0) debtorIndex += 1;
    if (creditor.amountInCents === 0) creditorIndex += 1;
  }

  return settlements;
}

export type { BalanceItem, GeneratedSettlement };
