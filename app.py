"""
AI-Based Image to Pencil Sketch Generation
A Flask web application that converts uploaded images into realistic pencil sketches
using OpenCV image processing techniques.
"""

import os
import cv2
import numpy as np
from flask import Flask, render_template, request, send_file, url_for, flash, redirect
from werkzeug.utils import secure_filename
from datetime import datetime
import sqlite3
from pathlib import Path

# Initialize Flask app
app = Flask(__name__)
app.config['SECRET_KEY'] = 'your-secret-key-change-in-production'
app.config['UPLOAD_FOLDER'] = 'static/uploads'
app.config['OUTPUT_FOLDER'] = 'static/outputs'
app.config['MAX_CONTENT_LENGTH'] = 16 * 1024 * 1024  # 16MB max file size
app.config['ALLOWED_EXTENSIONS'] = {'png', 'jpg', 'jpeg', 'bmp', 'tiff', 'webp'}

# Ensure directories exist
Path(app.config['UPLOAD_FOLDER']).mkdir(parents=True, exist_ok=True)
Path(app.config['OUTPUT_FOLDER']).mkdir(parents=True, exist_ok=True)


def init_db():
    """Initialize SQLite database for storing conversion history"""
    conn = sqlite3.connect('sketch.db')
    cursor = conn.cursor()
    cursor.execute('''
        CREATE TABLE IF NOT EXISTS conversions (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            original_filename TEXT NOT NULL,
            sketch_filename TEXT NOT NULL,
            upload_date TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
            original_path TEXT NOT NULL,
            output_path TEXT NOT NULL
        )
    ''')
    conn.commit()
    conn.close()


def allowed_file(filename):
    """Check if file extension is allowed"""
    return '.' in filename and \
           filename.rsplit('.', 1)[1].lower() in app.config['ALLOWED_EXTENSIONS']


def generate_pencil_sketch(image_path, output_path):
    """
    Convert image to pencil sketch using OpenCV
    
    Algorithm:
    1. Read the image
    2. Convert to grayscale
    3. Invert the grayscale image
    4. Apply Gaussian blur
    5. Invert the blurred image
    6. Use cv2.divide to create the sketch effect
    
    Args:
        image_path: Path to the input image
        output_path: Path to save the sketch
        
    Returns:
        bool: True if successful, False otherwise
    """
    try:
        # Read the image
        img = cv2.imread(image_path)
        
        if img is None:
            return False
        
        # Convert to grayscale
        gray_img = cv2.cvtColor(img, cv2.COLOR_BGR2GRAY)
        
        # Invert the grayscale image
        inverted_img = 255 - gray_img
        
        # Apply Gaussian blur to the inverted image
        # The kernel size and sigma determine the pencil stroke thickness
        blurred = cv2.GaussianBlur(inverted_img, (21, 21), 0)
        
        # Invert the blurred image
        inverted_blurred = 255 - blurred
        
        # Create the pencil sketch by dividing grayscale by inverted blur
        # This creates the realistic pencil effect
        pencil_sketch = cv2.divide(gray_img, inverted_blurred, scale=256.0)
        
        # Optional: Enhance the sketch with slight sharpening
        kernel_sharpening = np.array([[-1, -1, -1],
                                       [-1,  9, -1],
                                       [-1, -1, -1]])
        pencil_sketch = cv2.filter2D(pencil_sketch, -1, kernel_sharpening)
        
        # Save the sketch
        cv2.imwrite(output_path, pencil_sketch)
        
        return True
        
    except Exception as e:
        print(f"Error generating sketch: {str(e)}")
        return False


def save_to_db(original_filename, sketch_filename, original_path, output_path):
    """Save conversion details to database"""
    try:
        conn = sqlite3.connect('sketch.db')
        cursor = conn.cursor()
        cursor.execute('''
            INSERT INTO conversions (original_filename, sketch_filename, original_path, output_path)
            VALUES (?, ?, ?, ?)
        ''', (original_filename, sketch_filename, original_path, output_path))
        conn.commit()
        conn.close()
    except Exception as e:
        print(f"Database error: {str(e)}")


@app.route('/')
def index():
    """Home page"""
    return render_template('index.html')


@app.route('/features')
def features():
    """Features page"""
    return render_template('features.html')


@app.route('/how-it-works')
def how_it_works():
    """How it works / About page"""
    return render_template('about.html')


@app.route('/upload', methods=['GET', 'POST'])
def upload():
    """Upload page - handles both GET (show form) and POST (process upload)"""
    if request.method == 'POST':
        # Check if file was uploaded
        if 'file' not in request.files:
            flash('No file selected', 'error')
            return redirect(request.url)
        
        file = request.files['file']
        
        # Check if filename is empty
        if file.filename == '':
            flash('No file selected', 'error')
            return redirect(request.url)
        
        # Validate file type
        if file and allowed_file(file.filename):
            # Secure the filename
            original_filename = secure_filename(file.filename)
            
            # Generate unique filename with timestamp
            timestamp = datetime.now().strftime('%Y%m%d_%H%M%S')
            name, ext = os.path.splitext(original_filename)
            unique_filename = f"{name}_{timestamp}{ext}"
            sketch_filename = f"sketch_{name}_{timestamp}.png"
            
            # Save paths
            upload_path = os.path.join(app.config['UPLOAD_FOLDER'], unique_filename)
            output_path = os.path.join(app.config['OUTPUT_FOLDER'], sketch_filename)
            
            # Save uploaded file
            file.save(upload_path)
            
            # Generate pencil sketch
            success = generate_pencil_sketch(upload_path, output_path)
            
            if success:
                # Save to database
                save_to_db(original_filename, sketch_filename, upload_path, output_path)
                
                # Redirect to result page
                return redirect(url_for('result', 
                                      original=unique_filename, 
                                      sketch=sketch_filename))
            else:
                flash('Error processing image. Please try another image.', 'error')
                return redirect(request.url)
        else:
            flash('Invalid file type. Allowed types: PNG, JPG, JPEG, BMP, TIFF, WEBP', 'error')
            return redirect(request.url)
    
    return render_template('upload.html')


@app.route('/result')
def result():
    """Display the result page with original and sketch images"""
    original = request.args.get('original')
    sketch = request.args.get('sketch')
    
    if not original or not sketch:
        flash('Invalid request', 'error')
        return redirect(url_for('upload'))
    
    return render_template('result.html', original=original, sketch=sketch)


@app.route('/download/<filename>')
def download(filename):
    """Download the generated sketch"""
    try:
        file_path = os.path.join(app.config['OUTPUT_FOLDER'], filename)
        return send_file(file_path, as_attachment=True)
    except Exception as e:
        flash('File not found', 'error')
        return redirect(url_for('index'))


@app.errorhandler(413)
def too_large(e):
    """Handle file too large error"""
    flash('File is too large. Maximum size is 16MB.', 'error')
    return redirect(url_for('upload'))


@app.errorhandler(404)
def not_found(e):
    """Handle 404 errors"""
    return render_template('index.html'), 404


@app.errorhandler(500)
def server_error(e):
    """Handle 500 errors"""
    flash('An error occurred. Please try again.', 'error')
    return redirect(url_for('index'))


if __name__ == '__main__':
    # Initialize database
    init_db()
    
    # Run the app
    app.run(debug=True, host='0.0.0.0', port=5000)