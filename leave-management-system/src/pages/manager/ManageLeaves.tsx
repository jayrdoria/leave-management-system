import React, { useEffect, useState } from "react";
import axios from "axios";
import toast from "react-hot-toast";

interface Leave {
  _id: string;
  userId: {
    name: string;
    email: string;
  };
  type: string;
  category: string;
  startDate: string;
  endDate: string;
  reason: string;
  status: string;
  comment?: string;
}

const ManageLeaves: React.FC = () => {
  const [leaves, setLeaves] = useState<Leave[]>([]);
  const [commentMap, setCommentMap] = useState<{ [key: string]: string }>({});

  const token = localStorage.getItem("token");

  useEffect(() => {
    const fetchLeaves = async () => {
      try {
        const res = await axios.get("/leave/manager/leaves", {
          headers: { Authorization: `Bearer ${token}` },
        });
        setLeaves(res.data);
      } catch (err) {
        console.error("Error fetching leaves", err);
      }
    };

    fetchLeaves();
  }, [token]);

  const handleAction = async (
    id: string,
    action: "Approved" | "Rejected" | "Pending"
  ) => {
    try {
      const comment = commentMap[id] || "";
      await axios.put(
        `/leave/manager/leave/${id}`,
        {
          status: action,
          comment,
        },
        {
          headers: { Authorization: `Bearer ${token}` },
        }
      );

      toast.success(
        action === "Pending"
          ? "Approval cancelled."
          : `Leave ${action.toLowerCase()} successfully.`
      );

      setLeaves((prev) =>
        prev.map((l) => (l._id === id ? { ...l, status: action, comment } : l))
      );
    } catch (err) {
      toast.error("Failed to update leave.");
      console.error("Error updating leave", err);
    }
  };

  return (
    <div className="p-6">
      <h1 className="text-2xl font-bold mb-4">Manage Department Leaves</h1>
      <div className="space-y-4">
        {leaves.length === 0 ? (
          <div className="text-center text-gray-500 text-sm italic">
            No leave requests in your department yet.
          </div>
        ) : (
          leaves.map((leave) => (
            <div
              key={leave._id}
              className="border p-4 rounded shadow bg-white space-y-2"
            >
              {/* Existing leave content */}
              <div>
                <strong>{leave.userId.name}</strong> — {leave.type} (
                {leave.category})
              </div>
              <div>
                <span className="font-medium">From:</span>{" "}
                {leave.startDate.slice(0, 10)}
                {" → "}
                <span className="font-medium">To:</span>{" "}
                {leave.endDate.slice(0, 10)}
              </div>
              <div>
                <span className="font-medium">Reason:</span>{" "}
                {leave.reason || "None"}
              </div>
              <div className="font-medium">Status: {leave.status}</div>

              {leave.status === "Pending" && (
                <div className="space-y-2">
                  <textarea
                    placeholder="Add comment (optional)"
                    className="w-full border p-2 rounded text-sm"
                    onChange={(e) =>
                      setCommentMap({
                        ...commentMap,
                        [leave._id]: e.target.value,
                      })
                    }
                  />
                  <div className="flex gap-2">
                    <button
                      onClick={() => handleAction(leave._id, "Approved")}
                      className="bg-green-500 text-white px-4 py-1 rounded"
                    >
                      Approve
                    </button>
                    <button
                      onClick={() => handleAction(leave._id, "Rejected")}
                      className="bg-red-500 text-white px-4 py-1 rounded"
                    >
                      Reject
                    </button>
                  </div>
                </div>
              )}

              {leave.status === "Approved" && (
                <div className="mt-2">
                  <button
                    onClick={() => handleAction(leave._id, "Pending")}
                    className="bg-yellow-500 text-white px-4 py-1 rounded"
                  >
                    Cancel Approval
                  </button>
                </div>
              )}

              {leave.comment && (
                <div className="text-sm text-gray-700">
                  <span className="font-medium">Comment:</span> {leave.comment}
                </div>
              )}
            </div>
          ))
        )}
      </div>
    </div>
  );
};

export default ManageLeaves;
