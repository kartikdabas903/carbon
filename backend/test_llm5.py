import os
from dotenv import load_dotenv
from openai import OpenAI
load_dotenv()
client = OpenAI(base_url="https://generativelanguage.googleapis.com/v1beta/openai/", api_key=os.getenv("GEMINI_API_KEY"))
try:
    res = client.chat.completions.create(model="gemini-2.5-flash", messages=[{"role":"user", "content":"hi"}])
    print("Success with gemini-2.5-flash")
except Exception as e:
    print(e)
