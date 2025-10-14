import cv2
from ultralytics import YOLO
import easyocr
import requests
import time

ESP32_URL = "http://192.168.0.103:81/stream"
BACKEND_URL = "http://localhost:8080/api/plate/check-list"
CONFIDENCE_THRESHOLD = 0.5
SEND_INTERVAL = 5  # gửi mỗi 5 giây

model = YOLO("yolov8n.pt")
ocr_reader = easyocr.Reader(['en'])

cap = cv2.VideoCapture(ESP32_URL)
if not cap.isOpened():
    print("[ERROR] Không kết nối được ESP32-CAM.")
    exit()

detected_plates = set()  # dùng set để loại trùng
last_send_time = 0

print("[INFO] Bắt đầu nhận diện nhiều biển số...")

while True:
    ret, frame = cap.read()
    if not ret:
        print("[WARN] Mất khung hình...")
        time.sleep(1)
        continue

    results = model(frame, verbose=False)
    boxes = results[0].boxes.xyxy
    confs = results[0].boxes.conf

    for i, box in enumerate(boxes):
        if confs[i] < CONFIDENCE_THRESHOLD:
            continue

        x1, y1, x2, y2 = map(int, box)
        roi = frame[y1:y2, x1:x2]

        text_results = ocr_reader.readtext(roi)
        plate_text = ""
        for (_, text, confidence) in text_results:
            if confidence > 0.5:
                plate_text += text + " "
        plate_text = plate_text.strip().replace(" ", "")

        if plate_text:
            detected_plates.add(plate_text)
            cv2.rectangle(frame, (x1, y1), (x2, y2), (0, 255, 0), 2)
            cv2.putText(frame, plate_text, (x1, y1 - 10),
                        cv2.FONT_HERSHEY_SIMPLEX, 0.8, (0, 255, 0), 2)

    # Sau mỗi 5 giây gửi tất cả biển số hiện có
    if time.time() - last_send_time > SEND_INTERVAL and detected_plates:
        plates_list = list(detected_plates)
        print(f"[SEND] Gửi {len(plates_list)} biển số: {plates_list}")

        try:
            response = requests.post(BACKEND_URL, json={"plates": plates_list})
            if response.status_code == 200:
                results = response.json()
                for r in results:
                    if r["exists"]:
                        print(f"[MATCH] {r['plate']} có trong DB.")
                    else:
                        print(f"[UNKNOWN] {r['plate']} không có trong DB.")
            else:
                print(f"[ERROR] API lỗi: {response.status_code}")
        except Exception as e:
            print(f"[ERROR] Không gửi được dữ liệu: {e}")

        detected_plates.clear()
        last_send_time = time.time()
    if cv2.waitKey(1) & 0xFF == ord('q'):
        break

cap.release()
cv2.destroyAllWindows()
