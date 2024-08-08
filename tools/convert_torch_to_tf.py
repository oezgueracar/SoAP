from transformers import TFAutoModelForSequenceClassification, AutoTokenizer
import tensorflow as tf

# Path to the original PyTorch model
model_path = "./models/zero-shot-classification"

# Load the tokenizer and model from PyTorch
tokenizer = AutoTokenizer.from_pretrained(model_path)
model = TFAutoModelForSequenceClassification.from_pretrained(model_path, from_pt=True)

# Save the model in TensorFlow SavedModel format
saved_model_path = "./models/tf_model/saved_model"

# Ensure the model is saved in the SavedModel format
model.save_pretrained(saved_model_path, saved_model=True)
tokenizer.save_pretrained(saved_model_path)

print(f"Model saved in TensorFlow SavedModel format to {saved_model_path}")
