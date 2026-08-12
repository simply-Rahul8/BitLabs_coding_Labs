def calculate_score(test_results: dict) -> float:
    total = int(test_results.get("total", 0))
    if total == 0:
        return 0.0
    return round((int(test_results.get("passed", 0)) / total) * 100, 1)
