import asyncio
import shutil
import tempfile
from pathlib import Path
from app.core.config import settings

class DockerExecutionService:
    _semaphore: asyncio.Semaphore | None = None

    @classmethod
    def get_semaphore(cls) -> asyncio.Semaphore:
        if cls._semaphore is None:
            cls._semaphore = asyncio.Semaphore(settings.MAX_CONCURRENT_EXECUTIONS)
        return cls._semaphore

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

    async def _execute_locally(
        self, tmp_dir: str, language: str, stdin: str, timeout: int
    ) -> dict[str, str | int | bool | None]:
        filename = self.FILENAMES[language]
        directory = Path(tmp_dir)
        code_file = str(directory / filename)
        input_file = str(directory / "input.txt")

        try:
            if language == "python":
                cmd = ["python", code_file]
            elif language == "javascript":
                cmd = ["node", code_file]
            elif language in ("c", "cpp"):
                compiler = "gcc" if language == "c" else "g++"
                out_bin = str(directory / "solution.exe")
                comp_proc = await asyncio.create_subprocess_exec(
                    compiler, code_file, "-o", out_bin,
                    stdout=asyncio.subprocess.PIPE, stderr=asyncio.subprocess.PIPE
                )
                _, c_err = await comp_proc.communicate()
                if comp_proc.returncode != 0:
                    return {"stdout": "", "stderr": c_err.decode("utf-8", errors="replace"), "exit_code": comp_proc.returncode, "timed_out": False, "error": None}
                cmd = [out_bin]
            elif language == "java":
                comp_proc = await asyncio.create_subprocess_exec(
                    "javac", code_file,
                    stdout=asyncio.subprocess.PIPE, stderr=asyncio.subprocess.PIPE
                )
                _, c_err = await comp_proc.communicate()
                if comp_proc.returncode != 0:
                    return {"stdout": "", "stderr": c_err.decode("utf-8", errors="replace"), "exit_code": comp_proc.returncode, "timed_out": False, "error": None}
                cmd = ["java", "-cp", tmp_dir, "Main"]
            else:
                return {"stdout": "", "stderr": "", "exit_code": -1, "timed_out": False, "error": f"Unsupported language: {language}"}

            with open(input_file, "r", encoding="utf-8") as f_in:
                process = await asyncio.create_subprocess_exec(
                    *cmd,
                    stdin=f_in,
                    stdout=asyncio.subprocess.PIPE,
                    stderr=asyncio.subprocess.PIPE,
                )
                stdout, stderr = await asyncio.wait_for(process.communicate(), timeout=timeout)
                return {
                    "stdout": stdout.decode("utf-8", errors="replace"),
                    "stderr": stderr.decode("utf-8", errors="replace"),
                    "exit_code": process.returncode if process.returncode is not None else 0,
                    "timed_out": False,
                    "error": None,
                }
        except asyncio.TimeoutError:
            return {"stdout": "", "stderr": "Execution timed out.", "exit_code": -1, "timed_out": True, "error": None}
        except Exception as exc:
            return {"stdout": "", "stderr": str(exc), "exit_code": -1, "timed_out": False, "error": str(exc)}

    async def execute(
        self, source_code: str, language: str, stdin: str = "", timeout: int = 10
    ) -> dict[str, str | int | bool | None]:
        if language not in self.IMAGES:
            return {"stdout": "", "stderr": "", "exit_code": -1, "timed_out": False, "error": f"Unsupported language: {language}"}

        tmp_dir: str | None = None
        try:
            tmp_dir = await asyncio.to_thread(tempfile.mkdtemp)
            await asyncio.to_thread(self._write_files, tmp_dir, self.FILENAMES[language], source_code, stdin)
            async with self.get_semaphore():
                process = await asyncio.create_subprocess_exec(
                    *self._docker_command(tmp_dir, language),
                    stdout=asyncio.subprocess.PIPE,
                    stderr=asyncio.subprocess.PIPE,
                )
                communication = asyncio.create_task(process.communicate())
                stdout, stderr = await asyncio.wait_for(asyncio.shield(communication), timeout=timeout)
                if process.returncode != 0 and "docker" in stderr.decode("utf-8", errors="replace").lower():
                    return await self._execute_locally(tmp_dir, language, stdin, timeout)
                return {
                    "stdout": stdout.decode("utf-8", errors="replace"),
                    "stderr": stderr.decode("utf-8", errors="replace"),
                    "exit_code": process.returncode if process.returncode is not None else -1,
                    "timed_out": False,
                    "error": None,
                }
        except (FileNotFoundError, NotImplementedError, Exception):
            if tmp_dir is not None:
                return await self._execute_locally(tmp_dir, language, stdin, timeout)
            return {"stdout": "", "stderr": "Local execution failed.", "exit_code": -1, "timed_out": False, "error": "Execution error"}
        finally:
            if tmp_dir is not None:
                await asyncio.to_thread(shutil.rmtree, tmp_dir, ignore_errors=True)
