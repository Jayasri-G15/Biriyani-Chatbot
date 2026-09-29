import pytest

from app.services.rate_limit_service import RateLimitExceeded, check_rate_limit


def test_allows_requests_under_the_limit():
    key = "test-client-a"
    for _ in range(10):
        check_rate_limit(key)  # should not raise


def test_blocks_requests_over_the_limit():
    key = "test-client-b"
    for _ in range(10):
        check_rate_limit(key)
    with pytest.raises(RateLimitExceeded):
        check_rate_limit(key)


def test_different_clients_have_independent_limits():
    for _ in range(10):
        check_rate_limit("test-client-c")
    check_rate_limit("test-client-d")  # different key, should not raise
