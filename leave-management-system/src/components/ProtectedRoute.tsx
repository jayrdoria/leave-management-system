import { Navigate, Outlet, useLocation } from "react-router-dom";
import axios from "axios";
import { useEffect, useState } from "react";

const API = process.env.REACT_APP_API_BASE_URL;

const ProtectedRoute = () => {
  const location = useLocation();
  const [isValid, setIsValid] = useState<boolean | null>(null);

  useEffect(() => {
    const validateToken = async () => {
      const token = localStorage.getItem("token");
      if (!token) return setIsValid(false);

      try {
        await axios.get(`${API}/auth/validate`, {
          headers: { Authorization: `Bearer ${token}` },
        });
        setIsValid(true);
      } catch (err) {
        localStorage.removeItem("token");
        setIsValid(false);
      }
    };

    validateToken();
  }, []);

  if (isValid === null) {
    return <div className="p-10 text-gray-500">Checking authentication...</div>; // optional loading state
  }

  console.log("Validating token:", localStorage.getItem("token"));

  return isValid ? (
    <Outlet />
  ) : (
    <Navigate to="/" state={{ from: location }} replace />
  );
};

export default ProtectedRoute;
