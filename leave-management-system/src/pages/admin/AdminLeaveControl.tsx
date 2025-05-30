import React, { useState, useEffect } from "react";
import axios from "axios";
import toast from "react-hot-toast";

interface LogEntry {
  _id: string;
  action: string;
  performedBy: string;
  timestamp: string;
}

interface User {
  _id: string;
  name: string;
  email: string;
  sex: string;
}

const AdminLeaveControl = () => {
  const [loading, setLoading] = useState(false);
  const [logs, setLogs] = useState<LogEntry[]>([]);
  const [users, setUsers] = useState<User[]>([]);
  const [selectedUserId, setSelectedUserId] = useState("");
  const selectedUser = users.find((u) => u._id === selectedUserId);
  const API = process.env.REACT_APP_API_BASE_URL;
  const token = localStorage.getItem("token");

  useEffect(() => {
    fetchLogs();
    fetchUsers();
  }, []);

  const fetchLogs = async () => {
    try {
      const res = await axios.get(`${API}/users/leave-action-logs`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      setLogs(res.data);
    } catch (err) {
      console.error("Failed to fetch logs:", err);
    }
  };

  const fetchUsers = async () => {
    try {
      const res = await axios.get(`${API}/users`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      setUsers(res.data);
    } catch (err) {
      console.error("Failed to fetch users:", err);
    }
  };

  const handleResetLeaves = async () => {
    if (
      !window.confirm("Are you sure you want to reset all leave credits to 0?")
    )
      return;
    try {
      setLoading(true);
      await axios.post(
        `${API}/users/reset-leaves`,
        {},
        { headers: { Authorization: `Bearer ${token}` } }
      );
      toast.success("All leave credits have been reset to 0");
      fetchLogs();
    } catch (err) {
      console.error("Reset error:", err);
      toast.error("Failed to reset leave credits");
    } finally {
      setLoading(false);
    }
  };

  const handleAddStandardLeaves = async () => {
    if (!window.confirm("Add standard leave credits based on country?")) return;
    try {
      setLoading(true);
      await axios.post(
        `${API}/users/add-standard-leaves`,
        {},
        { headers: { Authorization: `Bearer ${token}` } }
      );
      toast.success("Standard leave credits added based on country");
      fetchLogs();
    } catch (err) {
      console.error("Add standard error:", err);
      toast.error("Failed to add standard leave credits");
    } finally {
      setLoading(false);
    }
  };

  const handleAddParentLeave = async () => {
    if (!selectedUserId) return toast.error("Please select a user");
    try {
      setLoading(true);
      await axios.post(
        `${API}/users/add-parent-leave`,
        { userId: selectedUserId },
        { headers: { Authorization: `Bearer ${token}` } }
      );
      toast.success("Parent leave credits added successfully");
      fetchLogs();
    } catch (err) {
      console.error("Add parent leave error:", err);
      toast.error("Failed to add parent leave");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="max-w-4xl mx-auto px-4 py-8">
      <h1 className="text-3xl font-bold text-gray-800 mb-6">
        Admin Panel – Leave Expiry Control
      </h1>

      <div className="bg-white shadow rounded-lg p-6 space-y-6">
        <p className="text-sm text-gray-600">
          Use these actions to manage leave credit expiration and annual
          standard allocations based on user country and parental status.
        </p>

        <div className="flex flex-col sm:flex-row gap-4">
          <button
            onClick={handleResetLeaves}
            disabled={loading}
            className="bg-red-600 hover:bg-red-700 text-white px-6 py-3 rounded text-sm font-semibold disabled:opacity-50"
          >
            {loading ? "Processing..." : "Reset All Leaves to 0"}
          </button>

          <button
            onClick={handleAddStandardLeaves}
            disabled={loading}
            className="bg-green-600 hover:bg-green-700 text-white px-6 py-3 rounded text-sm font-semibold disabled:opacity-50"
          >
            {loading
              ? "Processing..."
              : "Add Standard Leaves (PH: 15 | Malta: 24)"}
          </button>
        </div>

        {/* Parent Leave Section */}
        <div className="border-t pt-6 mt-6">
          <h2 className="text-lg font-semibold mb-2">
            Add Paternity / Maternity Leave (Individual)
          </h2>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 items-center">
            <select
              value={selectedUserId}
              onChange={(e) => setSelectedUserId(e.target.value)}
              className="px-3 py-2 border rounded shadow-sm focus:ring-blue-500 focus:border-blue-500"
            >
              <option value="">-- Select Employee --</option>
              {users.map((u) => (
                <option key={u._id} value={u._id}>
                  {u.name} ({u.email}) - {u.sex}
                </option>
              ))}
            </select>

            <div className="text-sm text-gray-700">
              {selectedUser && (
                <p>
                  Selected:{" "}
                  <span className="font-medium">
                    {selectedUser.sex === "Male"
                      ? "Male (10 Paternity)"
                      : "Female (45 Maternity)"}
                  </span>
                </p>
              )}
            </div>

            <button
              onClick={handleAddParentLeave}
              disabled={!selectedUserId || loading}
              className={`px-4 py-2 text-white rounded text-sm font-semibold transition ${
                selectedUser?.sex === "Male"
                  ? "bg-blue-600 hover:bg-blue-700"
                  : selectedUser?.sex === "Female"
                  ? "bg-pink-600 hover:bg-pink-700"
                  : "bg-gray-400 cursor-not-allowed"
              }`}
            >
              {loading
                ? "Processing..."
                : selectedUser
                ? `Add ${
                    selectedUser.sex === "Male" ? "Paternity" : "Maternity"
                  } Leave`
                : "Add Parent Leave"}
            </button>
          </div>
        </div>
      </div>

      {/* Logs Table */}
      <div className="bg-white mt-8 shadow rounded-lg p-6">
        <h2 className="text-xl font-semibold mb-4">Action Logs</h2>
        {logs.length === 0 ? (
          <p className="text-gray-500 text-sm">No recent actions logged.</p>
        ) : (
          <div className="overflow-x-auto">
            <table className="min-w-full text-sm text-left">
              <thead>
                <tr className="bg-gray-100 text-gray-700">
                  <th className="px-4 py-2 border">Action</th>
                  <th className="px-4 py-2 border">Performed By</th>
                  <th className="px-4 py-2 border">Timestamp</th>
                </tr>
              </thead>
              <tbody>
                {logs.map((log) => (
                  <tr key={log._id} className="border-t">
                    <td className="px-4 py-2">{log.action}</td>
                    <td className="px-4 py-2">{log.performedBy}</td>
                    <td className="px-4 py-2">
                      {new Date(log.timestamp).toLocaleString()}
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

export default AdminLeaveControl;
