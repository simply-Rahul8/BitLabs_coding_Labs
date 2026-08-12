import json
from typing import Any

from groq import AsyncGroq

from app.core.config import settings


class AIService:
    def __init__(self) -> None:
        self.client = AsyncGroq(api_key=settings.GROQ_API_KEY) if settings.GROQ_API_KEY else None
        self.model = "llama-3.1-8b-instant"

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
        prompt = (
            "Evaluate the candidate code below. Return ONLY valid JSON with no markdown or prose. "
            "Score the submission from 0 to 100, with correctness worth 50%, code quality worth 30%, and efficiency worth 20%. "
            "Include strengths, weaknesses, and recommendations in plain text. "
            f"Problem statement: {problem_statement}\n"
            f"Language: {language}\n"
            f"Source code:\n{source_code}\n"
            f"Test results:\n{json.dumps(test_results, indent=2)}\n"
            "Return an object with ai_score, strengths, weaknesses, and recommendations. "
            "If you cannot determine a value, return ai_score as 0.0 and generic messages."
        )

        safe_default = {
            "ai_score": 0.0,
            "strengths": "Could not evaluate the submission automatically.",
            "weaknesses": "AI evaluation was unavailable or returned an unexpected format.",
            "recommendations": "Please review the code manually or retry the evaluation.",
        }

        if self.client is None:
            return {
                "ai_score": 0.0,
                "strengths": "Could not evaluate the submission automatically.",
                "weaknesses": "AI evaluation was unavailable because the API key is not configured.",
                "recommendations": "Please review the code manually or configure the Groq API key.",
            }

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
            strengths = str(parsed.get("strengths", safe_default["strengths"]))
            weaknesses = str(parsed.get("weaknesses", safe_default["weaknesses"]))
            recommendations = str(parsed.get("recommendations", safe_default["recommendations"]))
            return {
                "ai_score": max(0.0, min(100.0, ai_score)),
                "strengths": strengths,
                "weaknesses": weaknesses,
                "recommendations": recommendations,
                "raw_response": parsed,
            }
        except Exception:
            return safe_default
