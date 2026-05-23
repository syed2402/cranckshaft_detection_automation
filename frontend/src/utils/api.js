const BASE_URL = import.meta.env.VITE_API_BASE_URL || "http://localhost:8765";

async function request(path, options = {}) {
  try {
    const response = await fetch(`${BASE_URL}${path}`, options);
    const data = await response.json().catch(() => ({}));
    if (!response.ok) {
      throw new Error(data.detail || data.message || `Request failed with status ${response.status}`);
    }
    return data;
  } catch (error) {
    if (error instanceof TypeError) {
      throw new Error("Cannot connect to backend. Ensure FastAPI server is running on port 8765.");
    }
    throw error;
  }
}

export function uploadProfile(file) {
  const body = new FormData();
  body.append("file", file);
  return request("/api/upload", { method: "POST", body });
}

export function analyzeProfile(profileId) {
  return request(`/api/analyze/${profileId}`, { method: "POST" });
}

export function getAllProfiles() {
  return request("/api/profiles");
}

export function getProfile(profileId) {
  return request(`/api/profiles/${profileId}`);
}

export function deleteProfile(profileId) {
  return request(`/api/profiles/${profileId}`, { method: "DELETE" });
}

export function getTrendData() {
  return request("/api/trend");
}

export function submitOverride(profileId, decision, notes, operator) {
  return request("/api/override", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      profile_id: profileId,
      operator_decision: decision,
      operator_notes: notes,
      operator_name: operator,
    }),
  });
}

export function getStats() {
  return request("/api/stats");
}
