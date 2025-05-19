import { useState, useEffect } from "react";
import axios from "axios";
import toast from "react-hot-toast";

interface LeaveFormProps {
  selectedDate?: Date;
  closeModal?: () => void;
  onSuccess?: () => void;
}

const LeaveForm: React.FC<LeaveFormProps> = ({
  selectedDate,
  closeModal,
  onSuccess,
}) => {
  const [category, setCategory] = useState("Leave with Pay");
  const [duration, setDuration] = useState("Full Day");
  const [startDate, setStartDate] = useState("");
  const [endDate, setEndDate] = useState("");
  const [reason, setReason] = useState("");
  const [successMsg, setSuccessMsg] = useState("");
  const [errorMsg, setErrorMsg] = useState("");
  const API = process.env.REACT_APP_API_BASE_URL;

  useEffect(() => {
    if (selectedDate) {
      const isoDate = selectedDate.toISOString().split("T")[0];
      setStartDate(isoDate);
      setEndDate(isoDate);
    }
  }, [selectedDate]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSuccessMsg("");
    setErrorMsg("");

    const user = JSON.parse(localStorage.getItem("user") || "{}");
    if (!user?._id) return setErrorMsg("User not logged in");

    const deductCredits =
      category === "Leave with Pay" ||
      category === "Reduction of Overtime / Offset";

    try {
      await axios.post(`${API}/leave/apply`, {
        userId: user._id,
        category,
        duration,
        startDate,
        endDate,
        reason,
        deductCredits,
      });

      toast.success("Leave submitted successfully!");

      setSuccessMsg("Leave request submitted!");
      setCategory("Leave with Pay");
      setDuration("Full Day");
      setStartDate("");
      setEndDate("");
      setReason("");

      if (onSuccess) onSuccess();
      if (closeModal) closeModal();
    } catch (err: any) {
      toast.error("Failed to submit leave.");
      setErrorMsg(err.response?.data?.msg || "Failed to submit leave");
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      {successMsg && (
        <div className="text-green-700 bg-green-100 px-3 py-2 rounded text-sm">
          {successMsg}
        </div>
      )}
      {errorMsg && (
        <div className="text-red-700 bg-red-100 px-3 py-2 rounded text-sm">
          {errorMsg}
        </div>
      )}

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

      <div className="flex justify-end gap-3 mt-6">
        {closeModal && (
          <button
            type="button"
            onClick={closeModal}
            className="px-4 py-2 rounded-md bg-gray-100 hover:bg-gray-200 text-sm text-gray-700"
          >
            Cancel
          </button>
        )}
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

export default LeaveForm;
