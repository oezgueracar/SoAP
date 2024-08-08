import os
from transformers import pipeline

# Define the model directory
model_dir = './models/zero-shot-classification'

# Create the directory if it does not exist
os.makedirs(model_dir, exist_ok=True)

# Load the model and save it locally
classifier = pipeline('zero-shot-classification', model="MoritzLaurer/deberta-v3-xsmall-zeroshot-v1.1-all-33")
classifier.save_pretrained(model_dir)

print(f'Model saved to {model_dir}')