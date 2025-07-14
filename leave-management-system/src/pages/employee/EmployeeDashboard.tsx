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
    department?: string; // Add this
  };
}

const EmployeeDashboard = () => {
  const [leaveCredits, setLeaveCredits] = useState<number>(0);
  const [pendingLeaves, setPendingLeaves] = useState<LeaveEntry[]>([]);
  const [upcomingLeaves, setUpcomingLeaves] = useState<LeaveEntry[]>([]);
  const [totalLeaves, setTotalLeaves] = useState<number>(0);
  const user = JSON.parse(localStorage.getItem("user") || "{}");
  const API = process.env.REACT_APP_API_BASE_URL;

  const fetchDashboard = async () => {
    try {
      const token = localStorage.getItem("token");

      const [ownLeavesRes, userRes, scopedLeavesRes] = await Promise.all([
        axios.get(`${API}/leave/mine/${user._id}`),
        axios.get(`${API}/users/${user._id}`),
        axios.get(`${API}/leave/scoped`, {
          headers: { Authorization: `Bearer ${token}` },
        }),
      ]);

      const ownLeaves = ownLeavesRes.data;
      const scopedLeaves = scopedLeavesRes.data;
      const today = new Date();
      today.setHours(0, 0, 0, 0);

      const upcoming = scopedLeaves.filter((l: LeaveEntry) => {
        if (l.status !== "Approved") return false;
        const start = new Date(l.startDate);
        const end = new Date(l.endDate);
        start.setHours(0, 0, 0, 0);
        end.setHours(0, 0, 0, 0);
        return start >= today || (today >= start && today <= end);
      });

      const pending = ownLeaves.filter(
        (l: LeaveEntry) => l.status === "Pending"
      );

      const approvedThisYear = ownLeaves.filter((l: LeaveEntry) => {
        return (
          l.status === "Approved" &&
          new Date(l.startDate).getFullYear() === today.getFullYear()
        );
      });

      // ✅ Calculate valid leave credits from leaveCreditHistory
      const validCredits = (userRes.data.leaveCreditHistory || [])
        .filter((entry: any) => new Date(entry.expiresOn) >= today)
        .reduce((sum: number, entry: any) => sum + entry.amount, 0);

      setLeaveCredits(validCredits);
      setPendingLeaves(pending);
      setTotalLeaves(approvedThisYear.length);
      setUpcomingLeaves(upcoming.slice(0, 5));
    } catch (err) {
      console.error("Failed to load dashboard", err);
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
          Welcome back, {user.name?.split(" ")[0] || "Employee"} 👋
        </h1>
        <p className="text-gray-500 mt-1">
          Here’s a quick look at your leave summary
        </p>
      </div>

      {/* Leave Stats */}
      <div className="grid gap-6 grid-cols-1 sm:grid-cols-2 lg:grid-cols-3">
        <div className="bg-white shadow-md rounded-lg p-5 border-l-4 border-green-500">
          <h2 className="text-sm font-medium text-gray-600 mb-1">
            Leave Credits
          </h2>
          <p className="text-4xl font-bold text-green-600">{leaveCredits}</p>
        </div>
        <div className="bg-white shadow-md rounded-lg p-5 border-l-4 border-blue-500">
          <h2 className="text-sm font-medium text-gray-600 mb-1">
            Approved Leaves
          </h2>
          <p className="text-4xl font-bold text-blue-600">{totalLeaves}</p>
        </div>
        <div className="bg-white shadow-md rounded-lg p-5 border-l-4 border-yellow-500">
          <h2 className="text-sm font-medium text-gray-600 mb-1">
            Pending Requests
          </h2>
          <p className="text-4xl font-bold text-yellow-600">
            {pendingLeaves.length}
          </p>
        </div>
      </div>

      {/* Upcoming + Pending Leaves */}
      <div className="mt-10 grid gap-6 grid-cols-1 lg:grid-cols-2">
        {/* Upcoming (Department Scope) */}
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

        {/* Your Pending Requests */}
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

export default EmployeeDashboard;
