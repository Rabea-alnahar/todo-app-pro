export function setToken(token: string) {
  localStorage.setItem("token", token);
  window.dispatchEvent(new Event("auth-changed"));
}

export function clearToken() {
  localStorage.removeItem("token");
  window.dispatchEvent(new Event("auth-changed"));
}

export function getToken() {
  return localStorage.getItem("token");
}

export function isAuthed() {
  return !!getToken();
}