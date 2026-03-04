"use client"

interface Settlement{
    _id: string;
    fromUser: {name : string};
    toUser: {name: string};
    amount: number;
    status: string;
}

interface Props{
    settlements: Settlement[];
    onMarkPaid: (id: string) => void;
}

export default function SettlementList ({settlements, onMarkPaid} : Props){
    if(!settlements.length) {
        return <p>No settlements yet...</p>
    }

    return (
    <div className="space-y-3">
      {settlements.map((s) => (
        <div
          key={s._id}
          className="border p-3 rounded flex justify-between items-center"
        >
          <div>
            {s.fromUser.name} → {s.toUser.name} ₹{s.amount}
          </div>

          {s.status === "pending" ? (
            <button
              onClick={() => onMarkPaid(s._id)}
              className="px-3 py-1 bg-green-600 text-white rounded"
            >
              Mark Paid
            </button>
          ) : (
            <span className="text-green-400">Completed</span>
          )}
        </div>
      ))}
    </div>
  );
}