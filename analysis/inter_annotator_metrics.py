"""Agreement metrics for already de-identified, human-coded annotation tables."""

from collections import Counter
from itertools import product
from typing import Iterable


def raw_agreement(a: Iterable[str], b: Iterable[str]) -> float:
    pairs = list(zip(a, b, strict=True))
    return sum(left == right for left, right in pairs) / len(pairs) if pairs else 0.0


def disagreement_matrix(a: Iterable[str], b: Iterable[str]) -> dict[tuple[str, str], int]:
    return dict(Counter(zip(a, b, strict=True)))


def cohens_kappa(a: Iterable[str], b: Iterable[str]) -> float:
    pairs = list(zip(a, b, strict=True))
    if not pairs:
        return 0.0
    left, right = zip(*pairs)
    observed = raw_agreement(left, right)
    left_counts, right_counts = Counter(left), Counter(right)
    expected = sum((left_counts[label] / len(pairs)) * (right_counts[label] / len(pairs)) for label in set(left_counts) | set(right_counts))
    return (observed - expected) / (1 - expected) if expected != 1 else 1.0


def krippendorffs_alpha_nominal(codings: list[list[str]]) -> float:
    """Nominal alpha for complete, equally sized rater rows."""
    items = [row for row in codings if len(row) > 1]
    if not items:
        return 0.0
    observed_pairs = sum(len(row) * (len(row) - 1) for row in items)
    observed_disagreement = sum(sum(x != y for x, y in product(row, row)) for row in items) / observed_pairs
    all_values = [value for row in items for value in row]
    counts = Counter(all_values)
    total = len(all_values)
    expected_disagreement = 1 - sum((count / total) ** 2 for count in counts.values())
    return 1 - observed_disagreement / expected_disagreement if expected_disagreement else 1.0
