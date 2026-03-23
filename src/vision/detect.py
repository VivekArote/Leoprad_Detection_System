import cv2
import serial
import requests
import time
import os
import threading
from ultralytics import YOLO

# =========================
# CONFIG
# =========================
MODEL_PATH = os.path.join(os.path.dirname(__file__), 'best.pt')
ARDUINO_PORT = 'COM3'
NODE_URL = "http://localhost:3000/detection"

HEAD_CLASSES = {"head"}
BODY_CLASSES = {".", "0", "flank", "left_flank", "right_flank", "top"}

HEAD_CONFIDENCE = 0.80
BODY_CONFIDENCE = 0.60
ALERT_COOLDOWN = 15  # seconds

last_alert = 0

# =========================
# INIT
# =========================
try:
    arduino = serial.Serial(ARDUINO_PORT, 9600, timeout=1)
    time.sleep(2)
    model = YOLO(MODEL_PATH)
    print("Model classes:", model.names)
    print("✅ Model and Arduino connected successfully")
except Exception as e:
    print(f"❌ Error during initialization: {e}")
    exit()

def alert_node(data):
    try:
        requests.post(NODE_URL, json=data, timeout=5)
    except Exception as e:
        print(f"Node alert failed: {e}")

cap = cv2.VideoCapture(0)

if not cap.isOpened():
    print("❌ Could not open camera")
    exit()

os.makedirs("detections", exist_ok=True)

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
    detected_conf = 0.0

    for r in results:
        if r.boxes is None:
            continue

        for box in r.boxes:
            cls_id = int(box.cls[0])
            confidence = float(box.conf[0])
            label = str(model.names[cls_id]).strip().lower()

            should_draw = False
            box_color = (0, 255, 0)

            # HEAD
            if label in HEAD_CLASSES and confidence >= HEAD_CONFIDENCE:
                should_draw = True
                box_color = (255, 0, 0)  # blue
                if not detection_triggered or confidence > detected_conf:
                    detection_triggered = True
                    detected_label = "leopard_head"
                    detected_conf = confidence

            # BODY
            elif label in BODY_CLASSES and confidence >= BODY_CONFIDENCE:
                should_draw = True
                box_color = (0, 255, 0)  # green
                if not detection_triggered or confidence > detected_conf:
                    detection_triggered = True
                    detected_label = "leopard_body"
                    detected_conf = confidence

            # Draw only filtered detections
            if should_draw:
                x1, y1, x2, y2 = map(int, box.xyxy[0])

                cv2.rectangle(annotated_frame, (x1, y1), (x2, y2), box_color, 2)
                cv2.putText(
                    annotated_frame,
                    f"{label} {confidence:.2f}",
                    (x1, max(y1 - 10, 20)),
                    cv2.FONT_HERSHEY_SIMPLEX,
                    0.6,
                    box_color,
                    2
                )

    # Alert handling
    now = time.time()
    if detection_triggered and (now - last_alert) > ALERT_COOLDOWN:
        last_alert = now

        try:
            arduino.write(b'H')
        except Exception as e:
            print(f"Arduino write failed: {e}")

        img_path = f"detections/alert_{int(now)}.jpg"
        cv2.imwrite(img_path, annotated_frame)

        payload = {
            "label": detected_label,
            "confidence": detected_conf,
            "timestamp": time.strftime("%Y-%m-%d %H:%M:%S"),
            "image_path": img_path
        }

        threading.Thread(target=alert_node, args=(payload,), daemon=True).start()
        print(f"🚨 Detection sent: {detected_label} ({detected_conf:.2f})")

    cv2.imshow("Leopard Detection Monitor", annotated_frame)

    if cv2.waitKey(1) & 0xFF == ord('q'):
        break

cap.release()
cv2.destroyAllWindows()
arduino.close()