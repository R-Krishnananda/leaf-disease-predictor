from flask import Flask, request, jsonify
from flask_cors import CORS
import os
from ef_model import load_saved_model, get_class_names, test_single_image
import requests
from werkzeug.utils import secure_filename
from mistralai import Mistral
from dotenv import load_dotenv
from flask_jwt_extended import JWTManager, create_access_token, jwt_required, get_jwt_identity
import mongoengine as me
from models.user import User
from models.chat import Chat
import json
from datetime import datetime, timedelta

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

# Replace MongoDB configuration
me.connect('leaf_disease', host='localhost', port=27017)

app.config['JWT_SECRET_KEY'] = 'your-secret-key'  # Change this to a secure secret key
app.config['JWT_ACCESS_TOKEN_EXPIRES'] = timedelta(days=1)

jwt = JWTManager(app)

@app.route('/register', methods=['POST'])
def register():
    try:
        data = request.json
        if User.objects(email=data['email']).first():
            return jsonify({'error': 'Email already registered'}), 400
        
        user = User(email=data['email'])
        user.set_password(data['password'])
        user.save()
        
        return jsonify({'message': 'User registered successfully'}), 201
    except Exception as e:
        return jsonify({'error': str(e)}), 500

@app.route('/login', methods=['POST'])
def login():
    try:
        data = request.json
        user = User.objects(email=data['email']).first()
        
        if user and user.check_password(data['password']):
            access_token = create_access_token(identity=str(user.id))
            return jsonify({
                'token': access_token,
                'email': user.email
            }), 200
        
        return jsonify({'error': 'Invalid credentials'}), 401
    except Exception as e:
        return jsonify({'error': str(e)}), 500

@app.route('/predict', methods=['POST'])
@jwt_required()  # Add this decorator if you want to require authentication
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
@jwt_required()  # Require authentication for chat
def chat():
    try:
        current_user = User.objects(id=get_jwt_identity()).first()
        data = request.get_json()
        
        if not data:
            return jsonify({"error": "No JSON data provided"}), 400

        user_message = data.get('message')
        chat_history = data.get('history', [])
        disease_title = data.get('disease_title', 'Unknown Disease')

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

            # After getting response_content, store the chat
            chat_entry = Chat.objects(
                user_email=current_user.email,
                disease_title=disease_title
            ).first()

            if not chat_entry:
                chat_entry = Chat(
                    user_email=current_user.email,
                    disease_title=disease_title,
                    messages=[]
                )

            # Add new messages to chat history
            chat_entry.messages.extend([
                {"role": "user", "content": user_message},
                {"role": "assistant", "content": response_content}
            ])
            chat_entry.updated_at = datetime.utcnow()
            chat_entry.save()

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

# Add new route to get user's chat history
@app.route('/chats', methods=['GET'])
@jwt_required()
def get_chats():
    try:
        current_user = User.objects(id=get_jwt_identity()).first()
        chats = Chat.objects(user_email=current_user.email).order_by('-updated_at')
        return jsonify([{
            'disease_title': chat.disease_title,
            'messages': chat.messages,
            'updated_at': chat.updated_at.isoformat()
        } for chat in chats])
    except Exception as e:
        return jsonify({'error': str(e)}), 500


if __name__ == '__main__':
    app.run(debug=True)
