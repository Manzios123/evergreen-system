
import { apiFetch } from "@/lib/api";

export async function login(email: string, password: string) {
  const data = await apiFetch("/api/auth/login", {
    method: "POST",
    body: JSON.stringify({ email, password }),
  });

  if (data.token) {
    localStorage.setItem("evergreen_token", data.token);
  }

  return data;
}

export function logout() {
  localStorage.removeItem("evergreen_token");
  window.location.href = "/"; // Force reload to clear state
}

export function getCurrentUser() {
  const token = localStorage.getItem("evergreen_token");
  if (!token) return null;
  
  try {
    const payload = JSON.parse(atob(token.split('.')[1]));
    return payload;
  } catch (err) {
    localStorage.removeItem("evergreen_token");
    return null;
  }
}

export function isAuthenticated() {
  const token = localStorage.getItem("evergreen_token");
  if (!token) return false;
  
  try {
    const payload = JSON.parse(atob(token.split('.')[1]));
    // Check if token is expired
    if (payload.exp && payload.exp * 1000 < Date.now()) {
      localStorage.removeItem("evergreen_token");
      return false;
    }
    return true;
  } catch (err) {
    localStorage.removeItem("evergreen_token");
    return false;
  }
}
