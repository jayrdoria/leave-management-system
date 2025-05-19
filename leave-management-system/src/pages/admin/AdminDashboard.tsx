import { useEffect, useState } from "react";
import axios from "axios";

interface LeaveEntry {
  _id: string;
  category: string;
  startDate: string;
  endDate: string;
  status: string;
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
      const [leaveRes, userRes] = await Promise.all([
        axios.get(`${API}/leave/mine/${user._id}`),
        axios.get(`${API}/users/${user._id}`),
      ]);

      const allLeaves = leaveRes.data;

      const today = new Date();

      const upcoming = allLeaves.filter((l: LeaveEntry) => {
        return l.status === "Approved" && new Date(l.startDate) >= today;
      });

      const pending = allLeaves.filter(
        (l: LeaveEntry) => l.status === "Pending"
      );

      const approvedThisYear = allLeaves.filter((l: LeaveEntry) => {
        return (
          l.status === "Approved" &&
          new Date(l.startDate).getFullYear() === today.getFullYear()
        );
      });

      setUpcomingLeaves(upcoming.slice(0, 3));
      setPendingLeaves(pending);
      setTotalLeaves(approvedThisYear.length);
      setLeaveCredits(userRes.data.leaveCredits || 0);
    } catch (err) {
      console.error("Failed to load dashboard", err);
    }
  };

  useEffect(() => {
    fetchDashboard();
  }, []);

  return (
    <div className="min-h-screen bg-gray-100 p-6">
      <h1 className="text-3xl font-bold text-gray-800 mb-6">
        Employee Dashboard
      </h1>

      <div className="grid gap-6 grid-cols-1 sm:grid-cols-2 lg:grid-cols-3">
        <div className="bg-white shadow rounded-lg p-5">
          <h2 className="text-lg font-semibold mb-2 text-gray-700">
            Leave Credits
          </h2>
          <p className="text-4xl font-bold text-green-600">{leaveCredits}</p>
        </div>

        <div className="bg-white shadow rounded-lg p-5">
          <h2 className="text-lg font-semibold mb-2 text-gray-700">
            Total Approved Leaves
          </h2>
          <p className="text-4xl font-bold text-blue-600">{totalLeaves}</p>
        </div>

        <div className="bg-white shadow rounded-lg p-5">
          <h2 className="text-lg font-semibold mb-2 text-gray-700">
            Pending Requests
          </h2>
          <p className="text-4xl font-bold text-yellow-600">
            {pendingLeaves.length}
          </p>
        </div>
      </div>

      <div className="mt-8 grid gap-6 grid-cols-1 lg:grid-cols-2">
        <div className="bg-white shadow rounded-lg p-5">
          <h2 className="text-lg font-semibold mb-4 text-gray-800">
            Upcoming Leaves
          </h2>
          {upcomingLeaves.length === 0 ? (
            <p className="text-gray-500">No upcoming leaves</p>
          ) : (
            <ul className="list-disc pl-5 space-y-2 text-sm text-gray-700">
              {upcomingLeaves.map((leave) => (
                <li key={leave._id}>
                  <strong>{leave.category}</strong> —{" "}
                  {new Date(leave.startDate).toLocaleDateString()} to{" "}
                  {new Date(leave.endDate).toLocaleDateString()}
                </li>
              ))}
            </ul>
          )}
        </div>

        <div className="bg-white shadow rounded-lg p-5">
          <h2 className="text-lg font-semibold mb-4 text-gray-800">
            Pending Leave Requests
          </h2>
          {pendingLeaves.length === 0 ? (
            <p className="text-gray-500">No pending requests</p>
          ) : (
            <ul className="list-disc pl-5 space-y-2 text-sm text-gray-700">
              {pendingLeaves.map((leave) => (
                <li key={leave._id}>
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
