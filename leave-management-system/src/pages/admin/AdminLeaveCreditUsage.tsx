import { useEffect, useState } from "react";
import axios from "axios";

interface LeaveCredit {
  amount: number;
  expiresOn: string;
}

interface User {
  _id: string;
  name: string;
  email: string;
  leaveCreditHistory: LeaveCredit[];
}

const API = process.env.REACT_APP_API_BASE_URL;

const AdminLeaveCreditUsage = () => {
  const [users, setUsers] = useState<User[]>([]);
  const [loading, setLoading] = useState(true);

  const now = new Date();
  const currentYear = now.getFullYear();
  const years = [currentYear - 1, currentYear, currentYear + 1];

  useEffect(() => {
    const fetchUsers = async () => {
      try {
        const res = await axios.get(`${API}/users`);
        setUsers(res.data);
      } catch (err) {
        console.error("Error fetching users:", err);
      } finally {
        setLoading(false);
      }
    };

    fetchUsers();
  }, []);

  const sumCreditsForYear = (credits: LeaveCredit[], year: number) => {
    return credits
      .filter((c) => new Date(c.expiresOn).getFullYear() === year)
      .reduce((sum, c) => sum + c.amount, 0);
  };

  const getTotalValid = (credits: LeaveCredit[]) => {
    return credits
      .filter((c) => new Date(c.expiresOn) >= now)
      .reduce((sum, c) => sum + c.amount, 0);
  };

  const getYearLabel = (year: number) => {
    if (year === currentYear - 1)
      return <span className="text-red-500 text-xs ml-1">(Expired)</span>;
    if (year === currentYear)
      return <span className="text-green-600 text-xs ml-1">(Current)</span>;
    return <span className="text-blue-500 text-xs ml-1">(Next)</span>;
  };

  return (
    <div className="max-w-7xl mx-auto px-6 py-8">
      <div className="mb-6">
        <h1 className="text-3xl font-bold text-gray-800">
          Leave Credit Usage Overview
        </h1>
        <p className="text-sm text-gray-500 mt-1">
          Displays leave credit breakdown per user across expiration years.
        </p>
      </div>

      {loading ? (
        <p className="text-gray-600">Loading leave data...</p>
      ) : (
        <div className="bg-white border rounded-lg shadow overflow-x-auto">
          <table className="min-w-full text-sm text-left">
            <thead className="bg-gray-50 sticky top-0 z-10">
              <tr>
                <th className="px-5 py-3 font-semibold text-gray-600">
                  Employee
                </th>
                {years.map((year) => (
                  <th
                    key={year}
                    className="px-5 py-3 font-semibold text-gray-600 whitespace-nowrap"
                  >
                    {year} {getYearLabel(year)}
                  </th>
                ))}
                <th className="px-5 py-3 font-semibold text-gray-600">
                  Total Usable
                </th>
              </tr>
            </thead>
            <tbody>
              {users.map((user) => {
                const history = user.leaveCreditHistory || [];
                const totalsByYear = years.map((year) =>
                  sumCreditsForYear(history, year)
                );
                const totalUsable = getTotalValid(history);

                return (
                  <tr key={user._id} className="border-t hover:bg-gray-50">
                    <td className="px-5 py-3 font-medium text-gray-800 whitespace-nowrap">
                      {user.name}
                    </td>
                    {totalsByYear.map((total, idx) => (
                      <td
                        key={idx}
                        className={`px-5 py-3 whitespace-nowrap ${
                          years[idx] === currentYear - 1 && total > 0
                            ? "text-red-600 font-medium"
                            : "text-gray-800"
                        }`}
                      >
                        {total > 0 ? total : "-"}
                      </td>
                    ))}
                    <td className="px-5 py-3">
                      <span className="inline-block bg-blue-100 text-blue-700 font-semibold text-xs px-3 py-1 rounded-full">
                        {totalUsable} day{totalUsable !== 1 ? "s" : ""}
                      </span>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
};

export default AdminLeaveCreditUsage;
