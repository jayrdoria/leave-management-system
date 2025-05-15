import { BrowserRouter, Routes, Route } from "react-router-dom";
import Login from "./pages/Login";
import LeaveForm from "./pages/employee/LeaveForm";
import EmployeeCalendar from "./pages/employee/EmployeeCalendar";
import LeaveHistory from "./pages/employee/LeaveHistory";
import ManageLeaves from "./pages/manager/ManageLeaves";
import ManagerCalendar from "./pages/manager/ManagerCalendar";

function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/" element={<Login />} />
        {/* Placeholder protected routes */}
        <Route path="/admin" element={<div>Admin Dashboard</div>} />
        <Route path="/manager" element={<div>Manager Dashboard</div>} />
        <Route path="/employee" element={<div>Employee Dashboard</div>} />
        <Route path="/employee/leave" element={<LeaveForm />} />
        <Route path="/employee/calendar" element={<EmployeeCalendar />} />
        <Route path="/employee/history" element={<LeaveHistory />} />
        <Route path="/manager/history" element={<LeaveHistory />} />
        <Route path="/manager/leaves" element={<ManageLeaves />} />
        <Route path="/manager/calendar" element={<ManagerCalendar />} />
      </Routes>
    </BrowserRouter>
  );
}

export default App;
