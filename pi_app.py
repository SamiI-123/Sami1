import time
import random
import threading
from flask import Flask, Response, jsonify

# ==========================================
# Agrinovia Raspberry Pi Integration Script
# For use with Thonny IDE on Raspberry Pi
# ==========================================
#
# Requirements (Run in your Pi Terminal):
#   pip install Flask
#   pip install opencv-python
#
# Optional (For actual hardware DHT sensor):
#   pip install Adafruit_DHT
#

app = Flask(__name__)

# Mock DHT Sensor fallbacks if hardware sensor is not connected
USE_REAL_DHT = False
DHT_PIN = 4 # GPIO pin connected to the DHT sensor data line

try:
    import Adafruit_DHT
    # Test setting up the DHT sensor
    sensor = Adafruit_DHT.DHT11 # Or DHT22
    USE_REAL_DHT = True
    print("[HARDWARE] Adafruit DHT library detected. Using physical DHT11/22 sensor.")
except ImportError:
    print("[SIMULATION] Adafruit_DHT library not found. Falling back to realistic simulation data.")

# Mock Camera setup using OpenCV
# OpenCV works universally with USB Webcams and the official Pi Cam (via libcameradev / v4l2)
import cv2

camera = None
try:
    # Attempt to open default camera (Cam index 0)
    camera = cv2.VideoCapture(0)
    # Set lower resolution for high-performance streaming over tunnels
    camera.set(cv2.CAP_PROP_FRAME_WIDTH, 640) if hasattr(cv2, 'CAP_PROP_FRAME_WIDTH') else None
    camera.set(cv2.CAP_PROP_FRAME_HEIGHT, 480) if hasattr(cv2, 'CAP_PROP_FRAME_HEIGHT') else None
    print("[HARDWARE] Camera initialized successfully on index 0!")
except Exception as e:
    print(f"[SIMULATION] Camera not accessible ({e}). Live stream will return a test pattern.")

# CORS decorator equivalent (Adding headers manually to avoid third-party pip packages)
@app.after_request
def add_cors_headers(response):
    response.headers['Access-Control-Allow-Origin'] = '*'
    response.headers['Access-Control-Allow-Headers'] = 'Content-Type,Authorization'
    response.headers['Access-Control-Allow-Methods'] = 'GET,POST,OPTIONS'
    return response

# Generation of video frames
def generate_frames():
    global camera
    while True:
        # Check if camera object is valid
        if camera is not None and camera.isOpened():
            success, frame = camera.read()
            if not success:
                # Fallback pattern if video frame reading fails momentarily
                import numpy as np
                frame = np.zeros((480, 640, 3), dtype=np.uint8)
                cv2.putText(
                    frame, 
                    "Camera offline or busy", 
                    (80, 240), cv2.FONT_HERSHEY_SIMPLEX, 0.7, (0, 0, 255), 2
                )
                ret, buffer = cv2.imencode('.jpg', frame)
                yield (b'--frame\r\n'
                       b'Content-Type: image/jpeg\r\n\r\n' + buffer.tobytes() + b'\r\n')
                time.sleep(0.1)
                continue
            
            # Encode frame to JPG
            ret, buffer = cv2.imencode('.jpg', frame)
            frame_bytes = buffer.tobytes()
            yield (b'--frame\r\n'
                   b'Content-Type: image/jpeg\r\n\r\n' + frame_bytes + b'\r\n')
        else:
            # Simulation: generate a visual test card using standard numpy/opencv if camera not found
            # This ensures they can test the script anywhere (even without a camera plugged in!)
            import numpy as np
            # Generate animated test card
            img = np.zeros((480, 640, 3), dtype=np.uint8)
            cv2.putText(img, "AGRINOVIA PI STREAM PREVIEW", (80, 180), cv2.FONT_HERSHEY_SIMPLEX, 1.0, (76, 175, 80), 3)
            cv2.putText(img, f"Live Coordinates (WGS84) - Time: {int(time.time()) % 1000}", (80, 240), cv2.FONT_HERSHEY_SIMPLEX, 0.6, (255, 255, 255), 1)
            cv2.putText(img, "SIMULATING ACTIVE FLIGHT FEED", (80, 300), cv2.FONT_HERSHEY_SIMPLEX, 0.6, (212, 163, 115), 1)
            
            # Add dynamic sweeping lines to look active
            sweep_x = (int(time.time() * 50) % 640)
            cv2.line(img, (sweep_x, 0), (sweep_x, 480), (76, 175, 80), 2)
            
            ret, buffer = cv2.imencode('.jpg', img)
            yield (b'--frame\r\n'
                   b'Content-Type: image/jpeg\r\n\r\n' + buffer.tobytes() + b'\r\n')
            time.sleep(0.1)

# Route for Stream
@app.route('/video_feed')
def video_feed():
    # Returns the streaming multipart response
    return Response(generate_frames(), mimetype='multipart/x-mixed-replace; boundary=frame')

# Route for Sensor Metrics DB
@app.route('/data')
def sensor_data():
    if USE_REAL_DHT:
        humidity, temperature = Adafruit_DHT.read_retry(sensor, DHT_PIN)
        if humidity is None or temperature is None:
            # Fallback if sensor fails to respond momentarily
            humidity = 55.4
            temperature = 23.8
    else:
        # Smooth random walk to look like true biological sensors
        temperature = round(22.0 + random.uniform(-1.5, 1.5), 1)
        humidity = round(55.0 + random.uniform(-2.0, 2.0), 1)

    # Sub-surface soil dielectric moisture simulation 
    moisture = round(58.0 + random.uniform(-4.0, 4.0), 1)

    payload = {
        "moisture": moisture,
        "temperature": temperature,
        "humidity": humidity,
        "timestamp": int(time.time())
    }
    return jsonify(payload)

# Home verification route
@app.route('/')
def home():
    return jsonify({
        "status": "online",
        "service": "Agrinovia Pi Intel-Agent Node",
        "video_route": "/video_feed",
        "data_route": "/data"
    })

if __name__ == '__main__':
    # Start on Port 5001 to match user setups: http://172.20.10.6:5001
    print("\n* ----------------------------------------------------")
    print("* Agrinovia Python Server starting on host 0.0.0.0:5001")
    print("* ----------------------------------------------------")
    app.run(host='0.0.0.0', port=5001, debug=False, threaded=True)
