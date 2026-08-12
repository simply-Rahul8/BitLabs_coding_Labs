import asyncio


def proactor_loop_factory(use_subprocess: bool = False) -> asyncio.AbstractEventLoop:
    return asyncio.ProactorEventLoop()
