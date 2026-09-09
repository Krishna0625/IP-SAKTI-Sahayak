from __future__ import annotations

from typing import Generator

from app.core.config import settings


class DatabaseStub:
    def __init__(self) -> None:
        self.url = settings.database_url

    def get_session(self):
        return None


def get_db() -> Generator[None, None, None]:
    """Placeholder database dependency for Stage 2.

    No real database is initialized yet; this keeps the app bootable while the
    persistent storage layer is deferred to a later stage.
    """
    yield None


database = DatabaseStub()
