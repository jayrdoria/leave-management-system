import { useNavigate, Outlet } from "react-router-dom";

interface Props {
  role: "admin" | "manager" | "employee";
}

const DashboardLayout = ({ role }: Props) => {
  const navigate = useNavigate();
  const user = JSON.parse(localStorage.getItem("user") || "{}");

  const links = {
    admin: [
      { label: "Dashboard", path: "/admin" },
      { label: "Manage Leaves", path: "/admin/leaves" },
      { label: "Calendar", path: "/admin/calendar" },
      { label: "Leave History", path: "/admin/history" },
      { label: "User Info", path: "/admin/profile" },
      { label: "Admin Apply Leave", path: "/admin/apply-leave" },
      { label: "User Management", path: "/admin/user-management" },
      { label: "Manual Leave Credit", path: "/admin/manual-leave-credit" },
      { label: "Admin Leave Control", path: "/admin/admin-leave-control" },
      { label: "Leave Credit Usage", path: "/admin/leave-credit-usage" },
    ],
    manager: [
      { label: "Dashboard", path: "/manager" },
      { label: "Manage Leaves", path: "/manager/leaves" },
      { label: "Calendar", path: "/manager/calendar" },
      { label: "Leave History", path: "/manager/history" },
      { label: "User Info", path: "/manager/profile" },
    ],
    employee: [
      { label: "Dashboard", path: "/employee" },
      { label: "Calendar", path: "/employee/calendar" },
      { label: "Leave History", path: "/employee/history" },
      { label: "User Info", path: "/employee/profile" },
    ],
  };

  const handleLogout = () => {
    localStorage.removeItem("token");
    localStorage.removeItem("user");
    navigate("/");
  };

  return (
    <div className="flex h-screen overflow-hidden bg-gray-100">
      {/* Sidebar */}
      <aside className="w-64 bg-white shadow-lg flex flex-col h-screen">
        {/* Top: Logo and Navigation */}
        <div className="flex-grow">
          <div className="p-6 border-b">
            <h1 className="text-xl font-bold text-blue-600 mb-2">
              🌿 LeaveSys
            </h1>
            <div className="text-sm text-gray-700 mt-2">
              <p className="font-semibold truncate">{user.name}</p>
              {user.department && (
                <p className="text-gray-500">{user.department} Department</p>
              )}
              <p className="text-gray-400 capitalize">{user.role}</p>
            </div>
          </div>

          <nav className="p-4 space-y-2">
            {/* Role-based links except for admin-only pages */}
            {links[role]
              .filter(
                (link) =>
                  role !== "admin" ||
                  (link.label !== "Admin Apply Leave" &&
                    link.label !== "User Management" &&
                    link.label !== "Manual Leave Credit" &&
                    link.label !== "Admin Leave Control" &&
                    link.label !== "Leave Credit Usage")
              )
              .map((link) => (
                <button
                  key={link.path}
                  onClick={() => navigate(link.path)}
                  className="block text-left text-gray-700 hover:text-blue-600 py-2 px-3 rounded hover:bg-gray-100 w-full"
                >
                  {link.label}
                </button>
              ))}

            {/* Admin-only section */}
            {role === "admin" && (
              <>
                <hr className="my-2 border-gray-200" />
                <p className="text-xs font-semibold text-gray-500 px-3">
                  Admin Functions
                </p>
                {links.admin
                  .filter(
                    (link) =>
                      link.label === "Admin Apply Leave" ||
                      link.label === "User Management" ||
                      link.label === "Manual Leave Credit" ||
                      link.label === "Admin Leave Control" ||
                      link.label === "Leave Credit Usage"
                  )
                  .map((link) => (
                    <button
                      key={link.path}
                      onClick={() => navigate(link.path)}
                      className="block text-left text-gray-700 hover:text-blue-600 py-2 px-3 rounded hover:bg-gray-100 w-full"
                    >
                      {link.label}
                    </button>
                  ))}
              </>
            )}
          </nav>
        </div>

        {/* Bottom: Logout */}
        <div className="p-4 border-t">
          <button
            onClick={handleLogout}
            className="bg-red-500 text-white w-full py-2 rounded hover:bg-red-600"
          >
            Logout
          </button>
        </div>
      </aside>

      {/* Main content */}
      <main className="flex-1 overflow-y-auto p-6">
        <Outlet /> {/* ✅ Renders the active child route */}
      </main>
    </div>
  );
};

export default DashboardLayout;
