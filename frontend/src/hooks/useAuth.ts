import { useCallback, useMemo, useState } from "react";
import { User } from "../types";

const AUTH_TOKEN_KEY = "access_token";
const LEGACY_AUTH_TOKEN_KEY = "bitlabs_token";

function getStoredToken() {
  return window.localStorage.getItem(AUTH_TOKEN_KEY) ?? window.localStorage.getItem(LEGACY_AUTH_TOKEN_KEY);
}

export function useAuth() {
  const [token, setToken] = useState<string | null>(() => getStoredToken());
  const [user, setUser] = useState<User | null>(null);

  const login = useCallback((nextToken: string, nextUser: User) => {
    window.localStorage.setItem(AUTH_TOKEN_KEY, nextToken);
    window.localStorage.setItem(LEGACY_AUTH_TOKEN_KEY, nextToken);
    setToken(nextToken);
    setUser(nextUser);
  }, []);

  const logout = useCallback(() => {
    window.localStorage.removeItem(AUTH_TOKEN_KEY);
    window.localStorage.removeItem(LEGACY_AUTH_TOKEN_KEY);
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
