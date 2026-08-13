import apiClient from "./client";

export type RunPracticePayload = {
  source_code: string;
  language: string;
  stdin?: string;
};

export type RunPracticeResponse = {
  stdout: string;
  stderr: string;
  exit_code: number;
  timed_out: boolean;
  error?: string | null;
};

export type AIHintPayload = {
  source_code: string;
  language: string;
  user_question?: string;
};

export type AIHintResponse = {
  hint: string;
};

export type AIEvaluatePayload = {
  source_code: string;
  language: string;
  stdout: string;
  problem_description?: string;
};

export type AIEvaluateResponse = {
  is_correct: boolean;
  score: number;
  feedback: string;
  improvements: string[];
};

export type LogProgressPayload = {
  source_code: string;
  language: string;
  ai_score: number;
  is_correct: boolean;
};

export type LogProgressResponse = {
  logged: boolean;
};

export type GetProgressResponse = {
  total_solved: number;
  last_active: string | null;
};

export async function runCode(payload: RunPracticePayload) {
  const response = await apiClient.post<RunPracticeResponse>("/practice/run", payload);
  return response.data;
}

export async function getHint(payload: AIHintPayload) {
  const response = await apiClient.post<AIHintResponse>("/practice/ai-hint", payload);
  return response.data;
}

export async function evaluateCode(payload: AIEvaluatePayload) {
  const response = await apiClient.post<AIEvaluateResponse>("/practice/ai-evaluate", payload);
  return response.data;
}

export async function logProgress(payload: LogProgressPayload) {
  const response = await apiClient.post<LogProgressResponse>("/practice/log", payload);
  return response.data;
}

export async function getProgress() {
  const response = await apiClient.get<GetProgressResponse>("/practice/progress/");
  return response.data;
}

export type PracticeAttemptRecord = {
  id: string;
  language: string;
  is_correct: boolean;
  attempted_at: string;
};

export async function getHistory() {
  const response = await apiClient.get<PracticeAttemptRecord[]>("/practice/history/");
  return response.data;
}
