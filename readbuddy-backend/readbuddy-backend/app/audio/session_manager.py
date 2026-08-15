import asyncio

class SessionManager:
    """
    Manages active reading session locks and prevents concurrent audio streaming sessions.
    """
    def __init__(self):
        self._active = False
        self._lock = asyncio.Lock()

    async def acquire_session(self) -> bool:
        async with self._lock:
            if self._active:
                return False
            self._active = True
            return True

    async def release_session(self) -> None:
        async with self._lock:
            self._active = False

    @property
    def is_active(self) -> bool:
        return self._active

session_manager = SessionManager()
