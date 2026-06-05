"""
Leopard Detection Pipeline (v2)
================================
Reads live webcam frames, runs YOLOv8 inference, and sends detection
payloads to the Node.js server.

The payload now includes `camera_id` and `bounding_box` fields that the
new server uses for MongoDB storage and Cloudinary folder routing.

Backward-compatible: the server still accepts the original payload shape.
"""

import cv2
import serial
import requests
import time
import datetime
import os
import threading
from ultralytics import YOLO
from dotenv import load_dotenv

# =========================
# CONFIG
# =========================
SCRIPT_DIR    = os.path.dirname(os.path.abspath(__file__))
BACKEND_DIR   = os.path.dirname(os.path.dirname(SCRIPT_DIR))
DETECTIONS_DIR = os.path.join(BACKEND_DIR, 'detections')

# Load .env file from the backend folder
load_dotenv(os.path.join(BACKEND_DIR, '.env'))

MODEL_PATH    = os.path.join(SCRIPT_DIR, 'best.pt')
ARDUINO_PORT  = os.environ.get('ARDUINO_PORT', 'COM3')
NODE_URL      = os.environ.get('NODE_URL', 'http://localhost:3000/detection')
CAMERA_ID     = os.environ.get('CAMERA_ID', 'camera-01')
CAMERA_LOCATION = os.environ.get('CAMERA_LOCATION', 'Unknown')

HEAD_CLASSES   = {"head"}
BODY_CLASSES   = {".", "0", "flank", "left_flank", "right_flank", "top"}

HEAD_CONFIDENCE  = 0.80
BODY_CONFIDENCE  = 0.80
ALERT_COOLDOWN   = 15  # seconds

last_alert = 0

# =========================
# INIT
# =========================
arduino = None
try:
    arduino = serial.Serial(ARDUINO_PORT, 9600, timeout=1)
    time.sleep(2)
    print("✅ Arduino connected successfully")
except Exception as e:
    print(f"⚠️ Arduino connection failed: {e}. Running without hardware alert.")

try:
    model = YOLO(MODEL_PATH)
    print("Model classes:", model.names)
    print("✅ YOLO Model loaded successfully")
except Exception as e:
    print(f"❌ Model initialization failed: {e}")
    exit()


def alert_node(data: dict):
    """Sends detection payload to the Node.js server in a background thread."""
    try:
        requests.post(NODE_URL, json=data, timeout=10)
    except Exception as e:
        print(f"Node alert failed: {e}")


cap = cv2.VideoCapture(0)

if not cap.isOpened():
    print("❌ Could not open camera")
    exit()

os.makedirs(DETECTIONS_DIR, exist_ok=True)

# =========================
# MAIN LOOP
# =========================
while cap.isOpened():
    success, frame = cap.read()
    if not success:
        print("❌ Failed to read frame")
        break

    results = model.track(frame, persist=True, verbose=False)
    annotated_frame = frame.copy()

    detection_triggered = False
    detected_label = None
    detected_conf  = 0.0
    detected_box   = {"x": 0, "y": 0, "width": 0, "height": 0}

    for r in results:
        if r.boxes is None:
            continue

        for box in r.boxes:
            cls_id     = int(box.cls[0])
            confidence = float(box.conf[0])
            label      = str(model.names[cls_id]).strip().lower()

            should_draw = False
            box_color   = (0, 255, 0)

            # HEAD
            if label in HEAD_CLASSES and confidence >= HEAD_CONFIDENCE:
                should_draw = True
                box_color   = (255, 0, 0)  # blue
                if not detection_triggered or confidence > detected_conf:
                    detection_triggered = True
                    detected_label      = "leopard_head"
                    detected_conf       = confidence

            # BODY
            elif label in BODY_CLASSES and confidence >= BODY_CONFIDENCE:
                should_draw = True
                box_color   = (0, 255, 0)  # green
                if not detection_triggered or confidence > detected_conf:
                    detection_triggered = True
                    detected_label      = "leopard_body"
                    detected_conf       = confidence

            if should_draw:
                x1, y1, x2, y2 = map(int, box.xyxy[0])
                detected_box = {
                    "x": x1, "y": y1,
                    "width": x2 - x1, "height": y2 - y1,
                }
                cv2.rectangle(annotated_frame, (x1, y1), (x2, y2), box_color, 2)
                cv2.putText(
                    annotated_frame,
                    f"{label} {confidence:.2f}",
                    (x1, max(y1 - 10, 20)),
                    cv2.FONT_HERSHEY_SIMPLEX,
                    0.6, box_color, 2,
                )

    # Alert handling
    now = time.time()
    if detection_triggered and (now - last_alert) > ALERT_COOLDOWN:
        last_alert = now

        try:
            if arduino:
                arduino.write(b'H')
        except Exception as e:
            print(f"Arduino write failed: {e}")

        img_name = f"alert_{int(now)}.jpg"
        img_path = os.path.join(DETECTIONS_DIR, img_name)
        cv2.imwrite(img_path, annotated_frame)

        payload = {
            "label":           detected_label,
            "confidence":      detected_conf,
            "timestamp":       datetime.datetime.now().astimezone().isoformat(),
            "image_path":      f"detections/{img_name}",
            # New fields used by the enhanced server (ignored gracefully by the old one)
            "camera_id":       CAMERA_ID,
            "camera_location": CAMERA_LOCATION,
            "bounding_box":    detected_box,
        }

        threading.Thread(target=alert_node, args=(payload,), daemon=True).start()
        print(f"🚨 Detection sent: {detected_label} ({detected_conf:.2f})")

    cv2.imshow("Leopard Detection Monitor", annotated_frame)

    if cv2.waitKey(1) & 0xFF == ord('q'):
        break

cap.release()
cv2.destroyAllWindows()
arduino.close()
