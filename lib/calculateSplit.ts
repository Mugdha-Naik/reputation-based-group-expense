interface SplitExpense {
  title: string;
  amount: number;
  paidBy: string;
  splitAmong: string[];
}

type MemberId = string;
type BalanceMap = Record<MemberId, number>;

const toCents = (value: number) => Math.round(value * 100);
const toAmount = (valueInCents: number) => Number((valueInCents / 100).toFixed(2));

export function calculateSplit(
  expenses: SplitExpense[],
  members: MemberId[]
): BalanceMap {
  const balancesInCents: Record<MemberId, number> = {};

  for (const memberId of members) {
    balancesInCents[memberId] = 0;
  }

  for (const expense of expenses) {
    if (!expense || typeof expense.amount !== "number" || expense.amount <= 0) {
      throw new Error("Each expense must have an amount greater than 0");
    }

    if (!expense.paidBy || typeof expense.paidBy !== "string") {
      throw new Error("Each expense must have a valid paidBy member id");
    }

    if (!Array.isArray(expense.splitAmong) || expense.splitAmong.length === 0) {
      throw new Error("Each expense must include at least one member in splitAmong");
    }

    const amountInCents = toCents(expense.amount);
    const peopleCount = expense.splitAmong.length;
    const share = Math.floor(amountInCents / peopleCount);
    const remainder = amountInCents % peopleCount;

    // Debit each member's share.
    expense.splitAmong.forEach((memberId, index) => {
      if (!(memberId in balancesInCents)) {
        balancesInCents[memberId] = 0;
      }

      const memberShare = share + (index < remainder ? 1 : 0);
      balancesInCents[memberId] -= memberShare;
    });

    // Credit the full paid amount to the payer.
    if (!(expense.paidBy in balancesInCents)) {
      balancesInCents[expense.paidBy] = 0;
    }
    balancesInCents[expense.paidBy] += amountInCents;
  }

  const balances: BalanceMap = {};
  for (const [memberId, cents] of Object.entries(balancesInCents)) {
    balances[memberId] = toAmount(cents);
  }

  return balances;
}

// Example usage:
// const expenses = [
//   { title: "Dinner", amount: 300, paidBy: "m1", splitAmong: ["m1", "m2", "m3"] },
// ];
// const members = ["m1", "m2", "m3"];
// const result = calculateSplit(expenses, members);
// result => { m1: 200, m2: -100, m3: -100 }
