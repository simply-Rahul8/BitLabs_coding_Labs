import apiClient from "./client";
import { Assessment } from "../types";

export async function listAssessments() {
  const response = await apiClient.get<Assessment[]>("/assessments");
  return response.data;
}

export async function createAssessment(payload: Partial<Assessment>) {
  const response = await apiClient.post<Assessment>("/assessments", payload);
  return response.data;
}
