import apiClient from "./client";

export type RunCodePayload = {
  source_code: string;
  language: string;
  stdin?: string;
  invitation_token?: string;
};

export type SubmissionPayload = {
  invitation_token: string;
  source_code: string;
  language: string;
};

export type RunCodeResponse = {
  stdout: string;
  stderr: string;
  exit_code: number;
  timed_out: boolean;
  error?: string | null;
};

export type SubmissionResult = {
  submission_id: string;
  score: number | null;
  test_results: {
    passed: number;
    failed: number;
    total: number;
    results: Array<{
      input: string;
      expected: string;
      actual: string;
      passed: boolean;
      stderr: string;
      timed_out: boolean;
    }>;
  };
  ai_evaluation?: {
    ai_score: number;
    strengths: string;
    weaknesses: string;
    recommendations: string;
  };
};

export async function runCode(payload: RunCodePayload) {
  const response = await apiClient.post<RunCodeResponse>("/execute/run", payload);
  return response.data;
}

export async function submitSolution(payload: SubmissionPayload) {
  const response = await apiClient.post<SubmissionResult>("/submissions/", payload);
  return response;
}

export async function getSubmission(id: string) {
  const response = await apiClient.get<{
    id: string;
    invitation_id: string;
    source_code: string;
    language: string;
    score: number | null;
    submitted_at: string;
    test_results?: {
      passed: number;
      failed: number;
      total: number;
      results: Array<{
        input: string;
        expected: string;
        actual: string;
        passed: boolean;
        stderr: string;
        timed_out: boolean;
      }>;
    };
    ai_evaluation?: {
      id: string;
      strengths: string;
      weaknesses: string;
      recommendations: string;
      ai_score: number;
    };
  }>(`/submissions/${id}`);
  return response.data;
}
