import React, { useEffect, useState } from "react";
import axios from "axios";
import toast from "react-hot-toast";

interface User {
  _id: string;
  name: string;
  email: string;
  role: string;
  department: string;
  departmentScope: string[];
  leaveCredits: number;
  country?: string;
  sex?: string; // ✅ added
}

const DEPARTMENTS = [
  "HR",
  "Tech",
  "VIP",
  "CS",
  "Acquisition",
  "Marketing (CRM & Creative team)",
  "Operations & Analytics",
];

const COUNTRIES = ["PH", "Malta"];

const AdminUserManagement: React.FC = () => {
  const [users, setUsers] = useState<User[]>([]);
  const [form, setForm] = useState<Partial<User> & { password?: string }>({});
  const [editingId, setEditingId] = useState<string | null>(null);

  const API = process.env.REACT_APP_API_BASE_URL;

  const fetchUsers = async () => {
    try {
      const res = await axios.get(`${API}/users`);
      setUsers(res.data);
    } catch (err) {
      toast.error("Failed to fetch users");
    }
  };

  useEffect(() => {
    fetchUsers();
  }, []);

  const handleChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>
  ) => {
    const { name, value } = e.target;
    setForm({ ...form, [name]: value });
  };

  const handleSubmit = async () => {
    try {
      if (
        !form.name ||
        !form.email ||
        !form.role ||
        !form.department ||
        !form.country ||
        !form.sex
      ) {
        return toast.error("Please fill in all required fields");
      }

      if (editingId) {
        const updatedData: any = {
          name: form.name,
          email: form.email,
          role: form.role,
          department: form.department,
          departmentScope: form.departmentScope || [],
          leaveCredits: form.leaveCredits,
          country: form.country,
          sex: form.sex, // ✅ added
        };

        if (form.password && form.password.trim() !== "") {
          updatedData.passwordHash = form.password;
        }

        await axios.patch(`${API}/users/${editingId}`, updatedData);
        toast.success("User updated");
      } else {
        if (!form.password || form.password.trim() === "") {
          return toast.error("Please set a password for the new user");
        }

        const newUserData: any = {
          name: form.name,
          email: form.email,
          role: form.role,
          department: form.department,
          departmentScope: form.departmentScope || [],
          leaveCredits: form.leaveCredits ?? 15,
          passwordHash: form.password,
          country: form.country,
          sex: form.sex, // ✅ added
        };

        await axios.post(`${API}/users`, newUserData);
        toast.success("User created");
      }

      setForm({});
      setEditingId(null);
      fetchUsers();
    } catch (err) {
      toast.error("Failed to save user");
      console.error("Submit error:", err);
    }
  };

  const handleEdit = (user: User) => {
    setEditingId(user._id);
    setForm({ ...user, password: "" });
  };

  const handleDelete = async (id: string) => {
    if (!window.confirm("Are you sure you want to delete this user?")) return;

    try {
      await axios.delete(`${API}/users/${id}`);
      toast.success("User deleted");
      fetchUsers();
    } catch {
      toast.error("Failed to delete user");
    }
  };

  return (
    <div className="max-w-6xl mx-auto px-4 py-8">
      <h1 className="text-3xl font-bold mb-6 text-gray-800">
        Admin Panel – User Management
      </h1>

      <div className="bg-white shadow rounded-lg p-6 mb-8">
        <h2 className="text-xl font-semibold mb-4">
          {editingId ? "Edit User" : "Add New User"}
        </h2>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label className="text-sm text-gray-600">Name</label>
            <input
              type="text"
              name="name"
              value={form.name || ""}
              onChange={handleChange}
              className="w-full mt-1 border rounded px-3 py-2 text-sm"
              placeholder="Enter name"
            />
          </div>
          <div>
            <label className="text-sm text-gray-600">Email</label>
            <input
              type="email"
              name="email"
              value={form.email || ""}
              onChange={handleChange}
              className="w-full mt-1 border rounded px-3 py-2 text-sm"
              placeholder="Enter email"
            />
          </div>
          <div>
            <label className="text-sm text-gray-600">Role</label>
            <select
              name="role"
              value={form.role || ""}
              onChange={handleChange}
              className="w-full mt-1 border rounded px-3 py-2 text-sm"
            >
              <option value="">Select Role</option>
              <option value="admin">Admin</option>
              <option value="manager">Manager</option>
              <option value="employee">Employee</option>
            </select>
          </div>
          <div>
            <label className="text-sm text-gray-600">Country</label>
            <select
              name="country"
              value={form.country || ""}
              onChange={handleChange}
              className="w-full mt-1 border rounded px-3 py-2 text-sm"
            >
              <option value="">Select Country</option>
              {COUNTRIES.map((c) => (
                <option key={c} value={c}>
                  {c}
                </option>
              ))}
            </select>
          </div>
          <div>
            <label className="text-sm text-gray-600">Sex</label>
            <select
              name="sex"
              value={form.sex || ""}
              onChange={handleChange}
              className="w-full mt-1 border rounded px-3 py-2 text-sm"
            >
              <option value="">Select Sex</option>
              <option value="Male">Male</option>
              <option value="Female">Female</option>
            </select>
          </div>
          <div>
            <label className="text-sm text-gray-600">Department</label>
            <select
              name="department"
              value={form.department || ""}
              onChange={handleChange}
              className="w-full mt-1 border rounded px-3 py-2 text-sm"
            >
              <option value="">Select Department</option>
              {DEPARTMENTS.map((dept) => (
                <option key={dept} value={dept}>
                  {dept}
                </option>
              ))}
            </select>
          </div>
          <div>
            <label className="text-sm text-gray-600 mb-1 block">
              Department Scope
            </label>
            <div className="border rounded px-3 py-2 text-sm h-auto max-h-48 overflow-y-auto space-y-1">
              {DEPARTMENTS.map((dept) => (
                <label key={dept} className="flex items-center gap-2">
                  <input
                    type="checkbox"
                    value={dept}
                    checked={form.departmentScope?.includes(dept) || false}
                    onChange={(e) => {
                      const checked = e.target.checked;
                      const value = e.target.value;
                      const current = form.departmentScope || [];

                      setForm({
                        ...form,
                        departmentScope: checked
                          ? [...current, value]
                          : current.filter((d) => d !== value),
                      });
                    }}
                  />
                  <span>{dept}</span>
                </label>
              ))}
            </div>
          </div>
          <div>
            <label className="text-sm text-gray-600">Leave Credits</label>
            <input
              type="number"
              name="leaveCredits"
              value={form.leaveCredits ?? ""}
              onChange={handleChange}
              className="w-full mt-1 border rounded px-3 py-2 text-sm"
              placeholder="e.g. 15"
            />
          </div>
          <div>
            <label className="text-sm text-gray-600">
              Password {editingId ? "(optional)" : ""}
            </label>
            <input
              type="password"
              name="password"
              value={form.password || ""}
              onChange={handleChange}
              className="w-full mt-1 border rounded px-3 py-2 text-sm"
              placeholder={
                editingId
                  ? "Leave blank to keep current password"
                  : "Set user password"
              }
            />
          </div>
        </div>

        <div className="mt-6 text-right">
          <button
            onClick={handleSubmit}
            className="bg-blue-600 hover:bg-blue-700 text-white px-6 py-2 rounded text-sm font-medium"
          >
            {editingId ? "Update User" : "Create User"}
          </button>
        </div>
      </div>

      <div className="bg-white shadow rounded-lg overflow-x-auto">
        <table className="w-full text-sm text-left">
          <thead className="bg-gray-100 text-gray-700 uppercase text-xs">
            <tr>
              <th className="px-4 py-3">Name</th>
              <th className="px-4 py-3">Email</th>
              <th className="px-4 py-3">Role</th>
              <th className="px-4 py-3">Department</th>
              <th className="px-4 py-3">Scope</th>
              <th className="px-4 py-3">Credits</th>
              <th className="px-4 py-3">Sex</th>
              <th className="px-4 py-3">Actions</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-100 text-sm text-gray-800">
            {users.map((user) => (
              <tr key={user._id} className="hover:bg-gray-50 align-top">
                <td className="px-4 py-3 font-medium">{user.name}</td>
                <td className="px-4 py-3 text-gray-600">{user.email}</td>
                <td className="px-4 py-3 capitalize">{user.role}</td>
                <td className="px-4 py-3">{user.department}</td>
                <td className="px-4 py-3 max-w-xs">
                  {user.departmentScope?.length > 0 ? (
                    <div className="flex flex-wrap gap-2">
                      {user.departmentScope.map((scope) => (
                        <span
                          key={scope}
                          className="bg-gray-100 border border-gray-300 rounded-full px-2 py-0.5 text-xs text-gray-700"
                        >
                          {scope}
                        </span>
                      ))}
                    </div>
                  ) : (
                    <span className="text-xs text-gray-400 italic">None</span>
                  )}
                </td>
                <td className="px-4 py-3">{user.leaveCredits}</td>
                <td className="px-4 py-3">{user.sex || "-"}</td>
                <td className="px-4 py-3 text-right whitespace-nowrap">
                  <div className="flex justify-end gap-3">
                    <button
                      onClick={() => handleEdit(user)}
                      className="text-blue-600 hover:underline text-sm"
                    >
                      Edit
                    </button>
                    <button
                      onClick={() => handleDelete(user._id)}
                      className="text-red-600 hover:underline text-sm"
                    >
                      Delete
                    </button>
                  </div>
                </td>
              </tr>
            ))}

            {users.length === 0 && (
              <tr>
                <td
                  colSpan={8} // ✅ updated colSpan to match new column count
                  className="px-4 py-6 text-center text-gray-500 italic"
                >
                  No users found.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
};

export default AdminUserManagement;
