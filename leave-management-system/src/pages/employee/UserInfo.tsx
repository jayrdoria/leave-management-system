import {
  UserCircleIcon,
  EnvelopeIcon,
  BuildingOffice2Icon,
  BanknotesIcon,
  IdentificationIcon,
  LockClosedIcon,
} from "@heroicons/react/24/solid";
import { useEffect, useState } from "react";
import axios from "axios";
import toast from "react-hot-toast";

const UserInfo = () => {
  const [user, setUser] = useState(() =>
    JSON.parse(localStorage.getItem("user") || "{}")
  );
  const [liveCredits, setLiveCredits] = useState<number | null>(null);
  const [showPasswordForm, setShowPasswordForm] = useState(false);
  const [currentPassword, setCurrentPassword] = useState("");
  const [newPassword, setNewPassword] = useState("");

  const API = process.env.REACT_APP_API_BASE_URL;
  const userId = user?._id;

  useEffect(() => {
    if (!userId) return;

    const fetchLeaveCredits = async () => {
      try {
        const res = await axios.get(`${API}/users/${userId}`);
        const history = res.data.leaveCreditHistory || [];
        const today = new Date();

        const validCredits = history
          .filter((entry: any) => new Date(entry.expiresOn) >= today)
          .reduce((sum: number, entry: any) => sum + entry.amount, 0);

        setLiveCredits(validCredits);
      } catch (err) {
        console.error("Failed to refresh leave credits", err);
      }
    };

    fetchLeaveCredits();
    const interval = setInterval(fetchLeaveCredits, 5000);
    return () => clearInterval(interval);
  }, [userId]);

  const handlePasswordChange = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const res = await axios.put(
        `${API}/users/change-password`,
        {
          userId: user._id,
          currentPassword,
          newPassword,
        },
        {
          headers: {
            Authorization: `Bearer ${localStorage.getItem("token")}`,
          },
        }
      );
      toast.success(res.data.msg || "Password updated successfully");
      setCurrentPassword("");
      setNewPassword("");
      setShowPasswordForm(false);
    } catch (err: any) {
      const errorMsg = err.response?.data?.msg || "Failed to update password.";
      toast.error(errorMsg);
    }
  };

  return (
    <div className="min-h-screen bg-gray-100 p-6">
      <div className="max-w-3xl mx-auto bg-white rounded-xl shadow-md p-6">
        {/* Header */}
        <div className="flex items-center gap-4 mb-6">
          <UserCircleIcon className="w-16 h-16 text-blue-500" />
          <div>
            <h2 className="text-2xl font-bold text-gray-800">{user.name}</h2>
            <p className="text-gray-500">{user.email}</p>
          </div>
        </div>

        {/* Info Grid */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-6 text-sm">
          <div>
            <span className="block text-gray-400 mb-1">Email</span>
            <span className="flex items-center gap-2 font-medium">
              <EnvelopeIcon className="w-5 h-5 text-gray-500" />
              {user.email}
            </span>
          </div>
          <div>
            <span className="block text-gray-400 mb-1">Department</span>
            <span className="flex items-center gap-2 font-medium">
              <BuildingOffice2Icon className="w-5 h-5 text-gray-500" />
              {user.department || "—"}
            </span>
          </div>
          <div>
            <span className="block text-gray-400 mb-1">Leave Credits</span>
            <span className="flex items-center gap-2 font-medium">
              <BanknotesIcon className="w-5 h-5 text-green-600" />
              {liveCredits !== null ? liveCredits : user.leaveCredits ?? 0}
            </span>
          </div>
          <div>
            <span className="block text-gray-400 mb-1">Role</span>
            <span className="flex items-center gap-2 font-medium capitalize">
              <IdentificationIcon className="w-5 h-5 text-gray-500" />
              {user.role}
            </span>
          </div>
        </div>

        {/* Change Password Section */}
        <div className="mt-6">
          <button
            className="text-sm text-blue-600 hover:underline font-medium"
            onClick={() => {
              setShowPasswordForm((prev) => !prev);
              setCurrentPassword("");
              setNewPassword("");
            }}
          >
            {showPasswordForm ? "Cancel Password Change" : "Change Password"}
          </button>

          {showPasswordForm && (
            <form onSubmit={handlePasswordChange} className="mt-4 space-y-4">
              <div>
                <label className="block text-sm text-gray-600 mb-1">
                  Current Password
                </label>
                <input
                  type="password"
                  value={currentPassword}
                  onChange={(e) => setCurrentPassword(e.target.value)}
                  required
                  className="w-full px-3 py-2 border rounded-md text-sm"
                />
              </div>

              <div>
                <label className="block text-sm text-gray-600 mb-1">
                  New Password
                </label>
                <input
                  type="password"
                  value={newPassword}
                  onChange={(e) => setNewPassword(e.target.value)}
                  required
                  minLength={6}
                  className="w-full px-3 py-2 border rounded-md text-sm"
                />
              </div>

              <button
                type="submit"
                className="inline-flex items-center gap-2 px-4 py-2 bg-blue-600 text-white text-sm rounded-md hover:bg-blue-700"
              >
                <LockClosedIcon className="w-4 h-4" />
                Save New Password
              </button>
            </form>
          )}
        </div>

        {/* Footer */}
        <div className="mt-6 border-t pt-4 text-xs text-gray-400 flex items-center gap-2">
          <UserCircleIcon className="w-4 h-4" />
          This information is read-only. Contact HR for any changes.
        </div>
      </div>
    </div>
  );
};

export default UserInfo;
