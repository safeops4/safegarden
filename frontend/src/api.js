const API_BASE_URL = import.meta.env.VITE_API_URL || "/api";

function getToken() {
  return localStorage.getItem("safeguardian_token");
}

function setToken(token) {
  localStorage.setItem("safeguardian_token", token);
}

function removeToken() {
  localStorage.removeItem("safeguardian_token");
}

function headers(extra = {}) {
  const h = { "Content-Type": "application/json", ...extra };
  const token = getToken();
  if (token) h["Authorization"] = `Bearer ${token}`;
  return h;
}

async function api(path, options = {}) {
  const url = `${API_BASE_URL}${path}`;
  const res = await fetch(url, { ...options, headers: headers(options.headers) });
  if (res.status === 401 && getToken()) {
    removeToken();
    localStorage.removeItem("safeguardian_user");
    window.location.href = "/login";
    throw new Error("Session expirée");
  }
  return res;
}

export { api, getToken, setToken, removeToken, API_BASE_URL };
