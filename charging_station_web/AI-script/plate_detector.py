import os
import time
from flask import Flask, request, jsonify
import cv2
import numpy as np
from ultralytics import YOLO
from vietocr.tool.predictor import Predictor
from vietocr.tool.config import Cfg
from PIL import Image

app = Flask(__name__)
BASE_DIR = os.path.dirname(os.path.abspath(__file__))
YOLO_MODEL_PATH = os.path.join(BASE_DIR, "best.pt")
DEBUG_FOLDER = 'debug_images'
os.makedirs(DEBUG_FOLDER, exist_ok=True)

model = YOLO(YOLO_MODEL_PATH)
config = Cfg.load_config_from_name('vgg_transformer')
config['device'] = 'cpu'
vietocr_model = Predictor(config)

# ------------------- HÀM NHẬN DIỆN BIỂN SỐ -------------------
def detect_plate(image_bgr, conf_thresh=0.48):
    image_rgb = cv2.cvtColor(image_bgr, cv2.COLOR_BGR2RGB)
    results = model(image_rgb)
    plates = []
    debug_image = image_bgr.copy()

    for result in results:
        for box in result.boxes:
            conf = float(box.conf[0])
            if conf < conf_thresh:
                continue

            x1, y1, x2, y2 = map(int, box.xyxy[0])
            license_plate = image_rgb[y1:y2, x1:x2]
            timestamp = int(time.time() * 1000)
            debug_path = os.path.join(DEBUG_FOLDER, f"debug_{timestamp}.jpg")
            cv2.imwrite(debug_path, license_plate)
            
            h = y2 - y1
            mid = h // 2
            line1 = license_plate[:mid, :]
            line2 = license_plate[mid:, :]

            line1_pil = Image.fromarray(line1)
            line2_pil = Image.fromarray(line2)
            text_line1 = vietocr_model.predict(line1_pil).strip().upper()
            text_line1 = text_line1.replace('-', '')
            serial_char = text_line1[2]
            if serial_char.isdigit():
                if serial_char == '0':
                        serial_char = 'U'
                elif serial_char == '8':
                        serial_char = 'B'
                elif serial_char == '5':
                    serial_char = 'S'
                elif serial_char == '1':
                    serial_char = 'I'
                elif serial_char == '7':
                    serial_char = 'T'
                elif serial_char == '6':
                    serial_char = 'G'
            char_at_3 = text_line1[3:4]
            if char_at_3 and char_at_3.isalpha():
                if char_at_3 == 'O':
                    char_at_3 = '0'
                elif char_at_3 == 'B':
                    char_at_3 = '8'
                elif char_at_3 == 'S':
                    char_at_3 = '5'
                elif char_at_3 == 'T':
                    char_at_3 = '1'
                elif char_at_3 == 'G':
                    char_at_3 = '6'
            text_line1 = text_line1[:2] + serial_char + char_at_3
            text_line2 = vietocr_model.predict(line2_pil).strip()

            full_plate = text_line1 + text_line2
            full_plate = full_plate.replace('-', '').replace('.', '')
            plates.append(full_plate)
    
    return plates

# ------------------- API NHẬN ẢNH -------------------
@app.route("/detect", methods=["POST"])
def detect_api():
    threading.Thread(target=detect).start()

def detect():
    if 'image' not in request.files:
        return jsonify({"error": "Không có tệp ảnh"}), 400
    file = request.files['image']
    if file.filename == '':
        return jsonify({"error": "Tệp ảnh rỗng"}), 400
    try:
        frame = cv2.imdecode(np.frombuffer(file.read(), np.uint8), cv2.IMREAD_COLOR)
    except Exception as e:
        return jsonify({"error": f"Không thể giải mã ảnh: {e}"}), 400
    if frame is None:
        return jsonify({"error": "Dữ liệu ảnh không hợp lệ"}), 400

    plates = detect_plate(frame, conf_thresh=0.48)

    return jsonify({"plates": plates if plates else []})

if __name__ == "__main__":
    app.run(host="0.0.0.0", port=8000, debug=False)
