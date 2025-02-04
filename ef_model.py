import torch
from torchvision import transforms, datasets
from PIL import Image
import os
from pathlib import Path
from torchvision import models
import torch.nn as nn

def load_saved_model(model_path, device='cuda' if torch.cuda.is_available() else 'cpu'):
    # Initialize the base model
    model = models.efficientnet_b2(weights=None)
    
    # Modify classifier to match the saved model architecture
    model.classifier = nn.Sequential(
        nn.Dropout(p=0.3, inplace=True),
        nn.Linear(model.classifier[1].in_features, 44)  # Changed to 44 classes
    )
    
    # Load the saved state
    checkpoint = torch.load(model_path, map_location=device)
    
    # Load model state
    model.load_state_dict(checkpoint['model_state_dict'])
    
    # Move model to appropriate device
    model = model.to(device)
    
    # Set to evaluation mode
    model.eval()
    
    # Return model and training history
    return {
        'model': model,
        'train_losses': checkpoint['train_losses'],
        'val_losses': checkpoint['val_losses'],
        'train_accuracies': checkpoint['train_accuracies'],
        'val_accuracies': checkpoint['val_accuracies'],
        'hyperparameters': checkpoint['hyperparameters']
    }



def get_class_names(dataset_path):
    """Get class names from the dataset directory"""
    dataset = datasets.ImageFolder(dataset_path)
    class_to_idx = dataset.class_to_idx
    # Convert from {class_name: idx} to [class_name] ordered by idx
    idx_to_class = {v: k for k, v in class_to_idx.items()}
    class_names = [idx_to_class[i] for i in range(len(idx_to_class))]
    return class_names

def create_test_transform():
    """Create the transformation pipeline for test images"""
    return transforms.Compose([
        transforms.Resize((224, 224)),
        transforms.ToTensor(),
        transforms.Normalize(mean=[0.485, 0.456, 0.406], std=[0.229, 0.224, 0.225])
    ])

def load_and_preprocess_image(image_path, transform):
    """Load and preprocess a single image"""
    try:
        image = Image.open(image_path).convert('RGB')
        image_tensor = transform(image)
        return image_tensor
    except Exception as e:
        print(f"Error processing image {image_path}: {str(e)}")
        return None

def predict_image(model, image_tensor, device='cuda' if torch.cuda.is_available() else 'cpu'):
    """Make prediction for a single image"""
    model.eval()
    with torch.no_grad():
        image_tensor = image_tensor.unsqueeze(0).to(device)
        outputs = model(image_tensor)
        probabilities = torch.nn.functional.softmax(outputs, dim=1)
        prob, predicted = torch.max(probabilities, 1)
        return predicted.item(), prob.item()

def test_single_image(model, image_path, class_names, transform=None):
    """Test a single image and return prediction with probability"""
    if transform is None:
        transform = create_test_transform()
    
    image_tensor = load_and_preprocess_image(image_path, transform)
    if image_tensor is None:
        return None, None, None
    
    pred_idx, probability = predict_image(model, image_tensor)
    predicted_class = class_names[pred_idx]
    
    return predicted_class, probability, image_tensor

def test_directory(model, directory_path, class_names):
    """Test all images in a directory and its subdirectories"""
    transform = create_test_transform()
    results = []
    
    for root, _, files in os.walk(directory_path):
        for file in files:
            if file.lower().endswith(('.png', '.jpg', '.jpeg')):
                image_path = os.path.join(root, file)
                predicted_class, probability, _ = test_single_image(
                    model, image_path, class_names, transform
                )
                
                if predicted_class is not None:
                    results.append({
                        'image_path': image_path,
                        'predicted_class': predicted_class,
                        'probability': probability
                    })
    
    return results

# Example usage:
# 1. Load your model
loaded_data = load_saved_model('best_model.pth')  # Make sure you have this function from previous code
model = loaded_data['model']

# 2. Get class names from your dataset directory
dataset_path = 'class_dataset'  # Use your actual dataset path
class_names = get_class_names(dataset_path)

