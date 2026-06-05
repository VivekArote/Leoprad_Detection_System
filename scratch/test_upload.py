import requests

NODE_URL = 'https://leopraddetectionsystem-production.up.railway.app/api/detections'

base64_jpeg = (
    "data:image/jpeg;base64,/9j/4AAQSkZJRgABAQEASABIAAD/2wBDAP//////////////////"
    "//////////////////////////////////////////////////////////////////////wgALCAAK"
    "AAoBAREA/8QAFBABAAAAAAAAAAAAAAAAAAAAAP/aAAgBAQABPxA="
)

payload = {
    "label": "leopard_body",
    "confidence": 0.99,
    "timestamp": "2026-06-03 12:00:00",
    "image_path": "detections/test_alert.jpg",
    "image_base64": base64_jpeg,
    "camera_id": "camera-01",
    "camera_location": "Test Location",
    "bounding_box": {"x": 10, "y": 10, "width": 80, "height": 80}
}

print(f"Sending test payload with base64 image to: {NODE_URL}...")
try:
    response = requests.post(NODE_URL, json=payload, timeout=20)
    print(f"Status Code: {response.status_code}")
    print(f"Response: {response.text}")
except Exception as e:
    print(f"Error: {e}")
