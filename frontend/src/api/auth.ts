import apiClient from "./client";

export type RegisterPayload = {
  email: string;
  password: string;
  role: "recruiter" | "candidate";
};

export type UserOut = {
  id: string;
  email: string;
  role: string;
};

export type TokenResponse = {
  access_token: string;
  token_type: string;
};

export async function register(payload: RegisterPayload): Promise<UserOut> {
  const response = await apiClient.post<UserOut>("/auth/register", payload);
  return response.data;
}

export async function login(email: string, password: string): Promise<TokenResponse> {
  const formData = new URLSearchParams();
  formData.append("username", email);
  formData.append("password", password);

  const response = await apiClient.post<TokenResponse>("/auth/login", formData, {
    headers: { "Content-Type": "application/x-www-form-urlencoded" },
  });
  return response.data;
}

export async function getCurrentUser(): Promise<UserOut> {
  const response = await apiClient.get<UserOut>("/auth/me");
  return response.data;
}

export function saveToken(token: string): void {
  window.localStorage.setItem("access_token", token);
}

export function clearToken(): void {
  window.localStorage.removeItem("access_token");
}

export function getStoredToken(): string | null {
  return window.localStorage.getItem("access_token");
}
