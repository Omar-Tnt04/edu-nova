const AUTH_URL = process.env.NEXT_PUBLIC_API_URL || "http://127.0.0.1:8002";
const TUTOR_URL = process.env.NEXT_PUBLIC_TUTOR_URL || "http://127.0.0.1:8000";
const PIPELINE_URL = process.env.NEXT_PUBLIC_PIPELINE_URL || "http://127.0.0.1:8001";

function getBaseUrl(endpoint: string) {
  if (endpoint.startsWith("/upload") || endpoint.startsWith("/query")) return PIPELINE_URL;
  if (endpoint.startsWith("/tutor") || endpoint.startsWith("/quiz") || endpoint.startsWith("/flashcards") || endpoint.startsWith("/concept") || endpoint.startsWith("/progress")) return TUTOR_URL;
  return AUTH_URL;
}

export async function fetchApi(endpoint: string, options: RequestInit = {}) {
  const token = typeof window !== 'undefined' ? localStorage.getItem('access_token') : null;
  
  const headers = {
    "Content-Type": "application/json",
    ...(token ? { Authorization: `Bearer ${token}` } : {}),
    ...options.headers,
  };

  const baseUrl = getBaseUrl(endpoint);

  const response = await fetch(`${baseUrl}${endpoint}`, {
    ...options,
    headers,
  });

  if (!response.ok) {
    const errorData = await response.json().catch(() => ({}));
    throw new Error(errorData.detail || "API request failed");
  }

  return response.json();
}
