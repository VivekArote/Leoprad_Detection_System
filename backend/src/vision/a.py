from ultralytics import YOLO

model = YOLO("C:/Users/vivek/Desktop/Projects/leopardDetection/src/vision/best.pt")
print(model.names)