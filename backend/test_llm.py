import os
from dotenv import load_dotenv
import json
from openai import OpenAI

load_dotenv()
api_key = os.getenv("OPENROUTER_API_KEY")
print(f"Key loaded: {bool(api_key)}")

client = OpenAI(
    base_url="https://openrouter.ai/api/v1",
    api_key=api_key
)

prompt = "The user has a high carbon footprint in the 'transport' category, producing approximately 1200 kg of CO2.\nGenerate exactly 2 creative, actionable eco-friendly recommendations.\nReturn ONLY a JSON array of objects."

try:
    response = client.chat.completions.create(
        model="meta-llama/llama-3.1-8b-instruct:free",
        messages=[
            {"role": "system", "content": "You are an AI that strictly outputs valid JSON arrays."},
            {"role": "user", "content": prompt}
        ]
    )
    print("Response:")
    print(response.choices[0].message.content)
except Exception as e:
    print(f"Error: {e}")
