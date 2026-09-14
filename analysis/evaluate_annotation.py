"""Per-variable validation metrics for gold-standard automated annotation."""

from collections import Counter


def binary_metrics(gold: list[bool], predicted: list[bool]) -> dict[str, object]:
    if len(gold) != len(predicted):
        raise ValueError("gold and predicted labels must have equal length")
    counts = Counter(zip(gold, predicted))
    tp, fp, fn, tn = counts[(True, True)], counts[(False, True)], counts[(True, False)], counts[(False, False)]
    precision = tp / (tp + fp) if tp + fp else 0.0
    recall = tp / (tp + fn) if tp + fn else 0.0
    return {
        "precision": precision,
        "recall": recall,
        "f1": 2 * precision * recall / (precision + recall) if precision + recall else 0.0,
        "specificity": tn / (tn + fp) if tn + fp else None,
        "confusion_matrix": {"tp": tp, "fp": fp, "fn": fn, "tn": tn},
    }


def acceptance_status(f1: float) -> str:
    if f1 > 0.80:
        return "usable"
    if f1 >= 0.70:
        return "usable_with_caution"
    if f1 >= 0.60:
        return "exploratory"
    return "do_not_use_automatically"
