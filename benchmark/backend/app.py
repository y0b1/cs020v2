import os
import time
import uuid
import json
import base64
import threading
from pathlib import Path
from flask import Flask, request, jsonify, Response
from flask_cors import CORS
import cv2
import numpy as np

from evaluation.benchmarker import BenchmarkRunner

# Initialize Flask app
app = Flask(__name__)
CORS(app)

# Configuration
UPLOAD_FOLDER = 'uploads'
ALLOWED_EXTENSIONS = {'mp4', 'avi', 'mov', 'mkv', 'jpg', 'jpeg', 'png', 'bmp'}

if not os.path.exists(UPLOAD_FOLDER):
    os.makedirs(UPLOAD_FOLDER)

app.config['UPLOAD_FOLDER'] = UPLOAD_FOLDER
app.config['MAX_CONTENT_LENGTH'] = 500 * 1024 * 1024  # 500MB max

# Initialize benchmarker
benchmarker = BenchmarkRunner(UPLOAD_FOLDER)


def allowed_file(filename):
    return '.' in filename and filename.rsplit('.', 1)[1].lower() in ALLOWED_EXTENSIONS


# ============================================================
# API ENDPOINTS
# ============================================================

@app.route('/api/upload', methods=['POST'])
def upload_file():
    """
    Upload video or images for benchmarking.
    Returns: { job_id: string }
    """
    try:
        # Check if file is in request
        if 'file' not in request.files:
            return jsonify({'error': 'No file provided'}), 400
        
        file = request.files['file']
        
        if file.filename == '':
            return jsonify({'error': 'No file selected'}), 400
        
        if not allowed_file(file.filename):
            return jsonify({'error': 'File type not allowed'}), 400
        
        # Create job directory
        job_id = str(uuid.uuid4())
        job_path = os.path.join(UPLOAD_FOLDER, job_id)
        os.makedirs(job_path, exist_ok=True)
        
        # Save file
        filename = file.filename
        file.save(os.path.join(job_path, filename))
        
        return jsonify({'job_id': job_id}), 200
    
    except Exception as e:
        return jsonify({'error': str(e)}), 500


@app.route('/api/benchmark/<job_id>', methods=['POST'])
def start_benchmark(job_id):
    """
    Start benchmark run for a job.
    Runs in background thread.
    """
    try:
        # Start benchmark in background thread
        thread = threading.Thread(target=benchmarker.run_benchmark, args=(job_id,))
        thread.daemon = True
        thread.start()
        
        return jsonify({'status': 'started', 'job_id': job_id}), 200
    
    except Exception as e:
        return jsonify({'error': str(e)}), 500


@app.route('/api/status/<job_id>', methods=['GET'])
def get_status(job_id):
    """
    Get current status of benchmark job.
    Returns: { progress: 0-100, current_config: string, status: "running"|"done"|"error" }
    """
    try:
        progress_info = benchmarker.get_progress(job_id)
        return jsonify(progress_info), 200
    except Exception as e:
        return jsonify({'error': str(e)}), 500


@app.route('/api/results/<job_id>', methods=['GET'])
def get_results(job_id):
    """
    Get full benchmark results for a job.
    Returns full metrics JSON for all 4 configs.
    """
    try:
        results = benchmarker.get_results(job_id)
        if not results:
            return jsonify({'error': 'Results not ready or job not found'}), 404
        return jsonify(results), 200
    except Exception as e:
        return jsonify({'error': str(e)}), 500


@app.route('/api/sample', methods=['GET'])
def get_sample():
    """
    Get mock results for UI development.
    No models needed, instant response.
    """
    try:
        sample_results = BenchmarkRunner.get_sample_results()
        return jsonify(sample_results), 200
    except Exception as e:
        return jsonify({'error': str(e)}), 500


@app.route('/api/preview/<job_id>/<config>', methods=['GET'])
def get_preview(job_id, config):
    """
    Get annotated frame preview for a configuration.
    Returns base64 encoded image.
    """
    try:
        # Load a frame from the uploaded files
        job_path = os.path.join(UPLOAD_FOLDER, job_id)
        
        # Find first image or extract first frame from video
        frame = None
        
        # Check for images
        for file in os.listdir(job_path):
            if file.lower().endswith(('.jpg', '.jpeg', '.png', '.bmp')):
                img_path = os.path.join(job_path, file)
                frame = cv2.imread(img_path)
                frame = cv2.resize(frame, (640, 640))
                break
        
        # If no image, try video
        if frame is None:
            for file in os.listdir(job_path):
                if file.lower().endswith(('.mp4', '.avi', '.mov', '.mkv')):
                    video_path = os.path.join(job_path, file)
                    cap = cv2.VideoCapture(video_path)
                    ret, frame = cap.read()
                    cap.release()
                    if ret:
                        frame = cv2.resize(frame, (640, 640))
                    break
        
        if frame is None:
            frame = np.ones((640, 640, 3), dtype=np.uint8) * 40

        # Draw actual bounding boxes from the completed benchmark run
        frame_with_boxes = frame.copy()
        detections = benchmarker.get_preview_detections(job_id, config)
        boxes  = detections.get('boxes', [])
        scores = detections.get('scores', [])

        if boxes:
            for box, score in zip(boxes, scores):
                x1, y1, x2, y2 = int(box[0]), int(box[1]), int(box[2]), int(box[3])
                cv2.rectangle(frame_with_boxes, (x1, y1), (x2, y2), (0, 255, 80), 2)
                cv2.putText(frame_with_boxes, f'{score:.2f}',
                            (x1, max(y1 - 5, 10)),
                            cv2.FONT_HERSHEY_SIMPLEX, 0.45, (0, 255, 80), 1)
        else:
            cv2.putText(frame_with_boxes, 'Run benchmark to annotate',
                        (10, 30), cv2.FONT_HERSHEY_SIMPLEX, 0.55, (120, 120, 120), 1)
        
        # Encode to base64
        _, buffer = cv2.imencode('.jpg', frame_with_boxes)
        img_base64 = base64.b64encode(buffer).decode('utf-8')
        
        return jsonify({'image': f'data:image/jpeg;base64,{img_base64}'}), 200
    
    except Exception as e:
        print(f"Preview error: {e}")
        # Return placeholder image
        frame = np.ones((640, 640, 3), dtype=np.uint8) * 50
        _, buffer = cv2.imencode('.jpg', frame)
        img_base64 = base64.b64encode(buffer).decode('utf-8')
        return jsonify({'image': f'data:image/jpeg;base64,{img_base64}'}), 200


