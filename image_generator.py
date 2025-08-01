import os
import requests
import uuid
import pandas as pd

IMAGE_OUTPUT_DIR = "generated_images"

def generate_images_from_prompt(prompt, count=5):
    os.makedirs(IMAGE_OUTPUT_DIR, exist_ok=True)

    label = prompt.split("of")[-1].strip().split()[0]  # crude label extraction

    metadata = []

    for _ in range(count):
        image_url = f"https://image.pollinations.ai/prompt/{prompt.replace(' ', '%20')}"
        image_name = f"{uuid.uuid4().hex}.jpg"
        image_path = os.path.join(IMAGE_OUTPUT_DIR, image_name)

        img_data = requests.get(image_url).content
        with open(image_path, 'wb') as f:
            f.write(img_data)

        metadata.append({"filename": image_name, "label": label})

    df = pd.DataFrame(metadata)
    df.to_csv(os.path.join(IMAGE_OUTPUT_DIR, "labels.csv"), index=False)

    return IMAGE_OUTPUT_DIR
