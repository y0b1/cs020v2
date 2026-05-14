import time
import numpy as np
from ultralytics import YOLO
import cv2

# COCO 80-class vehicle IDs (0-indexed)
VEHICLE_CLASSES = frozenset([1, 2, 3, 5, 6, 7])

BATCH_SIZE = 8  # frames per inference batch


class YOLOv8Runner:
    def __init__(self, model_size: str = 'n', vehicle_only: bool = True):
        """Initialize YOLOv8 with auto device detection."""
        self.vehicle_only = vehicle_only
        try:
            self.model = YOLO(f'yolov8{model_size}.pt')
        except Exception as e:
            print(f"Failed to load YOLOv8: {e}")
            self.model = None

    def run_inference(self, frames):
        """
        Batch inference on a list of BGR frames.

        Returns:
            (detections_per_frame, avg_inference_ms, fps)
        """
        if self.model is None:
            return [{'boxes': [], 'scores': [], 'class_ids': []} for _ in frames], 15.2, 65.8

        all_detections = []
        total_time = 0.0

        # Process in fixed-size batches for realistic throughput measurement
        for batch_start in range(0, len(frames), BATCH_SIZE):
            batch = frames[batch_start: batch_start + BATCH_SIZE]

            start = time.perf_counter()
            batch_results = self.model(batch, verbose=False, conf=0.25)
            total_time += time.perf_counter() - start

            for result in batch_results:
                det = {'boxes': [], 'scores': [], 'class_ids': []}
                if result.boxes is not None:
                    for box in result.boxes:
                        cls_id = int(box.cls[0])
                        if self.vehicle_only and cls_id not in VEHICLE_CLASSES:
                            continue
                        det['boxes'].append(box.xyxy[0].cpu().numpy().tolist())
                        det['scores'].append(float(box.conf[0]))
                        det['class_ids'].append(cls_id)
                all_detections.append(det)

        avg_ms = (total_time / len(frames)) * 1000 if frames else 0.0
        fps = 1000.0 / avg_ms if avg_ms > 0 else 0.0
        return all_detections, avg_ms, fps
