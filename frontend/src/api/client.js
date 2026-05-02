const BASE = "http://localhost:8000/api";

// ─── Audio Management ───────────────────────────────────────────
export async function fetchAudioList({
  class_label,
  limit = 50,
  offset = 0,
} = {}) {
  const params = new URLSearchParams({ limit, offset });
  if (class_label) params.set("class_label", class_label);
  const res = await fetch(`${BASE}/audio?${params}`);
  if (!res.ok) throw new Error(await res.text());
  return res.json();
}

export async function fetchAudioById(id) {
  const res = await fetch(`${BASE}/audio/${id}`);
  if (!res.ok) throw new Error(await res.text());
  return res.json();
}

export async function deleteAudio(id) {
  const res = await fetch(`${BASE}/audio/${id}`, { method: "DELETE" });
  if (!res.ok) throw new Error(await res.text());
  return res.json();
}

// ─── Search ─────────────────────────────────────────────────────
export async function searchAudio({ file, top_k = 5, filter_class }) {
  const form = new FormData();
  form.append("file", file);
  const params = new URLSearchParams({ top_k });
  if (filter_class) params.set("filter_class", filter_class);
  const res = await fetch(`${BASE}/search?${params}`, {
    method: "POST",
    body: form,
  });
  if (!res.ok) throw new Error(await res.text());
  return res.json();
}

// ─── Stats ──────────────────────────────────────────────────────
export async function fetchStats() {
  const res = await fetch(`${BASE}/stats`);
  if (!res.ok) throw new Error(await res.text());
  return res.json();
}

export async function fetchCollectionInfo() {
  const res = await fetch(`${BASE}/stats/collection`);
  if (!res.ok) throw new Error(await res.text());
  return res.json();
}
