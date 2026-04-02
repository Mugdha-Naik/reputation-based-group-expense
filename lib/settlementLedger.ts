interface LedgerExpense {
  title: string;
  amount: number;
  paidBy: string;
  splitAmong: string[];
}

interface CompletedTransfer {
  fromUser: string;
  toUser: string;
  amount: number;
}

type BalanceMap = Record<string, number>;

const toCents = (value: number) => Math.round(value * 100);
const toAmount = (valueInCents: number) => Number((valueInCents / 100).toFixed(2));

function calculateLedgerBalances(
  expenses: LedgerExpense[],
  members: string[]
): BalanceMap {
  const balancesInCents: Record<string, number> = {};

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

    expense.splitAmong.forEach((memberId, index) => {
      if (!(memberId in balancesInCents)) {
        balancesInCents[memberId] = 0;
      }

      const memberShare = share + (index < remainder ? 1 : 0);
      balancesInCents[memberId] -= memberShare;
    });

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

export function buildOutstandingBalances(
  expenses: LedgerExpense[],
  members: string[],
  completedTransfers: CompletedTransfer[] = []
): BalanceMap {
  const rawBalances = calculateLedgerBalances(expenses, members);
  const balancesInCents: Record<string, number> = {};

  for (const memberId of members) {
    balancesInCents[memberId] = toCents(rawBalances[memberId] ?? 0);
  }

  for (const transfer of completedTransfers) {
    const amountInCents = toCents(transfer.amount);

    if (!(transfer.fromUser in balancesInCents)) {
      balancesInCents[transfer.fromUser] = 0;
    }
    if (!(transfer.toUser in balancesInCents)) {
      balancesInCents[transfer.toUser] = 0;
    }

    balancesInCents[transfer.fromUser] += amountInCents;
    balancesInCents[transfer.toUser] -= amountInCents;
  }

  const outstandingBalances: BalanceMap = {};
  for (const [memberId, valueInCents] of Object.entries(balancesInCents)) {
    outstandingBalances[memberId] = toAmount(valueInCents);
  }

  return outstandingBalances;
}

export type { LedgerExpense, CompletedTransfer, BalanceMap };
