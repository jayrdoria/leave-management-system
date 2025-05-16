import {
  UserCircleIcon,
  EnvelopeIcon,
  BuildingOffice2Icon,
  BanknotesIcon,
  IdentificationIcon,
} from "@heroicons/react/24/solid";

const UserInfo = () => {
  const user = JSON.parse(localStorage.getItem("user") || "{}");

  return (
    <div className="min-h-screen bg-gray-100 p-6">
      <div className="max-w-3xl mx-auto bg-white rounded-xl shadow-md p-6">
        {/* Header with Name and Email */}
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
              {user.leaveCredits ?? 0}
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

        {/* Note */}
        <div className="mt-6 border-t pt-4 text-xs text-gray-400 flex items-center gap-2">
          <UserCircleIcon className="w-4 h-4" />
          This information is read-only. Contact HR for any changes.
        </div>
      </div>
    </div>
  );
};

export default UserInfo;
