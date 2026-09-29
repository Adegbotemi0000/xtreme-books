import { createContext, useContext, useEffect, useState } from "react";
import { api, getToken, setToken } from "./api/client";

const AuthContext = createContext(null);

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null);
  const [tenant, setTenant] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!getToken()) {
      setLoading(false);
      return;
    }
    api
      .get("/auth/me")
      .then((data) => setUser(data.user))
      .then(() => api.get("/tenants/me"))
      .then(setTenant)
      .catch(() => setToken(null))
      .finally(() => setLoading(false));
  }, []);

  function login({ token, user, tenant: signupTenant }) {
    setToken(token);
    setUser(user);
    if (signupTenant) {
      setTenant(signupTenant);
    } else {
      api.get("/tenants/me").then(setTenant);
    }
  }

  function logout() {
    setToken(null);
    setUser(null);
    setTenant(null);
  }

  function refreshTenant() {
    return api.get("/tenants/me").then(setTenant);
  }

  return (
    <AuthContext.Provider value={{ user, tenant, setTenant, refreshTenant, loading, login, logout }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  return useContext(AuthContext);
}
