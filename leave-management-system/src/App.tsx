import { BrowserRouter, Routes, Route } from "react-router-dom";
import Login from "./pages/Login";
import LeaveForm from "./pages/employee/LeaveForm";
import EmployeeCalendar from "./pages/employee/EmployeeCalendar";
import LeaveHistory from "./pages/employee/LeaveHistory";
import ManageLeaves from "./pages/manager/ManageLeaves";
import ManagerCalendar from "./pages/manager/ManagerCalendar";
import DashboardLayout from "./components/layouts/DashboardLayout";
import EmployeeDashboard from "./pages/employee/EmployeeDashboard";
import ManagerDashboard from "./pages/manager/ManagerDashboard";
import AdminDashboard from "./pages/admin/AdminDashboard";
import UserInfo from "./pages/employee/UserInfo";
import ProtectedRoute from "./components/ProtectedRoute";
import AdminUserManagement from "./pages/admin/AdminUserManagement";
import AdminCalendar from "./pages/admin/AdminCalendar";
import AdminManageLeaves from "./pages/admin/AdminManageLeaves";

function App() {
  return (
    <BrowserRouter basename="/leave-system">
      <Routes>
        {/* Public route */}
        <Route path="/" element={<Login />} />

        {/* Protected routes */}
        <Route element={<ProtectedRoute />}>
          {/* Admin */}
          <Route path="/admin" element={<DashboardLayout role="admin" />}>
            <Route index element={<AdminDashboard />} />
            <Route path="calendar" element={<AdminCalendar />} />
            <Route path="leaves" element={<AdminManageLeaves />} />
            <Route path="history" element={<LeaveHistory />} />
            <Route path="profile" element={<UserInfo />} />
            <Route path="user-management" element={<AdminUserManagement />} />
          </Route>

          {/* Manager */}
          <Route path="/manager" element={<DashboardLayout role="manager" />}>
            <Route index element={<ManagerDashboard />} />
            <Route path="calendar" element={<ManagerCalendar />} />
            <Route path="leaves" element={<ManageLeaves />} />
            <Route path="history" element={<LeaveHistory />} />
            <Route path="profile" element={<UserInfo />} />
          </Route>

          {/* Employee */}
          <Route path="/employee" element={<DashboardLayout role="employee" />}>
            <Route index element={<EmployeeDashboard />} />
            <Route path="calendar" element={<EmployeeCalendar />} />
            <Route path="leave" element={<LeaveForm />} />
            <Route path="history" element={<LeaveHistory />} />
            <Route path="profile" element={<UserInfo />} />
          </Route>
        </Route>
      </Routes>
    </BrowserRouter>
  );
}

export default App;
