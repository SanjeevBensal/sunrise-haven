import os
from dotenv import load_dotenv
from google import genai

# Load your .env file
load_dotenv()

# Connect using your AQ... key
client = genai.Client(api_key=os.getenv("GEMINI_API_KEY"))

print("Fetching available models for your API key...\n")

try:
    # Safely list all models available to your key
    for m in client.models.list():
        print(f"- {m.name}")
except Exception as e:
    print(f"Error connecting: {e}")