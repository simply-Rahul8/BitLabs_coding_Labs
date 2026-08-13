from app.services.execution_service import DockerExecutionService


async def run_test_cases(
    source_code: str, language: str, test_cases: list[dict], timeout: int = 10
) -> dict:
    service = DockerExecutionService()
    results: list[dict] = []
    passed_count = 0
    for test_case in test_cases:
        result = await service.execute(source_code, language, stdin=test_case["input"], timeout=timeout)
        actual = str(result["stdout"]).strip()
        expected = str(test_case["expected_output"]).strip()
        passed = actual == expected and result["exit_code"] == 0
        if passed:
            passed_count += 1
        results.append(
            {
                "input": test_case["input"],
                "expected": test_case["expected_output"],
                "actual": actual,
                "passed": passed,
                "stderr": result["stderr"],
                "timed_out": result["timed_out"],
                "is_hidden": test_case.get("is_hidden", False),
            }
        )
    total = len(results)
    return {"passed": passed_count, "failed": total - passed_count, "total": total, "results": results}
