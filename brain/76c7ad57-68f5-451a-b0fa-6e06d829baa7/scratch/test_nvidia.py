import asyncio
import httpx

async def main():
    api_key = "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"
    url = "https://integrate.api.nvidia.com/v1/models"
    headers = {
        "Authorization": f"Bearer {api_key}",
        "Accept": "application/json",
    }
    async with httpx.AsyncClient() as client:
        try:
            print("Listing models from Nvidia API...")
            response = await client.get(url, headers=headers, timeout=15.0)
            print("Status code:", response.status_code)
            if response.status_code == 200:
                data = response.json()
                models = [m["id"] for m in data.get("data", [])]
                print("Models count:", len(models))
                print("First 15 models:", models[:15])
                # Check if the specific model is in the list
                target = "google/diffusiongemma-26b-a4b-it"
                if target in models:
                    print(f"Target model '{target}' IS present!")
                else:
                    print(f"Target model '{target}' IS NOT present.")
                    # print similar models
                    gemma_models = [m for m in models if "gemma" in m.lower()]
                    print("Gemma models:", gemma_models)
            else:
                print("Body:", response.text)
        except Exception as e:
            print("Error listing models:", e)

asyncio.run(main())
