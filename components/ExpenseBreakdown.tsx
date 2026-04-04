import React from 'react';

const ExpenseBreakdown = () => {
  const expenses = [
    { category: 'Food', amount: 120 },
    { category: 'Travel', amount: 300 },
    { category: 'Accommodation', amount: 450 },
  ];

  return (
    <div className="bg-white bg-opacity-10 backdrop-blur-md p-4 rounded-lg shadow-lg">
      <ul>
        {expenses.map((expense, index) => (
          <li
            key={index}
            className="flex justify-between items-center p-2 border-b border-gray-700 last:border-b-0"
          >
            <span className="text-white font-medium">{expense.category}</span>
            <span className="text-cyan-400">${expense.amount}</span>
          </li>
        ))}
      </ul>
    </div>
  );
};

export default ExpenseBreakdown;