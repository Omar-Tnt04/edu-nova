export const PIPELINE_BASE_URL = process.env.NEXT_PUBLIC_PIPELINE_URL || "http://127.0.0.1:8001";
export const TUTOR_BASE_URL = process.env.NEXT_PUBLIC_TUTOR_URL || "http://127.0.0.1:8000";
export const AUTH_BASE_URL = process.env.NEXT_PUBLIC_API_URL || "http://127.0.0.1:8002";

export type SourceItem = {
  file?: string | null;
  page?: number | null;
  chunk_id?: string | null;
  score?: number | null;
};

export type TutorResponse = {
  response?: string;
  grounded?: boolean;
  stage?: string;
  topic?: string | null;
  difficulty?: string;
  session_id?: string | null;
  sources?: SourceItem[];
};

export type QuizQuestion = {
  question?: string;
  choices?: string[];
  options?: string[];
  correct_answer?: string;
  explanation?: string;
  sources?: SourceItem[];
};

export type QuizResponse = {
  topic?: string | null;
  difficulty?: string;
  session_id?: string | null;
  grounded?: boolean;
  questions?: QuizQuestion[];
  quiz?: QuizQuestion[];
};

export type Flashcard = {
  front?: string;
  back?: string;
  sources?: SourceItem[];
};

export type FlashcardResponse = {
  topic?: string | null;
  difficulty?: string;
  session_id?: string | null;
  grounded?: boolean;
  flashcards?: Flashcard[];
};

export type ConceptResponse = {
  concept?: string;
  explanation?: string;
  beginner_mode?: boolean;
  difficulty?: string;
  session_id?: string | null;
  grounded?: boolean;
  sources?: SourceItem[];
};

export type ProgressTopic = {
  topic: string;
  questions_asked: number;
  answers_seen: number;
  hints_used: number;
  mastery_score: number;
};

export type ProgressEvent = {
  timestamp: string;
  session_id: string;
  question: string;
  stage: string;
  topic: string;
  difficulty: string;
  hints_used_before_answer: number;
  grounded: boolean;
};

export type ProgressResponse = {
  total_questions: number;
  sessions_tracked: number;
  topics: ProgressTopic[];
  recent_events: ProgressEvent[];
};

function buildHeaders(options: RequestInit = {}) {
  const token = typeof window !== "undefined" ? localStorage.getItem("access_token") : null;
  const headers = new Headers(options.headers || {});
  if (token) {
    headers.set("Authorization", `Bearer ${token}`);
  }

  const body = options.body;
  const isFormData = typeof FormData !== "undefined" && body instanceof FormData;
  if (!isFormData && !headers.has("Content-Type")) {
    headers.set("Content-Type", "application/json");
  }

  return headers;
}

async function parseError(response: Response): Promise<string> {
  const text = await response.text();
  if (!text) {
    return `Request failed (${response.status})`;
  }

  try {
    const parsed = JSON.parse(text);
    if (typeof parsed?.detail === "string") {
      return parsed.detail;
    }
    if (typeof parsed?.message === "string") {
      return parsed.message;
    }
  } catch {
    // Plain text error payload
  }

  return text;
}

async function requestJson<T>(baseUrl: string, endpoint: string, options: RequestInit = {}): Promise<T> {
  const response = await fetch(`${baseUrl}${endpoint}`, {
    ...options,
    headers: buildHeaders(options),
  });

  if (!response.ok) {
    throw new Error(await parseError(response));
  }

  if (response.status === 204) {
    return {} as T;
  }

  const text = await response.text();
  if (!text) {
    return {} as T;
  }

  return JSON.parse(text) as T;
}

function resolveBaseUrl(endpoint: string): string {
  if (endpoint.startsWith("/upload") || endpoint.startsWith("/query")) {
    return PIPELINE_BASE_URL;
  }

  if (
    endpoint.startsWith("/tutor") ||
    endpoint.startsWith("/quiz") ||
    endpoint.startsWith("/flashcards") ||
    endpoint.startsWith("/concept") ||
    endpoint.startsWith("/progress") ||
    endpoint.startsWith("/health")
  ) {
    return TUTOR_BASE_URL;
  }

  return AUTH_BASE_URL;
}

export async function fetchApi<T = any>(endpoint: string, options: RequestInit = {}): Promise<T> {
  return requestJson<T>(resolveBaseUrl(endpoint), endpoint, options);
}

export async function getPipelineHealth(): Promise<{ status?: string }> {
  return requestJson<{ status?: string }>(PIPELINE_BASE_URL, "/health", { method: "GET" });
}

export async function getPipelineStatus(): Promise<{
  has_active_document?: boolean;
  active_document_id?: string | null;
  active_filename?: string | null;
}> {
  return requestJson<{
    has_active_document?: boolean;
    active_document_id?: string | null;
    active_filename?: string | null;
  }>(PIPELINE_BASE_URL, "/status", { method: "GET" });
}

export async function getTutorHealth(): Promise<{ status?: string }> {
  return requestJson<{ status?: string }>(TUTOR_BASE_URL, "/health", { method: "GET" });
}

export async function uploadPdf(file: File): Promise<{ filename?: string; pages?: number; chunks?: number }> {
  const formData = new FormData();
  formData.append("file", file);
  return requestJson<{ filename?: string; pages?: number; chunks?: number }>(PIPELINE_BASE_URL, "/upload", {
    method: "POST",
    body: formData,
  });
}

export async function askTutor(payload: {
  question: string;
  stage: "guide" | "hint1" | "hint2" | "answer";
  topic?: string;
  difficulty?: "beginner" | "intermediate" | "exam";
  session_id?: string;
}): Promise<TutorResponse> {
  return requestJson<TutorResponse>(TUTOR_BASE_URL, "/tutor", {
    method: "POST",
    body: JSON.stringify(payload),
  });
}

export async function generateQuiz(payload: {
  topic?: string;
  count?: number;
  difficulty?: "beginner" | "intermediate" | "exam";
  session_id?: string;
}): Promise<QuizResponse> {
  return requestJson<QuizResponse>(TUTOR_BASE_URL, "/quiz", {
    method: "POST",
    body: JSON.stringify(payload),
  });
}

export async function generateFlashcards(payload: {
  topic?: string;
  count?: number;
  difficulty?: "beginner" | "intermediate" | "exam";
  session_id?: string;
}): Promise<FlashcardResponse> {
  return requestJson<FlashcardResponse>(TUTOR_BASE_URL, "/flashcards", {
    method: "POST",
    body: JSON.stringify(payload),
  });
}

export async function explainConcept(payload: {
  concept: string;
  topic?: string;
  beginner_mode?: boolean;
  difficulty?: "beginner" | "intermediate" | "exam";
  session_id?: string;
}): Promise<ConceptResponse> {
  return requestJson<ConceptResponse>(TUTOR_BASE_URL, "/concept/explain", {
    method: "POST",
    body: JSON.stringify(payload),
  });
}

export async function getProgress(): Promise<ProgressResponse> {
  return requestJson<ProgressResponse>(TUTOR_BASE_URL, "/progress", { method: "GET" });
}
