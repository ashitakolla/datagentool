import os
import time
import uuid
import httpx
import pandas as pd
from dotenv import load_dotenv
from PIL import Image
from io import BytesIO

load_dotenv()

IMAGE_OUTPUT_DIR = "generated_images"
API_KEY = os.getenv("STABLE_HORDE_KEY", "")  # Optional, works without

HEADERS = {
    "apikey": API_KEY,
    "Client-Agent": "data-gen-tool/1.0"
}

def generate_images_from_prompt(prompt, count=5):
    os.makedirs(IMAGE_OUTPUT_DIR, exist_ok=True)
    metadata = []

    for i in range(count):
        # Step 1: Submit generation request
        print(f"Requesting image {i+1}/{count}...")

        payload = {
            "prompt": prompt,
            "params": {
                "n": 1,
                "width": 512,
                "height": 512,
                "steps": 25,
                "sampler_name": "k_euler"
            },
            "models": ["stable_diffusion"],
            "r2": True
        }

        submit = httpx.post(
            "https://stablehorde.net/api/v2/generate/async",
            json=payload,
            headers=HEADERS
        )
        if submit.status_code != 202:
            raise Exception(f"Request failed: {submit.text}")

        generation_id = submit.json()["id"]

        # Step 2: Poll until image is ready
        while True:
            time.sleep(2)
            status = httpx.get(
                f"https://stablehorde.net/api/v2/generate/status/{generation_id}",
                headers=HEADERS
            ).json()
            if status.get("done", False):
                break

        # Step 3: Download and convert to PNG
        image_url = status["generations"][0]["img"]
        response = httpx.get(image_url, timeout=180)
        image = Image.open(BytesIO(response.content)).convert("RGB")

        filename = f"{uuid.uuid4().hex}.png"
        file_path = os.path.join(IMAGE_OUTPUT_DIR, filename)
        image.save(file_path, "PNG")

        metadata.append({"filename": filename, "label": prompt})

    # Save labels CSV
    df = pd.DataFrame(metadata)
    df.to_csv(os.path.join(IMAGE_OUTPUT_DIR, "labels.csv"), index=False)

    return IMAGE_OUTPUT_DIR
