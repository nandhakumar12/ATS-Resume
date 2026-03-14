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
  if (res.status === 204) return null; // DELETE returns no body
  if (!res.ok) {
    const err = await res.json().catch(() => ({ detail: res.statusText }));
    throw new Error(err.detail || `API error: ${res.status}`);
  }
  return res.json();
}

// ── Resumes ────────────────────────────────────────────────────────────────

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

// ── Jobs ──────────────────────────────────────────────────────────────────

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
