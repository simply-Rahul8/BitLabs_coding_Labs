import { useCallback, useMemo, useState } from "react";
import { User } from "../types";

export function useAuth() {
  const [token, setToken] = useState(() => window.localStorage.getItem("bitlabs_token"));
  const [user, setUser] = useState<User | null>(null);

  const login = useCallback((nextToken: string, nextUser: User) => {
    window.localStorage.setItem("bitlabs_token", nextToken);
    setToken(nextToken);
    setUser(nextUser);
  }, []);

  const logout = useCallback(() => {
    window.localStorage.removeItem("bitlabs_token");
    setToken(null);
    setUser(null);
  }, []);

  return useMemo(
    () => ({
      isAuthenticated: Boolean(token),
      token,
      user,
      login,
      logout
    }),
    [login, logout, token, user]
  );
}
