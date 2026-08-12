import asyncio
import shutil
import tempfile
from pathlib import Path


class DockerExecutionService:
    IMAGES = {
        "python": "python:3.11-slim",
        "c": "gcc:latest",
        "cpp": "gcc:latest",
        "java": "openjdk:17-slim",
        "javascript": "node:18-slim",
    }
    COMPILE_CMDS = {
        "c": ["gcc", "solution.c", "-o", "solution"],
        "cpp": ["g++", "solution.cpp", "-o", "solution"],
        "java": ["javac", "Main.java"],
    }
    RUN_CMDS = {
        "python": ["python", "solution.py"],
        "c": ["./solution"],
        "cpp": ["./solution"],
        "java": ["java", "Main"],
        "javascript": ["node", "solution.js"],
    }
    FILENAMES = {
        "python": "solution.py",
        "c": "solution.c",
        "cpp": "solution.cpp",
        "java": "Main.java",
        "javascript": "solution.js",
    }

    @staticmethod
    def _write_files(tmp_dir: str, filename: str, source_code: str, stdin: str) -> None:
        directory = Path(tmp_dir)
        (directory / filename).write_text(source_code, encoding="utf-8")
        (directory / "input.txt").write_text(stdin, encoding="utf-8")

    def _docker_command(self, tmp_dir: str, language: str) -> list[str]:
        run_command = " ".join(self.RUN_CMDS[language])
        compile_command = self.COMPILE_CMDS.get(language)
        shell_command = f"{run_command} < input.txt"
        if compile_command:
            shell_command = f"{' '.join(compile_command)} && {shell_command}"
        volume_path = tmp_dir.replace("\\", "/")
        return [
            "docker", "run", "--rm", "--network", "none", "--memory", "128m", "--cpus", "0.5",
            "-v", f"{volume_path}:/code", "-w", "/code", self.IMAGES[language], "sh", "-c", shell_command,
        ]

    async def execute(
        self, source_code: str, language: str, stdin: str = "", timeout: int = 10
    ) -> dict[str, str | int | bool | None]:
        if language not in self.IMAGES:
            return {"stdout": "", "stderr": "", "exit_code": -1, "timed_out": False, "error": f"Unsupported language: {language}"}

        tmp_dir: str | None = None
        process: asyncio.subprocess.Process | None = None
        try:
            tmp_dir = await asyncio.to_thread(tempfile.mkdtemp)
            await asyncio.to_thread(self._write_files, tmp_dir, self.FILENAMES[language], source_code, stdin)
            process = await asyncio.create_subprocess_exec(
                *self._docker_command(tmp_dir, language),
                stdout=asyncio.subprocess.PIPE,
                stderr=asyncio.subprocess.PIPE,
            )
            communication = asyncio.create_task(process.communicate())
            stdout, stderr = await asyncio.wait_for(asyncio.shield(communication), timeout=timeout)
            return {
                "stdout": stdout.decode("utf-8", errors="replace"),
                "stderr": stderr.decode("utf-8", errors="replace"),
                "exit_code": process.returncode if process.returncode is not None else -1,
                "timed_out": False,
                "error": None,
            }
        except asyncio.TimeoutError:
            if process is not None and process.returncode is None:
                process.kill()
                stdout, stderr = await communication
            else:
                stdout, stderr = b"", b""
            return {
                "stdout": stdout.decode("utf-8", errors="replace"),
                "stderr": stderr.decode("utf-8", errors="replace") or "Execution timed out.",
                "exit_code": process.returncode if process and process.returncode is not None else -1,
                "timed_out": True, "error": None,
            }
        except FileNotFoundError:
            return {
                "stdout": "", "stderr": "", "exit_code": -1, "timed_out": False,
                "error": "Docker not found. Is Docker Desktop running?",
            }
        except NotImplementedError:
            return {
                "stdout": "",
                "stderr": "",
                "exit_code": -1,
                "timed_out": False,
                "error": (
                    "Windows async subprocesses require a Proactor event loop. "
                    "Start the development server with python run.py."
                ),
            }
        except Exception as exc:
            message = str(exc) or type(exc).__name__
            return {"stdout": "", "stderr": "", "exit_code": -1, "timed_out": False, "error": message}
        finally:
            if tmp_dir is not None:
                await asyncio.to_thread(shutil.rmtree, tmp_dir, ignore_errors=True)
