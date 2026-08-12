import asyncio
import sys
sys.path.insert(0, '.')

async def test():
    try:
        from app.services.ai_service import AIService
        result = await AIService().evaluate_code(
            source_code="s = input(); print(s == s[::-1])",
            language="python",
            problem_statement="Check if string is palindrome",
            test_results={"passed": 1, "total": 1, "failed": 0}
        )
        print("RESULT:", result)
    except Exception as e:
        print("EXCEPTION:", type(e).__name__, str(e))

asyncio.run(test())
