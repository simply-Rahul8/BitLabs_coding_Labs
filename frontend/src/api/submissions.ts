import apiClient from "./client";
import { Submission } from "../types";

export async function listSubmissions() {
  const response = await apiClient.get<Submission[]>("/submissions");
  return response.data;
}

export async function submitAssessment(payload: Partial<Submission>) {
  const response = await apiClient.post<Submission>("/submissions", payload);
  return response.data;
}
