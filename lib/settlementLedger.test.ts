import assert from "node:assert/strict";
import test from "node:test";
import { buildOutstandingBalances } from "./settlementLedger.ts";

test("completed transfers reduce outstanding balances", () => {
  const balances = buildOutstandingBalances(
    [
      {
        title: "Dinner",
        amount: 300,
        paidBy: "m1",
        splitAmong: ["m1", "m2", "m3"],
      },
    ],
    ["m1", "m2", "m3"],
    [{ fromUser: "m2", toUser: "m1", amount: 100 }]
  );

  assert.deepEqual(balances, { m1: 100, m2: 0, m3: -100 });
});

test("new expenses rebuild net obligations after prior completed payments", () => {
  const balances = buildOutstandingBalances(
    [
      {
        title: "Dinner",
        amount: 300,
        paidBy: "m1",
        splitAmong: ["m1", "m2", "m3"],
      },
      {
        title: "Cab",
        amount: 120,
        paidBy: "m2",
        splitAmong: ["m1", "m2", "m3"],
      },
    ],
    ["m1", "m2", "m3"],
    [{ fromUser: "m3", toUser: "m1", amount: 100 }]
  );

  assert.deepEqual(balances, { m1: 60, m2: -20, m3: -40 });
});
