import apiClient from "./client";
import { ExecutionRequest, ExecutionResult } from "../types";

export async function runPracticeCode(payload: ExecutionRequest) {
  const response = await apiClient.post<ExecutionResult>("/practice", payload);
  return response.data;
}
