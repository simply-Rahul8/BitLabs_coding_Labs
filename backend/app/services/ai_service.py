import json
import re
from typing import Any
import httpx
from google import genai

from app.core.config import settings


class AIService:
    def __init__(self) -> None:
        self.api_key = settings.GEMINI_API_KEY
        self.model = "gemini-3.6-flash"
        self.client = genai.Client(api_key=self.api_key) if self.api_key else genai.Client()

    async def _call_api(self, messages, max_tokens=4096) -> str:
        prompt = messages[-1]["content"] if messages else ""
        try:
            interaction = await self.client.aio.interactions.create(
                model=self.model,
                input=prompt,
                generation_config={
                    "max_output_tokens": max_tokens,
                    "temperature": 1.0,
                    "top_p": 0.95
                }
            )
            return interaction.output_text or ""
        except Exception as e:
            print(f"Gemini API Error: {e}")
            return ""

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

        text = await self._call_api([{"role": "user", "content": prompt}], max_tokens=2000)
        
        if not text:
            return {"error": "No text content returned from AI response"}
            
        try:
            # Clean up markdown formatting if the model still returns it despite instructions
            text = text.replace("```json", "").replace("```", "").strip()
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

        text = await self._call_api([{"role": "user", "content": prompt}], max_tokens=1500)
        
        if not text:
            return heuristic_eval
            
        try:
            text = text.replace("```json", "").replace("```", "").strip()
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

    async def generate_mentor_hint(self, language: str, source_code: str, user_question: str | None = None) -> dict[str, str]:
        fallback = { "hint": "AI unavailable. Check your code manually." }

        prompt = (
            "System Instruction: You are a coding mentor. Be concise. Max 150 words.\n\n"
            f"Language: {language}\n"
            "Code:\n"
            f"{source_code}\n\n"
            f"Student asks: {user_question or 'Review my code and give one improvement tip.'}\n\n"
            "Give:\n"
            "1. What the code does (1 sentence)\n"
            "2. One specific improvement or bug fix\n"
            "3. Corrected code snippet if needed"
        )

        text = await self._call_api([
            {"role": "user", "content": prompt}
        ], max_tokens=800)
        
        if not text:
            return fallback
            
        return { "hint": text }

    async def evaluate_practice_code(
        self, language: str, source_code: str, stdout: str, problem_description: str | None = None
    ) -> dict[str, Any]:
        fallback = {
            "is_correct": False,
            "score": 0,
            "feedback": "Could not evaluate.",
            "improvements": []
        }

        prompt = (
            "System Instruction: You are a code evaluator. Return ONLY valid JSON.\n\n"
            f"Language: {language}\n"
            f"Code: {source_code}\n"
            f"Output produced: {stdout}\n"
            f"Problem (if any): {problem_description or 'General code review'}\n\n"
            "Return JSON:\n"
            "{\n"
            '  "is_correct": true/false,\n'
            '  "score": <0-100>,\n'
            '  "feedback": "one paragraph",\n'
            '  "improvements": ["tip1", "tip2"]\n'
            "}"
        )

        text = await self._call_api([
            {"role": "user", "content": prompt}
        ], max_tokens=1000)
        
        if not text:
            return fallback
            
        try:
            text = text.replace("```json", "").replace("```", "").strip()
            parsed = json.loads(text)
            return {
                "is_correct": bool(parsed.get("is_correct", False)),
                "score": int(parsed.get("score", 0)),
                "feedback": str(parsed.get("feedback", "Could not evaluate.")),
                "improvements": list(parsed.get("improvements", []))
            }
        except Exception:
            return fallback
