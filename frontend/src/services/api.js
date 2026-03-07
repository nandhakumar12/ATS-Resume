const API_BASE = import.meta?.env?.VITE_API_BASE || "/api";

async function request(path, options = {}) {
  const res = await fetch(`${API_BASE}${path}`, {
    headers: {
      ...(options.body instanceof FormData
        ? {}
        : { "Content-Type": "application/json" }),
      ...options.headers,
    },
    ...options,
  });
  if (!res.ok) {
    throw new Error(`API error: ${res.status}`);
  }
  return res.json();
}

export async function uploadResume(file, jobDescription) {
  const form = new FormData();
  form.append("file", file);
  // jobDescription can later be sent to a dedicated endpoint if desired
  return request("/resumes/upload", {
    method: "POST",
    body: form,
  });
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

export async function fetchResumeHistory() {
  return request("/resumes/history");
}

