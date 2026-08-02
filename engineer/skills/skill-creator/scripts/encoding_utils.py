"""Small UTF-8 helpers shared by the skill-creator scripts."""

from __future__ import annotations

import io
import sys
from pathlib import Path
from typing import Union


PathLike = Union[str, Path]


def configure_utf8_console() -> None:
    """Make standard streams emit UTF-8 when the runtime supports reconfiguration."""
    for stream in (sys.stdin, sys.stdout, sys.stderr):
        reconfigure = getattr(stream, "reconfigure", None)
        if reconfigure is not None:
            reconfigure(encoding="utf-8", errors="replace")
        elif isinstance(stream, io.TextIOBase) and stream.buffer is not None:
            # Covers older Python runtimes without TextIOWrapper.reconfigure.
            stream = io.TextIOWrapper(stream.buffer, encoding="utf-8", errors="replace")


def read_text_utf8(path: PathLike) -> str:
    """Read a text file using UTF-8 with a deterministic newline policy."""
    return Path(path).read_text(encoding="utf-8")


def write_text_utf8(path: PathLike, content: str) -> None:
    """Write text as UTF-8, creating the parent directory when needed."""
    target = Path(path)
    target.parent.mkdir(parents=True, exist_ok=True)
    target.write_text(content, encoding="utf-8", newline="")
