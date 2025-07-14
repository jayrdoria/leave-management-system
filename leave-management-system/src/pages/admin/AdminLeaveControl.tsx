import { useEffect, useState } from "react";
import axios from "axios";
import { toast } from "react-hot-toast";

const API = process.env.REACT_APP_API_BASE_URL;

interface LogEntry {
  _id: string;
  user: string;
  amount: number;
  country?: string;
  performedBy: string;
  timestamp: string;
  action: string;
  description?: string;
}

const AdminLeaveControl = () => {
  const [lastGrantTimestamp, setLastGrantTimestamp] = useState<string | null>(
    null
  );
  const [showReset, setShowReset] = useState(false);
  const [logs, setLogs] = useState<LogEntry[]>([]);

  useEffect(() => {
    fetchLogs();
  }, []);

  const fetchLogs = async () => {
    try {
      const res = await axios.get(`${API}/users/leave-action-logs`, {
        headers: {
          Authorization: `Bearer ${localStorage.getItem("token")}`,
        },
      });

      const yearlyLogs = res.data.filter(
        (log: LogEntry) => log.action === "Yearly Credit"
      );

      setLogs(yearlyLogs);
      if (yearlyLogs.length > 0) {
        setLastGrantTimestamp(yearlyLogs[0].timestamp);
        const now = new Date().getTime();
        const last = new Date(yearlyLogs[0].timestamp).getTime();
        const hoursSince = (now - last) / (1000 * 60 * 60);
        setShowReset(hoursSince <= 24);
      }
    } catch (err) {
      toast.error("Failed to load logs");
      console.error(err);
    }
  };

  const handleGrantCredits = async () => {
    try {
      const res = await axios.post(
        `${API}/users/yearly-credits`,
        {},
        {
          headers: {
            Authorization: `Bearer ${localStorage.getItem("token")}`,
          },
        }
      );
      toast.success("Yearly credits granted!");
      setLastGrantTimestamp(res.data.timestamp);
      fetchLogs();
    } catch (err) {
      toast.error("Granting failed");
      console.error(err);
    }
  };

  const handleReset = async () => {
    try {
      const res = await axios.post(
        `${API}/users/reset-yearly-credits`,
        { timestamp: lastGrantTimestamp },
        {
          headers: {
            Authorization: `Bearer ${localStorage.getItem("token")}`,
          },
        }
      );
      toast.success("Reset successful");
      setShowReset(false);
      fetchLogs();
    } catch (err) {
      toast.error("Reset failed");
      console.error(err);
    }
  };

  return (
    <div className="max-w-5xl mx-auto p-6">
      <h1 className="text-2xl font-bold mb-4">🛠 Admin Yearly Leave Control</h1>

      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-6">
        <button
          onClick={handleGrantCredits}
          className="bg-blue-600 text-white px-6 py-3 rounded hover:bg-blue-700"
        >
          Add Yearly Credits
        </button>

        {showReset && (
          <button
            onClick={handleReset}
            className="bg-red-600 text-white px-6 py-3 rounded hover:bg-red-700"
          >
            Reset Credits (within 24h)
          </button>
        )}
      </div>

      {lastGrantTimestamp && (
        <p className="text-sm text-gray-700 mb-4">
          Last granted:{" "}
          <span className="font-mono">
            {new Date(lastGrantTimestamp).toLocaleString()}
          </span>
        </p>
      )}

      <div className="overflow-x-auto bg-white shadow-md rounded border">
        <table className="min-w-full text-sm text-left text-gray-800">
          <thead className="bg-gray-100 text-xs uppercase font-semibold">
            <tr>
              <th className="px-4 py-2">Employee</th>
              <th className="px-4 py-2">Amount</th>
              <th className="px-4 py-2">Performed By</th>
              <th className="px-4 py-2">Timestamp</th>
              <th className="px-4 py-2">Description</th>
            </tr>
          </thead>
          <tbody>
            {logs.length === 0 ? (
              <tr>
                <td colSpan={5} className="text-center py-6 text-gray-400">
                  No Yearly Credit logs found.
                </td>
              </tr>
            ) : (
              logs.map((log) => (
                <tr key={log._id} className="border-t">
                  <td className="px-4 py-2">{log.user}</td>
                  <td className="px-4 py-2">{log.amount}</td>
                  <td className="px-4 py-2">{log.performedBy}</td>
                  <td className="px-4 py-2">
                    {new Date(log.timestamp).toLocaleString()}
                  </td>
                  <td className="px-4 py-2">{log.description || "-"}</td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
};

export default AdminLeaveControl;
