import asyncio
import os
import sys

# Ensure backend directory is in python search path
sys.path.append(os.path.dirname(os.path.abspath(__file__)))

from app.services.ai_service import AIService

async def test():
    print("Initializing AIService...")
    ai = AIService()
    print(f"Configured Gemini API Key: {'Present' if ai.api_key else 'Missing'}")
    
    print("\nCalling mentor hint (generate_mentor_hint)...")
    try:
        res = await ai.generate_mentor_hint(
            language="python",
            source_code="for i in range(10): print(i)",
            user_question="How do I print only even numbers?"
        )
        print("\nAPI Response:")
        print(res)
    except Exception as e:
        print("\nError occurred during API call:")
        import traceback
        traceback.print_exc()

if __name__ == "__main__":
    asyncio.run(test())
