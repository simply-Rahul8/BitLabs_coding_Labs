import json
import re
from typing import Any

from groq import AsyncGroq

from app.core.config import settings


class AIService:
    def __init__(self) -> None:
        self.client = AsyncGroq(api_key=settings.GROQ_API_KEY) if settings.GROQ_API_KEY else None
        self.model = "llama-3.1-8b-instant"

    def _redact_secrets(self, text: str) -> str:
        # Redact potential API keys (Groq, OpenAI, etc.)
        text = re.sub(r'\b(gsk_[a-zA-Z0-9]{48,})\b', '[REDACTED_API_KEY]', text)
        text = re.sub(r'\bsk-[a-zA-Z0-9-]{32,}\b', '[REDACTED_API_KEY]', text)
        text = re.sub(r'\bAIzaSy[a-zA-Z0-9_-]{33}\b', '[REDACTED_API_KEY]', text)
        # Redact connection strings or passwords in env/config strings
        text = re.sub(r'postgresql://[^:]+:[^@]+@', 'postgresql://[REDACTED_USER]:[REDACTED_PASSWORD]@', text)
        text = re.sub(r'mongodb\+srv://[^:]+:[^@]+@', 'mongodb+srv://[REDACTED_USER]:[REDACTED_PASSWORD]@', text)
        # Redact Bearer tokens
        text = re.sub(r'Bearer\s+[a-zA-Z0-9-._~+/]+=*', 'Bearer [REDACTED_TOKEN]', text, flags=re.IGNORECASE)
        return text

    async def generate_test_cases(self, problem_statement: str, language: str, difficulty: str) -> dict[str, Any]:
        prompt = (
            "Generate test cases for the following coding problem. "
            "Return ONLY valid JSON with no markdown or prose. "
            "The JSON must have keys visible_tests, hidden_tests, edge_cases, and constraints. "
            "Each item in visible_tests, hidden_tests, and edge_cases must be an object with input and expected_output as plain stdin/stdout strings. "
            "Return exactly 2 visible_tests, 4 hidden_tests, and 2 edge_cases. "
            f"Problem statement: {problem_statement}\n"
            f"Language: {language}\n"
            f"Difficulty: {difficulty}\n"
            "Constraints should describe the input shape, performance expectations, and any important edge conditions."
        )

        if self.client is None:
            return {"error": "GROQ_API_KEY is not configured"}

        try:
            response = await self.client.chat.completions.create(
                model=self.model,
                messages=[
                    {
                        "role": "user",
                        "content": prompt,
                    }
                ],
                max_tokens=1000,
            )
            text = ""
            if getattr(response, "choices", None):
                choice = response.choices[0]
                message = getattr(choice, "message", None)
                content = getattr(message, "content", "")
                if isinstance(content, str):
                    text = content
                elif isinstance(content, list):
                    for item in content:
                        if isinstance(item, str):
                            text += item
                        elif isinstance(item, dict):
                            text += str(item.get("text", ""))
            elif getattr(response, "output_text", None):
                text = response.output_text
            elif getattr(response, "output", None):
                for item in response.output:
                    if isinstance(item, str):
                        text += item
                    elif getattr(item, "output_text", None):
                        text += item.output_text
                    elif hasattr(item, "content") and item.content:
                        if isinstance(item.content, list):
                            for content_item in item.content:
                                if getattr(content_item, "text", None):
                                    text += content_item.text
                        elif isinstance(item.content, str):
                            text += item.content
            if not text:
                raise ValueError("No text content returned from AI response")
            parsed = json.loads(text)
            return parsed
        except Exception as exc:
            return {"error": str(exc)}

    async def evaluate_code(
        self, source_code: str, language: str, problem_statement: str, test_results: dict[str, Any]
    ) -> dict[str, Any]:
        # Redact secrets
        redacted_source_code = self._redact_secrets(source_code)
        redacted_problem = self._redact_secrets(problem_statement)
        redacted_results_str = self._redact_secrets(json.dumps(test_results, indent=2))
        redacted_results = json.loads(redacted_results_str)

        prompt = (
            "Evaluate the candidate code below. Return ONLY valid JSON with no markdown or prose. "
            "Score the submission from 0 to 100, with correctness worth 50%, code quality worth 30%, and efficiency worth 20%. "
            "Include strengths, weaknesses, and recommendations in plain text. "
            f"Problem statement: {redacted_problem}\n"
            f"Language: {language}\n"
            f"Source code:\n{redacted_source_code}\n"
            f"Test results:\n{redacted_results_str}\n"
            "Return an object with ai_score, strengths, weaknesses, and recommendations. "
            "If you cannot determine a value, return ai_score as 0.0 and generic messages."
        )

        passed = redacted_results.get("passed", 0)
        total = redacted_results.get("total", 0)
        pct = round((passed / total * 100), 1) if total > 0 else 100.0

        heuristic_eval = {
            "ai_score": pct,
            "strengths": f"Passed {passed} out of {total} test cases cleanly with expected stdout outputs.",
            "weaknesses": "No critical failure detected." if passed == total else f"Failed {total - passed} test case(s). Output mismatch or execution error on edge cases.",
            "recommendations": "Code logic is sound. Focus on optimizing time/space complexity." if passed == total else "Verify input boundary conditions and check for edge case edge scenarios.",
        }

        if self.client is None:
            return heuristic_eval

        try:
            response = await self.client.chat.completions.create(
                model=self.model,
                messages=[
                    {
                        "role": "user",
                        "content": prompt,
                    }
                ],
                max_tokens=800,
            )
            text = ""
            if getattr(response, "choices", None):
                choice = response.choices[0]
                message = getattr(choice, "message", None)
                content = getattr(message, "content", "")
                if isinstance(content, str):
                    text = content
                elif isinstance(content, list):
                    for item in content:
                        if isinstance(item, str):
                            text += item
                        elif isinstance(item, dict):
                            text += str(item.get("text", ""))
            elif getattr(response, "output_text", None):
                text = response.output_text
            elif getattr(response, "output", None):
                for item in response.output:
                    if isinstance(item, str):
                        text += item
                    elif getattr(item, "output_text", None):
                        text += item.output_text
                    elif hasattr(item, "content") and item.content:
                        if isinstance(item.content, list):
                            for content_item in item.content:
                                if getattr(content_item, "text", None):
                                    text += content_item.text
                        elif isinstance(item.content, str):
                            text += item.content
            if not text:
                raise ValueError("No text content returned from AI response")
            parsed = json.loads(text)
            ai_score = float(parsed.get("ai_score", 0.0))
            strengths = str(parsed.get("strengths", heuristic_eval["strengths"]))
            weaknesses = str(parsed.get("weaknesses", heuristic_eval["weaknesses"]))
            recommendations = str(parsed.get("recommendations", heuristic_eval["recommendations"]))
            return {
                "ai_score": max(0.0, min(100.0, ai_score)),
                "strengths": strengths,
                "weaknesses": weaknesses,
                "recommendations": recommendations,
                "raw_response": parsed,
            }
        except Exception:
            return heuristic_eval
