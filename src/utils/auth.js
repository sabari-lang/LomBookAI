// src/utils/auth.js
// Simple auth helpers for token management

export function isAuthenticated() {
  return (
    !!sessionStorage.getItem("token") || !!localStorage.getItem("token")
  );
}

export function clearAuth() {
  sessionStorage.removeItem("token");
  sessionStorage.removeItem("auth");
  localStorage.removeItem("token");
  localStorage.removeItem("auth");
}
