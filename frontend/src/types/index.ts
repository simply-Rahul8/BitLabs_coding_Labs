import { SupportedLanguage } from "../constants/templates";

export type UserRole = "Recruiter" | "Candidate";

export type User = {
  id: string;
  name: string;
  email: string;
  role: UserRole;
};

export type Assessment = {
  id: string;
  title: string;
  instructions: string;
  status: "draft" | "active" | "completed";
  durationMinutes: number;
};

export type Submission = {
  id: string;
  assessmentId: string;
  candidateId: string;
  language: SupportedLanguage;
  code: string;
  status: "completed" | "failed";
  score?: number;
};

export type ExecutionRequest = {
  language: SupportedLanguage;
  code: string;
  stdin?: string;
};

export type ExecutionResult = {
  stdout: string;
  stderr: string;
  exitCode: number;
  timedOut: boolean;
};
