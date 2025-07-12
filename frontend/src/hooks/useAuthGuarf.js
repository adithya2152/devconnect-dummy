import { useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { jwtDecode } from "jwt-decode";

const useAuthGuard = () => {
  const navigate = useNavigate();

  useEffect(() => {
    const token = localStorage.getItem("access_token");

    // If token is missing, redirect to login
    if (!token) {
      navigate("/login");
      return;
    }

    try {
      // Decode the token and check expiration
      const decoded = jwtDecode(token);
      const isExpired = decoded.exp * 1000 < Date.now();

      if (isExpired) {
        console.warn("Token expired.");
        navigate("/login");
        return;
      }

      // Optional: ping backend to verify token server-side
      fetch("http://localhost:8000/api/protected", {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      })
        .then((res) => {
          if (!res.ok) {
            throw new Error("Invalid or expired token");
          }
        })
        .catch(() => {
          navigate("/login");
        });
    } catch (err) {
      console.error("Invalid token:", err);
      navigate("/login");
    }
  }, [navigate]);
};

export default useAuthGuard;
