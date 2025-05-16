import { useEffect, useState } from "react";
import axios from "axios";

interface LeaveEntry {
  _id: string;
  category: string;
  startDate: string;
  endDate: string;
  status: string;
  userId?: {
    _id: string;
    name: string;
    department?: string;
  };
}

const ManagerDashboard = () => {
  const [leaveCredits, setLeaveCredits] = useState<number>(0);
  const [pendingLeaves, setPendingLeaves] = useState<LeaveEntry[]>([]);
  const [upcomingLeaves, setUpcomingLeaves] = useState<LeaveEntry[]>([]);
  const [totalLeaves, setTotalLeaves] = useState<number>(0);
  const user = JSON.parse(localStorage.getItem("user") || "{}");

  const fetchDashboard = async () => {
    try {
      const token = localStorage.getItem("token");

      const [scopedLeavesRes, userRes] = await Promise.all([
        axios.get("http://localhost:5050/api/leave/manager/leaves", {
          headers: { Authorization: `Bearer ${token}` },
        }),
        axios.get(`http://localhost:5050/api/users/${user._id}`),
      ]);

      const scopedLeaves = scopedLeavesRes.data;
      const today = new Date();
      today.setHours(0, 0, 0, 0);

      const upcoming = scopedLeaves.filter((l: LeaveEntry) => {
        const start = new Date(l.startDate);
        const end = new Date(l.endDate);
        start.setHours(0, 0, 0, 0);
        end.setHours(0, 0, 0, 0);
        return (
          l.status === "Approved" &&
          (start >= today || (today >= start && today <= end))
        );
      });

      const ownLeaves = scopedLeaves.filter(
        (l: LeaveEntry) => l.userId?._id === user._id && l.status === "Approved"
      );

      const pending = scopedLeaves.filter(
        (l: LeaveEntry) => l.userId?._id === user._id && l.status === "Pending"
      );

      setUpcomingLeaves(upcoming.slice(0, 5));
      setPendingLeaves(pending);
      setTotalLeaves(ownLeaves.length);
      setLeaveCredits(userRes.data.leaveCredits || 0);
    } catch (err) {
      console.error("Manager dashboard failed to load", err);
    }
  };

  useEffect(() => {
    fetchDashboard();
  }, []);

  return (
    <div className="min-h-screen bg-gray-100 p-6">
      {/* Greeting */}
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-gray-800">
          Welcome back, {user.name?.split(" ")[0] || "Manager"} 👋
        </h1>
        <p className="text-gray-500 mt-1">
          Here's an overview of your leaves and department activity
        </p>
      </div>

      {/* Stats */}
      <div className="grid gap-6 grid-cols-1 sm:grid-cols-2 lg:grid-cols-3">
        <div className="bg-white shadow-md rounded-lg p-5 border-l-4 border-green-500">
          <h2 className="text-sm font-medium text-gray-600 mb-1">
            Leave Credits
          </h2>
          <p className="text-4xl font-bold text-green-600">{leaveCredits}</p>
        </div>
        <div className="bg-white shadow-md rounded-lg p-5 border-l-4 border-blue-500">
          <h2 className="text-sm font-medium text-gray-600 mb-1">
            Your Approved Leaves
          </h2>
          <p className="text-4xl font-bold text-blue-600">{totalLeaves}</p>
        </div>
        <div className="bg-white shadow-md rounded-lg p-5 border-l-4 border-yellow-500">
          <h2 className="text-sm font-medium text-gray-600 mb-1">
            Your Pending Requests
          </h2>
          <p className="text-4xl font-bold text-yellow-600">
            {pendingLeaves.length}
          </p>
        </div>
      </div>

      {/* Upcoming + Pending */}
      <div className="mt-10 grid gap-6 grid-cols-1 lg:grid-cols-2">
        <div className="bg-white shadow rounded-lg p-5">
          <h2 className="text-lg font-semibold mb-4 text-gray-800">
            Upcoming Leaves ({user.department} Department)
          </h2>
          {upcomingLeaves.length === 0 ? (
            <p className="text-gray-500">
              No upcoming leaves in your department
            </p>
          ) : (
            <ul className="space-y-4">
              {upcomingLeaves.map((leave) => (
                <li
                  key={leave._id}
                  className="p-4 rounded-md border border-gray-200 bg-white shadow-sm hover:shadow-md transition"
                >
                  <p className="text-gray-800 font-medium">
                    <strong>{leave.category}</strong> —{" "}
                    {new Date(leave.startDate).toLocaleDateString()} to{" "}
                    {new Date(leave.endDate).toLocaleDateString()}
                  </p>
                  {leave.userId && (
                    <p className="mt-1 text-sm text-blue-600 font-semibold">
                      👤{" "}
                      {leave.userId._id === user._id ? "Me" : leave.userId.name}{" "}
                      <span className="text-gray-500 font-normal">
                        in {leave.userId.department || "Unknown"}
                      </span>
                    </p>
                  )}
                </li>
              ))}
            </ul>
          )}
        </div>

        <div className="bg-white shadow rounded-lg p-5">
          <h2 className="text-lg font-semibold mb-4 text-gray-800">
            Your Pending Requests
          </h2>
          {pendingLeaves.length === 0 ? (
            <p className="text-gray-500">No pending requests</p>
          ) : (
            <ul className="space-y-3">
              {pendingLeaves.map((leave) => (
                <li
                  key={leave._id}
                  className="text-sm bg-yellow-50 border p-3 rounded"
                >
                  <strong>{leave.category}</strong> —{" "}
                  {new Date(leave.startDate).toLocaleDateString()} to{" "}
                  {new Date(leave.endDate).toLocaleDateString()}
                </li>
              ))}
            </ul>
          )}
        </div>
      </div>
    </div>
  );
};

export default ManagerDashboard;
