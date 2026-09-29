import time
from collections import defaultdict, deque

# In-memory sliding-window limiter. Fine for a single local instance;
# would need a shared store (e.g. Redis) if this ever ran multi-process.
MAX_REQUESTS = 10
WINDOW_SECONDS = 60

_hits: dict[str, deque[float]] = defaultdict(deque)


class RateLimitExceeded(Exception):
    def __init__(self, retry_after: int):
        self.retry_after = retry_after


def check_rate_limit(key: str) -> None:
    now = time.monotonic()
    hits = _hits[key]

    while hits and now - hits[0] > WINDOW_SECONDS:
        hits.popleft()

    if len(hits) >= MAX_REQUESTS:
        retry_after = max(1, int(WINDOW_SECONDS - (now - hits[0])))
        raise RateLimitExceeded(retry_after)

    hits.append(now)
