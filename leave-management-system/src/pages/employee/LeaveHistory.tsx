import { useEffect, useState } from "react";
import axios from "axios";

interface LeaveEntry {
  _id: string;
  category: string;
  startDate: string;
  endDate: string;
  status: string;
  reason?: string;
  deductedFrom?: {
    expiryDate: string;
    amount: number;
  }[];
}

interface CreditGroup {
  amount: number;
  expiresOn: string;
}

interface LeaveHistoryProps {
  refreshTrigger?: boolean;
}

const LeaveHistory: React.FC<LeaveHistoryProps> = ({ refreshTrigger }) => {
  const [leaves, setLeaves] = useState<LeaveEntry[]>([]);
  const [creditGroups, setCreditGroups] = useState<CreditGroup[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const API = process.env.REACT_APP_API_BASE_URL;

  const user = JSON.parse(localStorage.getItem("user") || "{}");

  useEffect(() => {
    if (!user?._id) {
      setError("User not logged in");
      setLoading(false);
      return;
    }

    const fetchData = async () => {
      setLoading(true);
      try {
        const [leaveRes, userRes] = await Promise.all([
          axios.get(`${API}/leave/mine/${user._id}`),
          axios.get(`${API}/users/${user._id}`),
        ]);

        setLeaves(leaveRes.data || []);

        const validCredits = (userRes.data.leaveCreditHistory || []).filter(
          (entry: CreditGroup) => new Date(entry.expiresOn) >= new Date()
        );
        setCreditGroups(
          validCredits
            .filter((c: CreditGroup) => c.amount > 0)
            .sort(
              (a: CreditGroup, b: CreditGroup) =>
                new Date(a.expiresOn).getTime() -
                new Date(b.expiresOn).getTime()
            )
        );
      } catch (err) {
        setError("Could not fetch leave history or user data.");
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, [user._id, refreshTrigger]);

  const totalLeaveCredits = creditGroups.reduce((sum, c) => sum + c.amount, 0);

  const getCreditsUsed = (leave: LeaveEntry): string => {
    if (leave.status !== "Approved") return "0";
    if (!leave.deductedFrom || leave.deductedFrom.length === 0) return "0";
    const used = leave.deductedFrom.reduce((sum, d) => sum + d.amount, 0);
    return used > 0 ? `-${used}` : "0";
  };

  return (
    <div className="min-h-screen bg-gray-100 p-6">
      <div className="max-w-5xl mx-auto bg-white p-6 rounded shadow">
        <h2 className="text-2xl font-bold text-gray-800 mb-2">
          My Leave History
        </h2>

        {creditGroups.length > 0 ? (
          <div className="text-sm text-gray-700 mb-6">
            <p className="mb-2 text-base font-semibold text-gray-800">
              Leave Credit Balance: {Math.floor(totalLeaveCredits)} days
            </p>
            <div className="space-y-2">
              {creditGroups.map((g, idx) => {
                const expiresOn = new Date(g.expiresOn);
                expiresOn.setDate(expiresOn.getDate()); // Show 1 day before expiry
                const formattedExpires = expiresOn.toLocaleDateString("en-US", {
                  year: "numeric",
                  month: "short",
                  day: "numeric",
                });

                return (
                  <div
                    key={idx}
                    className="bg-green-50 border border-green-200 rounded-md px-4 py-2 flex justify-between items-center"
                  >
                    <div className="font-medium text-green-700">
                      {Math.floor(g.amount)} day
                      {Math.floor(g.amount) !== 1 ? "s" : ""}
                    </div>
                    <div className="text-gray-600 text-xs">
                      Expires: {formattedExpires}
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        ) : (
          <p className="text-sm text-gray-500 mb-4">
            No valid leave credits available.
          </p>
        )}

        {loading && <p className="text-gray-500">Loading leave history...</p>}
        {error && <p className="text-red-600">{error}</p>}

        {!loading && !error && (
          <div className="overflow-x-auto">
            <table className="min-w-full table-auto border text-sm">
              <thead className="bg-gray-200">
                <tr>
                  <th className="px-4 py-2 text-left text-gray-700">
                    Leave Type
                  </th>
                  <th className="px-4 py-2 text-left text-gray-700">Start</th>
                  <th className="px-4 py-2 text-left text-gray-700">End</th>
                  <th className="px-4 py-2 text-left text-gray-700">Status</th>
                  <th className="px-4 py-2 text-left text-gray-700">
                    Credits Used
                  </th>
                </tr>
              </thead>
              <tbody>
                {leaves.map((leave) => (
                  <tr key={leave._id} className="border-b">
                    <td className="px-4 py-2 text-gray-800">
                      {leave.category}
                    </td>
                    <td className="px-4 py-2 text-gray-800">
                      {new Date(leave.startDate).toLocaleDateString()}
                    </td>
                    <td className="px-4 py-2 text-gray-800">
                      {new Date(leave.endDate).toLocaleDateString()}
                    </td>
                    <td className="px-4 py-2">
                      <span
                        className={`inline-block px-2 py-1 rounded text-xs font-semibold ${
                          leave.status === "Approved"
                            ? "bg-green-100 text-green-700"
                            : leave.status === "Rejected"
                            ? "bg-red-100 text-red-700"
                            : "bg-yellow-100 text-yellow-700"
                        }`}
                      >
                        {leave.status}
                      </span>
                    </td>
                    <td className="px-4 py-2 text-gray-800">
                      {getCreditsUsed(leave)}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
};

export default LeaveHistory;
