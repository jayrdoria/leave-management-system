import { useEffect, useState } from "react";
import axios from "axios";
import toast from "react-hot-toast";

interface User {
  _id: string;
  name: string;
  email: string;
  sex?: string;
}

const AdminApplyLeave = () => {
  const [users, setUsers] = useState<User[]>([]);
  const [selectedUser, setSelectedUser] = useState("");
  const selectedUserObj = users.find((u) => u._id === selectedUser);
  const [category, setCategory] = useState("Leave with Pay");
  const [duration, setDuration] = useState("Full Day");
  const [startDate, setStartDate] = useState("");
  const [endDate, setEndDate] = useState("");
  const [reason, setReason] = useState("");
  const API = process.env.REACT_APP_API_BASE_URL;
  const token = localStorage.getItem("token");

  useEffect(() => {
    axios
      .get(`${API}/users`, {
        headers: { Authorization: `Bearer ${token}` },
      })
      .then((res) => setUsers(res.data))
      .catch(() => toast.error("Failed to fetch users"));
  }, []);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!selectedUser || !startDate || !endDate) {
      return toast.error("Please fill all required fields.");
    }

    try {
      await axios.post(
        `${API}/leave/admin-apply`,
        {
          userId: selectedUser,
          category,
          duration,
          startDate,
          endDate,
          reason,
          deductCredits: duration === "Half Day" ? 0.5 : 1,
        },
        { headers: { Authorization: `Bearer ${token}` } }
      );

      toast.success("Leave filed successfully!");

      setSelectedUser("");
      setCategory("Leave with Pay");
      setDuration("Full Day");
      setStartDate("");
      setEndDate("");
      setReason("");
    } catch (err: any) {
      toast.error(err.response?.data?.msg || "Failed to file leave");
    }
  };

  return (
    <form
      onSubmit={handleSubmit}
      className="max-w-2xl mx-auto bg-white shadow p-6 rounded space-y-4"
    >
      <h2 className="text-xl font-bold text-center mb-2">
        File Leave for Employee
      </h2>

      <div>
        <label className="block text-sm font-semibold text-gray-700 mb-1">
          Select Employee
        </label>
        <select
          value={selectedUser}
          onChange={(e) => setSelectedUser(e.target.value)}
          className="w-full px-3 py-2 border rounded-md shadow-sm focus:ring-blue-500 focus:border-blue-500"
        >
          <option value="">-- Choose --</option>
          {users.map((u) => (
            <option key={u._id} value={u._id}>
              {u.name} ({u.email})
            </option>
          ))}
        </select>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div>
          <label className="block text-sm font-semibold text-gray-700 mb-1">
            Category
          </label>
          <select
            value={category}
            onChange={(e) => setCategory(e.target.value)}
            className="w-full px-3 py-2 border rounded-md shadow-sm focus:ring-blue-500 focus:border-blue-500"
          >
            <option value="Leave with Pay">Leave with Pay</option>
            <option value="Leave without Pay">Leave without Pay</option>
            <option value="Reduction of Overtime / Offset">
              Reduction of Overtime / Offset
            </option>
            <option value="Birthday Leave">Birthday Leave</option>
            {selectedUserObj?.sex === "Male" && (
              <option value="Paternity Leave">Paternity Leave</option>
            )}
            {selectedUserObj?.sex === "Female" && (
              <option value="Maternity Leave">Maternity Leave</option>
            )}
          </select>
        </div>

        <div>
          <label className="block text-sm font-semibold text-gray-700 mb-1">
            Duration
          </label>
          <select
            value={duration}
            onChange={(e) => setDuration(e.target.value)}
            className="w-full px-3 py-2 border rounded-md shadow-sm focus:ring-blue-500 focus:border-blue-500"
          >
            <option value="Full Day">Full Day</option>
            <option value="Half Day">Half Day</option>
          </select>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div>
          <label className="block text-sm font-semibold text-gray-700 mb-1">
            Start Date
          </label>
          <input
            type="date"
            value={startDate}
            onChange={(e) => setStartDate(e.target.value)}
            className="w-full px-3 py-2 border rounded-md shadow-sm focus:ring-blue-500 focus:border-blue-500"
            required
          />
        </div>

        <div>
          <label className="block text-sm font-semibold text-gray-700 mb-1">
            End Date
          </label>
          <input
            type="date"
            value={endDate}
            onChange={(e) => setEndDate(e.target.value)}
            className="w-full px-3 py-2 border rounded-md shadow-sm focus:ring-blue-500 focus:border-blue-500"
            required
          />
        </div>
      </div>

      <div>
        <label className="block text-sm font-semibold text-gray-700 mb-1">
          Reason
        </label>
        <textarea
          value={reason}
          onChange={(e) => setReason(e.target.value)}
          className="w-full px-3 py-2 border rounded-md shadow-sm focus:ring-blue-500 focus:border-blue-500"
          rows={3}
          placeholder="Optional"
        />
      </div>

      <div className="flex justify-end mt-6">
        <button
          type="submit"
          className="px-5 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 text-sm font-semibold"
        >
          Submit Leave
        </button>
      </div>
    </form>
  );
};

export default AdminApplyLeave;
