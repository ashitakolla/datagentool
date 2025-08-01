import os
from dotenv import load_dotenv
from openai import OpenAI
from prompts import build_prompt, build_time_series_prompt  # Import both prompt builders

load_dotenv()

# Initialize OpenRouter-based OpenAI client
client = OpenAI(
    api_key=os.getenv("OPENROUTER_API_KEY"),
    base_url="https://openrouter.ai/api/v1"
)

def generate_csv_data(user_prompt, dataset_type="tabular"):
    if dataset_type == "time_series":
        full_prompt = build_time_series_prompt(user_prompt)
    else:
        full_prompt = build_prompt(user_prompt)

    # LLM API call to OpenRouter
    chat_completion = client.chat.completions.create(
        model="mistralai/mistral-7b-instruct",
        messages=[
            {"role": "system", "content": "You generate fake CSV datasets."},
            {"role": "user", "content": full_prompt}
        ],
        temperature=0.7
    )

    return chat_completion.choices[0].message.content
