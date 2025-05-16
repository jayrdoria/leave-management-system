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
        const res = await axios.get(
          "http://localhost:5050/api/leave/manager/leaves",
          {
            headers: { Authorization: `Bearer ${token}` },
          }
        );

        const sorted = res.data.sort(
          (a: Leave, b: Leave) =>
            new Date(a.startDate).getTime() - new Date(b.startDate).getTime()
        );

        setLeaves(sorted);
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
        `http://localhost:5050/api/leave/manager/leave/${id}`,
        { status: action, comment },
        { headers: { Authorization: `Bearer ${token}` } }
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
    <div className="p-6 max-w-6xl mx-auto">
      <h1 className="text-2xl font-bold mb-6 text-gray-800">
        Manage Department Leaves
      </h1>

      {leaves.length === 0 ? (
        <div className="text-center text-gray-500 text-sm italic">
          No leave requests in your department yet.
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {leaves.map((leave) => (
            <div
              key={leave._id}
              className="border border-gray-200 p-5 rounded-lg shadow-sm bg-white space-y-2"
            >
              <div className="text-sm text-gray-700">
                <p className="font-semibold">{leave.userId.name}</p>
                <p className="text-xs text-gray-500">{leave.userId.email}</p>
              </div>

              <div className="text-sm">
                <p>
                  <span className="font-medium">Type:</span> {leave.type}
                </p>
                <p>
                  <span className="font-medium">Category:</span>{" "}
                  {leave.category}
                </p>
                <p>
                  <span className="font-medium">Dates:</span>{" "}
                  {new Date(leave.startDate).toLocaleDateString()} →{" "}
                  {new Date(leave.endDate).toLocaleDateString()}
                </p>
                <p>
                  <span className="font-medium">Reason:</span>{" "}
                  {leave.reason || "—"}
                </p>
                <p>
                  <span className="font-medium">Status:</span> {leave.status}
                </p>
              </div>

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
                      className="bg-green-500 text-white px-4 py-1 rounded text-sm"
                    >
                      Approve
                    </button>
                    <button
                      onClick={() => handleAction(leave._id, "Rejected")}
                      className="bg-red-500 text-white px-4 py-1 rounded text-sm"
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
                    className="bg-yellow-500 text-white px-4 py-1 rounded text-sm"
                  >
                    Cancel Approval
                  </button>
                </div>
              )}

              {leave.comment && (
                <div className="text-sm text-gray-600 pt-2">
                  <span className="font-medium">Comment:</span> {leave.comment}
                </div>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

export default ManageLeaves;
