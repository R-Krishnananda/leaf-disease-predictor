from flask import Flask, request, jsonify
from flask_cors import CORS
import os
from ef_model import load_saved_model, get_class_names, test_single_image
import requests
from werkzeug.utils import secure_filename
from mistralai import Mistral
from dotenv import load_dotenv

load_dotenv()
API_URL = 'http://localhost:5000/chat'
app = Flask(__name__)
CORS(app)  # Enable Cross-Origin Resource Sharing

UPLOAD_FOLDER = 'uploads'
app.config['UPLOAD_FOLDER'] = UPLOAD_FOLDER

# Mistral API setup
api_key = os.getenv("MISTRAL_API_KEY")
mistral_model = "mistral-large-latest"
client = Mistral(api_key=api_key)

model_data = load_saved_model('best_model.pth')
model = model_data['model']
class_names = get_class_names('class_dataset')

os.makedirs(UPLOAD_FOLDER, exist_ok=True)

@app.route('/predict', methods=['POST'])
def predict():
    if 'image' not in request.files:
        return jsonify({'error': 'No image uploaded'}), 400

    file = request.files['image']
    if file.filename == '':
        return jsonify({'error': 'No image selected'}), 400

    filename = secure_filename(file.filename)
    filepath = os.path.join(app.config['UPLOAD_FOLDER'], filename)
    file.save(filepath)

    try:
        print("modeling...")
        predicted_class, probability, _ = test_single_image(model, filepath, class_names)
        print(predicted_class)
        return jsonify({'predicted_class': predicted_class, 'probability': probability})
    except Exception as e:
        return jsonify({'error': str(e)}), 500
    finally:
        os.remove(filepath) 

import logging

@app.route('/chat', methods=['POST'])
def chat():
    try:
        # Get request data with validation
        data = request.get_json()
        if not data:
            return jsonify({"error": "No JSON data provided"}), 400

        # Extract and validate user message
        user_message = data.get('message')
        if not user_message:
            return jsonify({"error": "Message is required"}), 400

        # Extract and validate chat history
        chat_history = data.get('history', [])
        if not isinstance(chat_history, list):
            return jsonify({"error": "Chat history must be a list"}), 400

        # Construct the message with instruction
        formatted_message = (
            f"{user_message} "
            "Instruction: Respond in 1 paragraph. "
            "Only respond to content about agriculture, strictly agriculture only. "
            "if not agriculture respond 'No Valid query'."
        )

        # Prepare messages for the model
        messages = []
        for msg in chat_history[:-1]:  # Exclude the last message as it's already included
            if isinstance(msg, dict) and 'role' in msg and 'content' in msg:
                messages.append(msg)

        # Add the latest user message with instruction
        messages.append({"role": "user", "content": formatted_message})

        try:
            # Generate Mistral's response
            stream_response = client.chat.stream(
                model=mistral_model,
                messages=messages
            )

            # Collect the response
            response_content = ""
            for chunk in stream_response:
                if chunk and hasattr(chunk.data.choices[0].delta, 'content'):
                    content = chunk.data.choices[0].delta.content
                    if content:
                        response_content += content

            if not response_content:
                raise ValueError("Empty response from model")

            # Return the response
            return jsonify({
                "response": response_content,
                "history": messages + [{"role": "assistant", "content": response_content}]
            })

        except Exception as e:
            logging.error(f"Model error: {str(e)}")
            return jsonify({"error": "Error generating response"}), 500

    except Exception as e:
        logging.error(f"Server error: {str(e)}")
        return jsonify({"error": "Server error"}), 500


if __name__ == '__main__':
    app.run(debug=True)
