import apiClient from "./client";

export type AssessmentTestCase = {
  input: string;
  expected_output: string;
  is_hidden: boolean;
  is_edge_case: boolean;
};

export type InvitationTestCase = {
  id: string;
  is_hidden: boolean;
  input?: string;
  expected_output?: string;
};

export type AssessmentQuestionPayload = {
  problem_statement: string;
  constraints: string;
  examples: Record<string, string>;
  test_cases: AssessmentTestCase[];
  starter_code?: Record<string, string> | null;
};

export type CreateAssessmentPayload = {
  title: string;
  description: string;
  difficulty: string;
  time_limit_mins: number;
  language_support: string[];
  questions: AssessmentQuestionPayload[];
};

export type AssessmentRecord = {
  id: string;
  title: string;
  description: string;
  difficulty: string;
  time_limit_mins: number;
  language_support: string[];
  created_at: string;
  questions: Array<{
    id: string;
    problem_statement: string;
    constraints: string;
    examples: Record<string, string>;
    test_cases: AssessmentTestCase[];
    starter_code?: Record<string, string> | null;
  }>;
};

export type InviteCandidatePayload = {
  candidate_email: string;
  expires_hours: number;
};

export async function createAssessment(payload: CreateAssessmentPayload) {
  const response = await apiClient.post<AssessmentRecord>("/assessments/", payload);
  return response.data;
}

export async function getAssessments() {
  const response = await apiClient.get<AssessmentRecord[]>("/assessments/");
  return response.data;
}

export async function getAssessment(id: string) {
  const response = await apiClient.get<AssessmentRecord>(`/assessments/${id}`);
  return response.data;
}

export async function generateAITests(payload: { problem_statement: string; language: string; difficulty: string }) {
  const response = await apiClient.post<{ visible_tests: AssessmentTestCase[]; hidden_tests: AssessmentTestCase[]; edge_cases: AssessmentTestCase[]; constraints: string }>("/assessments/generate-ai-tests", payload);
  return response.data;
}

export async function saveAITests(assessmentId: string, payload: { question_id: string; test_cases: AssessmentTestCase[] }) {
  const response = await apiClient.post<{ saved_count: number }>(`/assessments/${assessmentId}/save-ai-tests`, payload);
  return response.data;
}

export async function inviteCandidate(assessmentId: string, payload: InviteCandidatePayload) {
  const response = await apiClient.post<{ token: string; invite_url: string; expires_at: string; candidate_email: string }>(`/assessments/${assessmentId}/invite`, payload);
  return response.data;
}

export async function getResults(assessmentId: string) {
  const response = await apiClient.get<Array<{ candidate_email: string; score: number | null; status: string; submitted_at?: string | null }>>(`/assessments/${assessmentId}/results`);
  return response.data;
}

export type CandidateInvitation = {
  invitation_id: string;
  assessment_id: string;
  title: string;
  description: string;
  difficulty: string;
  time_limit_mins: number;
  status: "pending" | "active" | "completed";
  token: string;
  expires_at: string;
  test_url: string;
  score: number | null;
  submission_id?: string;
};

export async function getCandidateInvitations() {
  const response = await apiClient.get<CandidateInvitation[]>("/assessments/candidate/invitations");
  return response.data;
}

export async function approveCandidateInvitation(invitationId: string) {
  const response = await apiClient.post<{ status: string; token: string; test_url: string }>(`/assessments/invitations/${invitationId}/approve`);
  return response.data;
}

export async function getInvitation(token: string) {
  const response = await apiClient.get<{
    assessment_id: string;
    assessment_title: string;
    assessment_description: string;
    difficulty: string;
    time_limit_mins: number;
    status: string;
    expires_at: string;
    questions?: Array<{
      id: string;
      problem_statement: string;
      constraints: string;
      examples: Record<string, string> | string;
      test_cases?: InvitationTestCase[];
      starter_code?: Record<string, string> | null;
    }>;
  }>(`/assessments/invite/${token}`);
  return response.data;
}
