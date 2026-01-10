import { apiFetch } from "./utils/api";

export async function login(email: string, password: string) {
  const data = await apiFetch("/auth/login", {
    method: "POST",
    body: JSON.stringify({ email, password }),
  });

  if (data.token) {
    localStorage.setItem("token", data.token);
  }

  return data;
}

export function logout() {
  localStorage.removeItem("token");
  // Force reload to clear any state
  if (typeof window !== "undefined") {
    window.location.href = "/";
  }
}

export function getCurrentUser() {
  if (typeof window === "undefined") return null;
  
  const token = localStorage.getItem("token");
  if (!token) return null;
  
  try {
    // JWT token is base64 encoded payload in the second part
    const payload = JSON.parse(atob(token.split('.')[1]));
    return payload;
  } catch (err) {
    localStorage.removeItem("token");
    return null;
  }
}

export function isAuthenticated() {
  if (typeof window === "undefined") return false;
  
  const token = localStorage.getItem("token");
  if (!token) return false;
  
  try {
    const payload = JSON.parse(atob(token.split('.')[1]));
    // Check if token is expired
    if (payload.exp && payload.exp * 1000 < Date.now()) {
      localStorage.removeItem("token");
      return false;
    }
    return true;
  } catch (err) {
    localStorage.removeItem("token");
    return false;
  }
}

export function getToken() {
  if (typeof window === "undefined") return null;
  return localStorage.getItem("token");
}

export function clearToken() {
  if (typeof window === "undefined") return;
  localStorage.removeItem("token");
}
