"""Expose focused unit-test modules to Django's default test discovery."""

from .test_suite.test_risk_calculator import *  # noqa: F401,F403
from .test_suite.test_checkpoints import *  # noqa: F401,F403
from .test_suite.test_recommendation import *  # noqa: F401,F403
from .test_suite.test_routing_provider import *  # noqa: F401,F403
