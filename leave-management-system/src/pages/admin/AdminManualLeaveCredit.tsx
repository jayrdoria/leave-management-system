import { useEffect, useState } from "react";
import axios from "axios";
import { toast } from "react-hot-toast";

const API = process.env.REACT_APP_API_BASE_URL;

const AdminManualLeaveCredit = () => {
  const [users, setUsers] = useState([]);
  const [logs, setLogs] = useState([]);
  const [formData, setFormData] = useState({
    userId: "",
    amount: "",
    expires: "thisYear",
    description: "",
  });
  const [loading, setLoading] = useState(false);

  const currentYear = new Date().getFullYear();
  const nextYear = currentYear + 1;

  const fetchUsers = async () => {
    const res = await axios.get(`${API}/users`);
    setUsers(res.data);
  };

  const fetchLogs = async () => {
    const res = await axios.get(`${API}/users/leave-action-logs`, {
      headers: {
        Authorization: `Bearer ${localStorage.getItem("token")}`,
      },
    });
    setLogs(res.data);
  };

  useEffect(() => {
    fetchUsers();
    fetchLogs();
  }, []);

  const handleChange = (e: any) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const handleSubmit = async (e: any) => {
    e.preventDefault();
    setLoading(true);
    try {
      const expiryYear =
        formData.expires === "thisYear" ? currentYear : nextYear;
      const expiresOn = `${expiryYear}-12-31T00:00:00.000Z`;

      const res = await axios.post(
        `${API}/users/manual-credit`,
        {
          userId: formData.userId,
          amount: Number(formData.amount),
          expiresOn,
          description: formData.description,
        },
        {
          headers: {
            Authorization: `Bearer ${localStorage.getItem("token")}`,
          },
        }
      );

      toast.success(res.data.msg);
      setFormData({
        userId: "",
        amount: "",
        expires: "thisYear",
        description: "",
      });
      fetchLogs();
    } catch (err: any) {
      toast.error(err?.response?.data?.msg || "Something went wrong");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="max-w-4xl mx-auto">
      <h1 className="text-2xl font-bold mb-6">Manual Leave Credit</h1>

      <form
        onSubmit={handleSubmit}
        className="space-y-4 bg-white p-6 rounded shadow"
      >
        <div>
          <label className="block font-medium mb-1">Select Employee</label>
          <select
            name="userId"
            value={formData.userId}
            onChange={handleChange}
            required
            className="w-full border px-3 py-2 rounded"
          >
            <option value="">-- Choose an Employee --</option>
            {users.map((user: any) => (
              <option key={user._id} value={user._id}>
                {user.name} ({user.email})
              </option>
            ))}
          </select>
        </div>

        <div className="grid md:grid-cols-2 gap-4">
          <div>
            <label className="block font-medium mb-1">Amount to Add</label>
            <input
              type="number"
              name="amount"
              value={formData.amount}
              onChange={handleChange}
              required
              className="w-full border px-3 py-2 rounded"
              min={0.5}
              step={0.5}
            />
          </div>

          <div>
            <label className="block font-medium mb-1">Expiry Year</label>
            <select
              name="expires"
              value={formData.expires}
              onChange={handleChange}
              required
              className="w-full border px-3 py-2 rounded"
            >
              <option value="thisYear">Expire: Dec 31, {currentYear}</option>
              <option value="nextYear">Expire: Dec 31, {nextYear}</option>
            </select>
          </div>
        </div>

        <div>
          <label className="block font-medium mb-1">Description</label>
          <input
            type="text"
            name="description"
            value={formData.description}
            onChange={handleChange}
            required
            className="w-full border px-3 py-2 rounded"
          />
        </div>

        <button
          type="submit"
          disabled={loading}
          className="bg-blue-600 text-white px-6 py-2 rounded hover:bg-blue-700"
        >
          {loading ? "Processing..." : "Add Leave Credit"}
        </button>
      </form>

      <hr className="my-8" />

      <h2 className="text-xl font-semibold mb-4">Recent Action Logs</h2>
      <div className="bg-white shadow rounded overflow-x-auto">
        <table className="w-full text-sm table-auto">
          <thead className="bg-gray-100">
            <tr>
              <th className="text-left px-4 py-2">Date</th>
              <th className="text-left px-4 py-2">Employee</th>
              <th className="text-left px-4 py-2">Performed By</th>
              <th className="text-left px-4 py-2">Amount</th>
              <th className="text-left px-4 py-2">Description</th>
            </tr>
          </thead>
          <tbody>
            {logs.map((log: any, idx) => (
              <tr key={idx} className="border-b">
                <td className="px-4 py-2">
                  {new Date(log.timestamp).toLocaleString()}
                </td>
                <td className="px-4 py-2">{log.user}</td>
                <td className="px-4 py-2">{log.performedBy}</td>
                <td className="px-4 py-2">+{log.amount}</td>
                <td className="px-4 py-2">{log.description || "-"}</td>
              </tr>
            ))}
            {logs.length === 0 && (
              <tr>
                <td colSpan={5} className="text-center py-4">
                  No logs found.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
};

export default AdminManualLeaveCredit;
