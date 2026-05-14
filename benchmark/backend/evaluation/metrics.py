import numpy as np
from typing import List, Dict, Tuple

# COCO 80-class vehicle IDs (0-indexed): bicycle, car, motorcycle, bus, train, truck
VEHICLE_CLASSES = frozenset([1, 2, 3, 5, 6, 7])

COCO_VEHICLE_NAMES = {
    1: 'bicycle', 2: 'car', 3: 'motorcycle',
    5: 'bus', 6: 'train', 7: 'truck',
}


def filter_vehicles(detections_list: List[Dict]) -> List[Dict]:
    """Keep only vehicle-class detections from each frame."""
    filtered = []
    for det in detections_list:
        boxes = det.get('boxes', [])
        scores = det.get('scores', [])
        class_ids = det.get('class_ids', [])
        v_boxes, v_scores, v_ids = [], [], []
        for box, score, cid in zip(boxes, scores, class_ids):
            if cid in VEHICLE_CLASSES:
                v_boxes.append(box)
                v_scores.append(score)
                v_ids.append(cid)
        filtered.append({'boxes': v_boxes, 'scores': v_scores, 'class_ids': v_ids})
    return filtered


class MetricsCalculator:
    """Calculate detection metrics (precision, recall, F1, mAP, temporal consistency)."""

    @staticmethod
    def calculate_iou(box1: List[float], box2: List[float]) -> float:
        """IoU between two boxes in [x1, y1, x2, y2] format."""
        x1 = max(box1[0], box2[0])
        y1 = max(box1[1], box2[1])
        x2 = min(box1[2], box2[2])
        y2 = min(box1[3], box2[3])

        if x2 < x1 or y2 < y1:
            return 0.0

        inter = (x2 - x1) * (y2 - y1)
        a1 = (box1[2] - box1[0]) * (box1[3] - box1[1])
        a2 = (box2[2] - box2[0]) * (box2[3] - box2[1])
        union = a1 + a2 - inter
        return inter / union if union > 0 else 0.0

    @staticmethod
    def calculate_precision_recall(
        predictions: List[Dict],
        ground_truth: List[Dict],
        iou_threshold: float = 0.5,
    ) -> Tuple[float, float, float]:
        """
        Global precision, recall, and F1 (greedy best-IoU matching per frame).
        """
        tp = fp = fn = 0

        for frame_pred, frame_gt in zip(predictions, ground_truth):
            pred_boxes = frame_pred.get('boxes', [])
            gt_boxes = frame_gt.get('boxes', [])
            matched_gt: set = set()

            for pred_box in pred_boxes:
                best_iou, best_j = 0.0, -1
                for j, gt_box in enumerate(gt_boxes):
                    if j in matched_gt:
                        continue
                    iou = MetricsCalculator.calculate_iou(pred_box, gt_box)
                    if iou > best_iou:
                        best_iou, best_j = iou, j

                if best_iou >= iou_threshold:
                    tp += 1
                    matched_gt.add(best_j)
                else:
                    fp += 1

            fn += len(gt_boxes) - len(matched_gt)

        precision = tp / (tp + fp) if (tp + fp) > 0 else 0.0
        recall = tp / (tp + fn) if (tp + fn) > 0 else 0.0
        f1 = (2 * precision * recall / (precision + recall)
              if (precision + recall) > 0 else 0.0)
        return precision, recall, f1

    @staticmethod
    def calculate_ap(
        predictions: List[Dict],
        ground_truth: List[Dict],
        iou_threshold: float = 0.5,
    ) -> float:
        """
        PASCAL VOC 2010+ interpolated Average Precision.

        All predictions across frames are sorted by confidence score, then
        matched greedily to ground-truth boxes. The area under the resulting
        precision-recall curve is the AP.
        """
        # Collect every prediction with its frame index
        all_preds: List[Tuple[float, int, List[float]]] = []
        for fi, fp in enumerate(predictions):
            for box, score in zip(fp.get('boxes', []), fp.get('scores', [])):
                all_preds.append((float(score), fi, box))

        total_gt = sum(len(gt.get('boxes', [])) for gt in ground_truth)
        if total_gt == 0 or not all_preds:
            return 0.0

        # Sort descending by confidence
        all_preds.sort(key=lambda x: -x[0])

        matched_gts: List[set] = [set() for _ in ground_truth]
        tp_list: List[int] = []
        fp_list: List[int] = []

        for score, fi, pred_box in all_preds:
            if fi >= len(ground_truth):
                fp_list.append(1); tp_list.append(0)
                continue

            gt_boxes = ground_truth[fi].get('boxes', [])
            best_iou, best_j = 0.0, -1

            for j, gt_box in enumerate(gt_boxes):
                if j in matched_gts[fi]:
                    continue
                iou = MetricsCalculator.calculate_iou(pred_box, gt_box)
                if iou > best_iou:
                    best_iou, best_j = iou, j

            if best_iou >= iou_threshold:
                tp_list.append(1); fp_list.append(0)
                matched_gts[fi].add(best_j)
            else:
                tp_list.append(0); fp_list.append(1)

        tp_cum = np.cumsum(tp_list, dtype=float)
        fp_cum = np.cumsum(fp_list, dtype=float)

        recalls = tp_cum / total_gt
        precisions = tp_cum / (tp_cum + fp_cum)

        # Prepend origin sentinel; make precision monotonically non-increasing
        recalls = np.concatenate([[0.0], recalls])
        precisions = np.concatenate([[1.0], precisions])
        for i in range(len(precisions) - 2, -1, -1):
            precisions[i] = max(precisions[i], precisions[i + 1])

        # Area under the curve via right-Riemann summation at recall breakpoints
        ap = float(np.sum((recalls[1:] - recalls[:-1]) * precisions[1:]))
        return float(np.clip(ap, 0.0, 1.0))

    @staticmethod
    def calculate_map5095(
        predictions: List[Dict],
        ground_truth: List[Dict],
    ) -> float:
        """COCO-style mAP@[0.5:0.95] — mean AP over 10 IoU thresholds."""
        thresholds = [0.50, 0.55, 0.60, 0.65, 0.70, 0.75, 0.80, 0.85, 0.90, 0.95]
        aps = [
            MetricsCalculator.calculate_ap(predictions, ground_truth, t)
            for t in thresholds
        ]
        return float(np.mean(aps))

    @staticmethod
    def calculate_temporal_consistency(predictions_per_frame: List[Dict]) -> float:
        """
        Frame-to-frame detection stability (important for CCTV video).

        For every consecutive frame pair, each detection in frame A is matched
        to its best-IoU partner in frame B. The mean of those max-IoU values
        is the temporal consistency score (0 = no overlap, 1 = perfect stability).
        """
        if len(predictions_per_frame) < 2:
            return 1.0

        total, count = 0.0, 0
        for frame_a, frame_b in zip(predictions_per_frame, predictions_per_frame[1:]):
            boxes_a = frame_a.get('boxes', [])
            boxes_b = frame_b.get('boxes', [])
            if not boxes_a or not boxes_b:
                continue
            for box_a in boxes_a:
                max_iou = max(
                    MetricsCalculator.calculate_iou(box_a, bb) for bb in boxes_b
                )
                total += max_iou
                count += 1

        return total / count if count > 0 else 0.0


