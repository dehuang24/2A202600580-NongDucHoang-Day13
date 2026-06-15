from __future__ import annotations

import os
from typing import Any


def _ensure_langfuse_host() -> None:
    if not os.getenv("LANGFUSE_HOST") and os.getenv("LANGFUSE_BASE_URL"):
        os.environ["LANGFUSE_HOST"] = os.environ["LANGFUSE_BASE_URL"]


try:
    _ensure_langfuse_host()
    from langfuse import get_client, observe

    class _LangfuseContext:
        def update_current_trace(self, **kwargs: Any) -> None:
            get_client().update_current_trace(**kwargs)

        def update_current_observation(self, **kwargs: Any) -> None:
            get_client().update_current_generation(**kwargs)

        def update_current_span(self, **kwargs: Any) -> None:
            get_client().update_current_span(**kwargs)

        def update_current_generation(self, **kwargs: Any) -> None:
            get_client().update_current_generation(**kwargs)

    langfuse_context = _LangfuseContext()
except Exception:  # pragma: no cover
    def observe(*args: Any, **kwargs: Any):
        def decorator(func):
            return func
        return decorator

    class _DummyContext:
        def update_current_trace(self, **kwargs: Any) -> None:
            return None

        def update_current_observation(self, **kwargs: Any) -> None:
            return None

        def update_current_span(self, **kwargs: Any) -> None:
            return None

        def update_current_generation(self, **kwargs: Any) -> None:
            return None

    langfuse_context = _DummyContext()


def tracing_enabled() -> bool:
    return bool(os.getenv("LANGFUSE_PUBLIC_KEY") and os.getenv("LANGFUSE_SECRET_KEY"))


def flush_traces() -> None:
    if not tracing_enabled():
        return
    _ensure_langfuse_host()
    try:
        get_client().flush()
    except Exception:
        return None
