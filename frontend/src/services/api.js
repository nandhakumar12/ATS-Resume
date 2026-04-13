const API_BASE = import.meta?.env?.VITE_API_BASE || "/api";

const TOKEN_KEY = "ats_id_token";

function getToken() {
  return localStorage.getItem(TOKEN_KEY);
}

async function request(path, options = {}) {
  const token = getToken();
  const res = await fetch(`${API_BASE}${path}`, {
    headers: {
      ...(options.body instanceof FormData
        ? {}
        : { "Content-Type": "application/json" }),
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
      ...options.headers,
    },
    ...options,
  });
  if (res.status === 204) return null;
  if (!res.ok) {
    let detail = `API error: ${res.status}`;
    try {
      const err = await res.json();
      detail = err.detail || detail;
    } catch (e) {
      // Fallback for non-JSON errors (like 502 Proxy error)
      if (res.status === 502) detail = "Server is currently unavailable (502 Gateway Error). Please check if the backend is running.";
      if (res.status === 504) detail = "Server timed out (504 Gateway Timeout).";
      if (res.status === 401) detail = "Session expired. Please sign in again.";
    }
    throw new Error(detail);
  }
  return res.json();
}


export async function uploadResume(file) {
  const form = new FormData();
  form.append("file", file);
  return request("/resumes/upload", { method: "POST", body: form });
}

export async function fetchResumeHistory() {
  return request("/resumes/history");
}

export async function getResume(resumeId) {
  return request(`/resumes/${encodeURIComponent(resumeId)}`);
}

export async function updateResumeSkills(resumeId, skills) {
  return request(`/resumes/${encodeURIComponent(resumeId)}/skills`, {
    method: "PATCH",
    body: JSON.stringify({ skills }),
  });
}

export async function deleteResume(resumeId) {
  return request(`/resumes/${encodeURIComponent(resumeId)}`, { method: "DELETE" });
}

export async function scoreResume(payload) {
  return request("/resumes/score", {
    method: "POST",
    body: JSON.stringify({
      ...payload,
      resume_id: payload.resume_id || null,
      job_id: payload.job_id || null,
    }),
  });
}


export async function fetchJobs() {
  return request("/jobs/");
}

export async function createJob(payload) {
  return request("/jobs/", { method: "POST", body: JSON.stringify(payload) });
}

export async function updateJob(jobId, payload) {
  return request(`/jobs/${encodeURIComponent(jobId)}`, { method: "PUT", body: JSON.stringify(payload) });
}

export async function deleteJob(jobId) {
  return request(`/jobs/${encodeURIComponent(jobId)}`, { method: "DELETE" });
}

export async function checkHealth() {
  return request("/health");
}