@app.route('/api/stream/<job_id>')
def stream_video(job_id):
    """
    MJPEG stream of the uploaded video with live detection annotations.
    Query param: model=yolov8 (default) | model=rtdetr
    Use as: <img src="/api/stream/<job_id>?model=yolov8">
    """
    model_name = request.args.get('model', 'yolov8')

    def generate():
        job_path = os.path.join(UPLOAD_FOLDER, job_id)
        if not os.path.exists(job_path):
            return

        video_path = None
        for file in sorted(os.listdir(job_path)):
            if file.lower().endswith(('.mp4', '.avi', '.mov', '.mkv')):
                video_path = os.path.join(job_path, file)
                break

        if not video_path:
            return

        cap = cv2.VideoCapture(video_path)
        if not cap.isOpened():
            return

        raw_fps = cap.get(cv2.CAP_PROP_FPS) or 30
        target_delay = 1.0 / min(raw_fps, 30)

        runner = benchmarker.yolo_runner if model_name == 'yolov8' else benchmarker.effdet_runner
        display_label = 'YOLOv8' if model_name == 'yolov8' else 'RT-DETR'

        try:
            while True:
                t0 = time.time()
                ret, frame = cap.read()
                if not ret:
                    cap.set(cv2.CAP_PROP_POS_FRAMES, 0)
                    ret, frame = cap.read()
                    if not ret:
                        break

                frame = cv2.resize(frame, (640, 640))

                if runner:
                    try:
                        preds_list, _, _ = runner.run_inference([frame])
                        preds = preds_list[0] if preds_list else {}
                        for box, score in zip(preds.get('boxes', []), preds.get('scores', [])):
                            x1, y1, x2, y2 = int(box[0]), int(box[1]), int(box[2]), int(box[3])
                            cv2.rectangle(frame, (x1, y1), (x2, y2), (0, 255, 80), 2)
                            cv2.putText(frame, f'{score:.2f}', (x1, max(y1 - 5, 10)),
                                        cv2.FONT_HERSHEY_SIMPLEX, 0.45, (0, 255, 80), 1)
                    except Exception:
                        pass

                # OSD label (shadow + colour for readability)
                cv2.putText(frame, display_label, (8, 26),
                            cv2.FONT_HERSHEY_SIMPLEX, 0.7, (0, 0, 0), 3)
                cv2.putText(frame, display_label, (8, 26),
                            cv2.FONT_HERSHEY_SIMPLEX, 0.7, (0, 255, 80), 2)

                _, buffer = cv2.imencode('.jpg', frame, [cv2.IMWRITE_JPEG_QUALITY, 82])
                yield (b'--frame\r\n'
                       b'Content-Type: image/jpeg\r\n\r\n' + buffer.tobytes() + b'\r\n')

                elapsed = time.time() - t0
                sleep_dur = target_delay - elapsed
                if sleep_dur > 0:
                    time.sleep(sleep_dur)
        except GeneratorExit:
            pass
        finally:
            cap.release()

    return Response(generate(), mimetype='multipart/x-mixed-replace; boundary=frame')


@app.route('/api/export/<job_id>', methods=['GET'])
def export_results(job_id):
    """
    Download benchmark results as a CSV file for thesis analysis.
    """
    try:
        results = benchmarker.get_results(job_id)
        if not results:
            return jsonify({'error': 'Results not ready or job not found'}), 404

        import csv
        import io
        from flask import Response

        metrics_order = [
            'precision', 'recall', 'f1',
            'mAP50', 'mAP5095', 'temporal_consistency',
            'avg_inference_ms', 'fps',
        ]

        output = io.StringIO()
        writer = csv.writer(output)
        writer.writerow(['Configuration'] + metrics_order)
        for config, m in results.items():
            writer.writerow([config] + [m.get(k, '') for k in metrics_order])

        output.seek(0)
        filename = f'benchmark_{job_id[:8]}.csv'
        return Response(
            output.getvalue(),
            mimetype='text/csv',
            headers={'Content-Disposition': f'attachment; filename={filename}'},
        )
    except Exception as e:
        return jsonify({'error': str(e)}), 500


@app.route('/api/health', methods=['GET'])
def health_check():
    """Health check endpoint."""
    return jsonify({'status': 'ok'}), 200


# ============================================================
# ERROR HANDLERS
# ============================================================

@app.errorhandler(413)
def request_entity_too_large(error):
    return jsonify({'error': 'File too large (max 500MB)'}), 413


@app.errorhandler(404)
def not_found(error):
    return jsonify({'error': 'Endpoint not found'}), 404


@app.errorhandler(500)
def internal_error(error):
    return jsonify({'error': 'Internal server error'}), 500


if __name__ == '__main__':
    app.run(debug=True, host='0.0.0.0', port=5001)
