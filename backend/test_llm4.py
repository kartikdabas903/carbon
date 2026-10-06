import os
from dotenv import load_dotenv
from openai import OpenAI
load_dotenv()
client = OpenAI(base_url="https://openrouter.ai/api/v1", api_key=os.getenv("OPENROUTER_API_KEY"))
try:
    res = client.chat.completions.create(model="openrouter/free", messages=[{"role":"user", "content":"hi"}])
    print("Success with openrouter/free")
except Exception as e:
    print(e)
