import { useEffect, useState } from "react";
import axios from "axios";
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  Cell,
} from "recharts";

interface LeaveEntry {
  _id: string;
  category: string;
  startDate: string;
  endDate: string;
  status: string;
  department?: string;
  userId?: {
    _id: string;
    name: string;
    department?: string;
  };
}

interface UserEntry {
  _id: string;
  role: string;
}

const AdminDashboard = () => {
  const [leaveCredits, setLeaveCredits] = useState<number>(0);
  const [pendingLeaves, setPendingLeaves] = useState<LeaveEntry[]>([]);
  const [upcomingLeaves, setUpcomingLeaves] = useState<LeaveEntry[]>([]);
  const [totalLeaves, setTotalLeaves] = useState<number>(0);
  const [userCounts, setUserCounts] = useState({
    admin: 0,
    manager: 0,
    employee: 0,
  });
  const [companyApprovedLeaves, setCompanyApprovedLeaves] = useState<number>(0);
  const [deptLeaves, setDeptLeaves] = useState<
    { department: string; count: number }[]
  >([]);

  const user = JSON.parse(localStorage.getItem("user") || "{}");
  const API = process.env.REACT_APP_API_BASE_URL;

  const fetchDashboard = async () => {
    try {
      const token = localStorage.getItem("token");

      const [leaveMineRes, userSelfRes, allUsersRes, allLeavesRes] =
        await Promise.all([
          axios.get(`${API}/leave/mine/${user._id}`),
          axios.get(`${API}/users/${user._id}`),
          axios.get(`${API}/users`),
          axios.get(`${API}/leave/all`, {
            headers: { Authorization: `Bearer ${token}` },
          }),
        ]);

      const ownLeaves: LeaveEntry[] = leaveMineRes.data;
      const allCompanyLeaves: LeaveEntry[] = allLeavesRes.data;
      const today = new Date();

      const upcoming = allCompanyLeaves.filter(
        (l: any) => l.status === "Approved" && new Date(l.startDate) >= today
      );

      const pending = ownLeaves.filter((l) => l.status === "Pending");

      const approvedThisYear = ownLeaves.filter(
        (l) =>
          l.status === "Approved" &&
          new Date(l.startDate).getFullYear() === today.getFullYear()
      );

      // ✅ Phase 5: Calculate valid (non-expired) credits from leaveCreditHistory
      const validCredits = (userSelfRes.data.leaveCreditHistory || [])
        .filter((entry: any) => new Date(entry.expiresOn) >= today)
        .reduce((sum: number, entry: any) => sum + entry.amount, 0);

      setUpcomingLeaves(upcoming.slice(0, 5));
      setPendingLeaves(pending);
      setTotalLeaves(approvedThisYear.length);
      setLeaveCredits(validCredits);

      const approvedLeaves = allCompanyLeaves.filter(
        (l) => l.status === "Approved"
      );
      setCompanyApprovedLeaves(approvedLeaves.length);

      const deptMap: { [key: string]: number } = {};
      approvedLeaves.forEach((leave) => {
        const dept = leave.department || "Unknown";
        deptMap[dept] = (deptMap[dept] || 0) + 1;
      });
      setDeptLeaves(
        Object.entries(deptMap).map(([department, count]) => ({
          department,
          count,
        }))
      );

      const roleCounts = { admin: 0, manager: 0, employee: 0 };
      allUsersRes.data.forEach((u: UserEntry) => {
        if (roleCounts[u.role as keyof typeof roleCounts] !== undefined) {
          roleCounts[u.role as keyof typeof roleCounts]++;
        }
      });
      setUserCounts(roleCounts);
    } catch (err) {
      console.error("Failed to load admin dashboard", err);
    }
  };

  useEffect(() => {
    fetchDashboard();
  }, []);

  return (
    <div className="min-h-screen bg-gray-100 p-6">
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-gray-800">
          Welcome back, {user.name?.split(" ")[0] || "Admin"} 👋
        </h1>
        <p className="text-gray-500 mt-1">
          Here’s an overview of your account and admin operations.
        </p>
      </div>

      {/* Overview Cards */}
      <div className="grid gap-6 grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 mb-10">
        <Card
          title="Total Admins"
          value={userCounts.admin}
          borderColor="border-gray-400"
          textColor="text-gray-800"
        />
        <Card
          title="Managers"
          value={userCounts.manager}
          borderColor="border-blue-500"
          textColor="text-blue-600"
        />
        <Card
          title="Employees"
          value={userCounts.employee}
          borderColor="border-emerald-500"
          textColor="text-emerald-600"
        />
        <Card
          title="Company Approved Leaves"
          value={companyApprovedLeaves}
          borderColor="border-indigo-600"
          textColor="text-indigo-600"
        />
      </div>

      {/* Personal Stats */}
      <div className="grid gap-6 grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 mb-10">
        <Card
          title="Your Leave Credits"
          value={leaveCredits}
          borderColor="border-green-500"
          textColor="text-green-600"
        />
        <Card
          title="Your Approved Leaves"
          value={totalLeaves}
          borderColor="border-blue-500"
          textColor="text-blue-600"
        />
        <Card
          title="Your Pending Requests"
          value={pendingLeaves.length}
          borderColor="border-yellow-500"
          textColor="text-yellow-600"
        />
      </div>

      {/* Chart */}
      <div className="bg-white shadow rounded-lg p-6">
        <h2 className="text-lg font-semibold text-gray-800 mb-4">
          Approved Leaves per Department
        </h2>
        {deptLeaves.length === 0 ? (
          <p className="text-sm text-gray-500">No approved leaves data yet.</p>
        ) : (
          <ResponsiveContainer width="100%" height={300}>
            <BarChart
              data={deptLeaves}
              margin={{ top: 20, right: 30, left: 0, bottom: 5 }}
              barCategoryGap={30}
            >
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="department" fontSize={12} />
              <YAxis fontSize={12} />
              <Tooltip />
              <Bar
                dataKey="count"
                radius={[6, 6, 0, 0]}
                label={{ position: "top", fontSize: 12, fill: "#444" }}
              >
                {deptLeaves.map((_, index) => (
                  <Cell
                    key={`cell-${index}`}
                    fill={
                      [
                        "#6366f1",
                        "#10b981",
                        "#f59e0b",
                        "#ef4444",
                        "#3b82f6",
                        "#a855f7",
                        "#14b8a6",
                      ][index % 7]
                    }
                  />
                ))}
              </Bar>
            </BarChart>
          </ResponsiveContainer>
        )}
      </div>

      {/* Personal Lists */}
      <div className="grid gap-6 grid-cols-1 lg:grid-cols-2 mt-10">
        <LeaveList
          title="Upcoming Leaves"
          data={upcomingLeaves}
          currentUser={user}
        />
        <LeaveList
          title="Your Pending Requests"
          data={pendingLeaves}
          currentUser={user}
        />
      </div>
    </div>
  );
};

const Card = ({
  title,
  value,
  borderColor,
  textColor,
}: {
  title: string;
  value: number;
  borderColor: string;
  textColor: string;
}) => (
  <div className={`bg-white shadow rounded-lg p-5 border-l-4 ${borderColor}`}>
    <h2 className="text-xs font-medium text-gray-600">{title}</h2>
    <p className={`text-3xl font-bold ${textColor}`}>{value}</p>
  </div>
);

const LeaveList = ({
  title,
  data,
  currentUser,
}: {
  title: string;
  data: LeaveEntry[];
  currentUser: { _id: string };
}) => (
  <div className="bg-white shadow rounded-lg p-5">
    <h2 className="text-lg font-semibold mb-4 text-gray-800">{title}</h2>
    {data.length === 0 ? (
      <p className="text-gray-500">No data available</p>
    ) : (
      <ul className="space-y-4">
        {data.map((leave) => (
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
                {leave.userId._id === currentUser._id
                  ? "Me"
                  : leave.userId.name}{" "}
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
);

export default AdminDashboard;
