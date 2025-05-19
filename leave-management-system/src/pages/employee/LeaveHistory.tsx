import { useEffect, useState } from "react";
import axios from "axios";

interface LeaveEntry {
  _id: string;
  category: string;
  startDate: string;
  endDate: string;
  status: string;
  reason?: string;
}

const LeaveHistory = () => {
  const [leaves, setLeaves] = useState<LeaveEntry[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const API = process.env.REACT_APP_API_BASE_URL;

  // ✅ Get user from localStorage
  const user = JSON.parse(localStorage.getItem("user") || "{}");
  const leaveCredits = user?.leaveCredits ?? 0;

  useEffect(() => {
    if (!user?._id) {
      setError("User not logged in");
      setLoading(false);
      return;
    }

    axios
      .get(`${API}/leave/mine/${user._id}`)
      .then((res) => {
        setLeaves(res.data);
        setLoading(false);
      })
      .catch(() => {
        setError("Could not fetch leave history.");
        setLoading(false);
      });
  }, []);

  return (
    <div className="min-h-screen bg-gray-100 p-6">
      <div className="max-w-5xl mx-auto bg-white p-6 rounded shadow">
        <h2 className="text-2xl font-bold text-gray-800 mb-2">
          My Leave History
        </h2>

        <p className="text-gray-700 text-sm mb-4">
          Leave Credit Balance:{" "}
          <span className="font-semibold">{leaveCredits}</span> days
        </p>

        {loading && <p className="text-gray-500">Loading leave history...</p>}
        {error && <p className="text-red-600">{error}</p>}

        {!loading && !error && (
          <div className="overflow-x-auto">
            <table className="min-w-full table-auto border">
              <thead className="bg-gray-200">
                <tr>
                  <th className="px-4 py-2 text-left text-sm text-gray-700">
                    Leave Type
                  </th>
                  <th className="px-4 py-2 text-left text-sm text-gray-700">
                    Start
                  </th>
                  <th className="px-4 py-2 text-left text-sm text-gray-700">
                    End
                  </th>
                  <th className="px-4 py-2 text-left text-sm text-gray-700">
                    Status
                  </th>
                </tr>
              </thead>
              <tbody>
                {leaves.map((leave) => (
                  <tr key={leave._id} className="border-b">
                    <td className="px-4 py-2 text-sm text-gray-800">
                      {leave.category}
                    </td>
                    <td className="px-4 py-2 text-sm text-gray-800">
                      {new Date(leave.startDate).toLocaleDateString()}
                    </td>
                    <td className="px-4 py-2 text-sm text-gray-800">
                      {new Date(leave.endDate).toLocaleDateString()}
                    </td>
                    <td className="px-4 py-2 text-sm">
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
