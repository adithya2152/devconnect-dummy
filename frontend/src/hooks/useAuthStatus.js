import { useState, useEffect } from "react";

export const useAuthStatus = () => {
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [loading, setLoading] = useState(true); // loading indicator

  useEffect(() => {
    const token = localStorage.getItem("access_token");

    if (!token) {
      setIsAuthenticated(false);
      setLoading(false);
      return;
    }

    fetch("http://localhost:8000/api/protected", {
      headers: {
        Authorization: `Bearer ${token}`,
      },
    })
      .then((res) => {
        if (res.ok) {
          setIsAuthenticated(true);
        } else {
          throw new Error("Unauthorized");
        }
      })
      .catch(() => {
        localStorage.removeItem("access_token");
        setIsAuthenticated(false);
      })
      .finally(() => {
        setLoading(false);
      });
  }, []);

  return { isAuthenticated, loading };
};