def calculate_metrics(
    predictions: List[Dict],
    ground_truth: List[Dict] = None,
    vehicle_only: bool = True,
) -> Dict:
    """
    Compute all evaluation metrics for a single configuration.

    Args:
        predictions:   Per-frame detection dicts from the model.
        ground_truth:  Per-frame GT dicts (pseudo-GT if no labels available).
        vehicle_only:  If True, restrict evaluation to COCO vehicle classes.

    Returns:
        Dict with precision, recall, f1, mAP50, mAP5095, temporal_consistency.
    """
    if ground_truth is None:
        ground_truth = [{'boxes': [], 'scores': [], 'class_ids': []} for _ in predictions]

    if vehicle_only:
        predictions = filter_vehicles(predictions)
        ground_truth = filter_vehicles(ground_truth)

    calc = MetricsCalculator()

    prec, rec, f1 = calc.calculate_precision_recall(predictions, ground_truth, 0.5)
    map50 = calc.calculate_ap(predictions, ground_truth, 0.5)
    map5095 = calc.calculate_map5095(predictions, ground_truth)
    tc = calc.calculate_temporal_consistency(predictions)

    return {
        'precision': round(prec, 4),
        'recall': round(rec, 4),
        'f1': round(f1, 4),
        'mAP50': round(map50, 4),
        'mAP5095': round(map5095, 4),
        'temporal_consistency': round(tc, 4),
    }
