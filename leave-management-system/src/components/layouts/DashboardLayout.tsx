import { useNavigate, Outlet, useLocation } from "react-router-dom";

interface Props {
  role: "admin" | "manager" | "employee";
}

const DashboardLayout = ({ role }: Props) => {
  const navigate = useNavigate();
  const location = useLocation();
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

  const isActive = (path: string) => location.pathname === path;

  return (
    <div className="flex h-screen bg-gray-50 text-gray-800">
      {/* Sidebar */}
      <aside className="w-64 bg-white border-r flex flex-col shadow-sm">
        {/* Header */}
        <div className="p-6 border-b">
          <h1 className="text-xl font-bold text-blue-600">🌿 Leave System</h1>
          <div className="mt-3 text-sm text-gray-700">
            <p className="font-semibold truncate">{user.name}</p>
            {user.department && (
              <p className="text-gray-500">{user.department} Department</p>
            )}
            <p className="text-gray-400 capitalize">{user.role}</p>
          </div>
        </div>

        {/* Navigation */}
        <nav className="flex-grow overflow-y-auto">
          <div className="p-4 space-y-1">
            {links[role]
              .filter(
                (link) =>
                  role !== "admin" ||
                  ![
                    "Admin Apply Leave",
                    "User Management",
                    "Manual Leave Credit",
                    "Admin Leave Control",
                    "Leave Credit Usage",
                  ].includes(link.label)
              )
              .map((link) => (
                <button
                  key={link.path}
                  onClick={() => navigate(link.path)}
                  className={`w-full text-left px-3 py-2 rounded-md text-sm transition ${
                    isActive(link.path)
                      ? "bg-blue-100 text-blue-700 font-medium"
                      : "hover:bg-gray-100 hover:text-blue-600"
                  }`}
                >
                  {link.label}
                </button>
              ))}
          </div>

          {/* Admin-Only */}
          {role === "admin" && (
            <div className="mt-2 px-4">
              <hr className="my-3 border-gray-200" />
              <p className="text-xs font-semibold text-gray-500 mb-2 uppercase">
                Admin Functions
              </p>
              <div className="space-y-1">
                {links.admin
                  .filter((link) =>
                    [
                      "Admin Apply Leave",
                      "User Management",
                      "Manual Leave Credit",
                      "Admin Leave Control",
                      "Leave Credit Usage",
                    ].includes(link.label)
                  )
                  .map((link) => (
                    <button
                      key={link.path}
                      onClick={() => navigate(link.path)}
                      className={`w-full text-left px-3 py-2 rounded-md text-sm transition ${
                        isActive(link.path)
                          ? "bg-blue-100 text-blue-700 font-medium"
                          : "hover:bg-gray-100 hover:text-blue-600"
                      }`}
                    >
                      {link.label}
                    </button>
                  ))}
              </div>
            </div>
          )}
        </nav>

        {/* Footer */}
        <div className="p-4 border-t">
          <button
            onClick={handleLogout}
            className="w-full py-2 text-sm font-medium bg-red-500 text-white rounded-md hover:bg-red-600 transition"
          >
            Logout
          </button>
        </div>
      </aside>

      {/* Main Content */}
      <main className="flex-1 overflow-y-auto p-6 bg-gray-50">
        <Outlet />
      </main>
    </div>
  );
};

export default DashboardLayout;
