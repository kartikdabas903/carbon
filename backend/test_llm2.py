import os
from dotenv import load_dotenv
from openai import OpenAI
load_dotenv()
client = OpenAI(base_url="https://openrouter.ai/api/v1", api_key=os.getenv("OPENROUTER_API_KEY"))
try:
    res = client.chat.completions.create(model="meta-llama/llama-3.2-3b-instruct:free", messages=[{"role":"user", "content":"hi"}])
    print("Success with meta-llama/llama-3.2-3b-instruct:free")
except Exception as e:
    print(e)
