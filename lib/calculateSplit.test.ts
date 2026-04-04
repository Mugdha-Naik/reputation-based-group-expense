import assert from "node:assert/strict";
import test from "node:test";
import { calculateSplit } from "./calculateSplit.ts";

test("calculateSplit returns correct balances for equal split", () => {
  const expenses = [
    {
      title: "Dinner",
      amount: 300,
      paidBy: "m1",
      splitAmong: ["m1", "m2", "m3"],
    },
  ];
  const members = ["m1", "m2", "m3"];

  const result = calculateSplit(expenses, members);

  assert.deepEqual(result, { m1: 200, m2: -100, m3: -100 });
});

test("calculateSplit handles multiple expenses", () => {
  const expenses = [
    {
      title: "Dinner",
      amount: 120,
      paidBy: "m1",
      splitAmong: ["m1", "m2", "m3"],
    },
    {
      title: "Cab",
      amount: 60,
      paidBy: "m2",
      splitAmong: ["m1", "m2"],
    },
  ];
  const members = ["m1", "m2", "m3"];

  const result = calculateSplit(expenses, members);

  assert.deepEqual(result, { m1: 50, m2: -10, m3: -40 });
});

test("calculateSplit handles rounding safely", () => {
  const expenses = [
    {
      title: "Snack",
      amount: 100,
      paidBy: "m1",
      splitAmong: ["m1", "m2", "m3"],
    },
  ];
  const members = ["m1", "m2", "m3"];

  const result = calculateSplit(expenses, members);

  assert.equal(result.m1, 66.66);
  assert.equal(result.m2, -33.33);
  assert.equal(result.m3, -33.33);
});

test("calculateSplit throws on invalid expense", () => {
  assert.throws(() =>
    calculateSplit(
      [{ title: "Bad", amount: 0, paidBy: "m1", splitAmong: ["m1", "m2"] }],
      ["m1", "m2"]
    )
  );
});
