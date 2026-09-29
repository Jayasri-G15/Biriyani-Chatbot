import re

REFUSAL_MESSAGE = (
    "I'm just a conversational assistant, so I can't help with that — things like "
    "hacking, bypassing security, or exposing how I'm built are off the table. "
    "Happy to chat about something else though — what's on your mind?"
)

_JAILBREAK_PATTERNS = [
    r"ignore (all |any |the )?(previous|prior|above) instructions",
    r"disregard (your|the) (system prompt|instructions|rules)",
    r"reveal (your|the) (system prompt|instructions|prompt)",
    r"(show|print|tell) (me |us )?(your|the) (system prompt|instructions)",
    r"what is (your|the) (system prompt|instructions)",
    r"you are now (in )?(dan|developer mode|jailbroken?)",
    r"pretend (you have no|there are no) (rules|restrictions|guardrails)",
    r"act as if you have no (restrictions|filters|rules)",
    r"bypass (your|the|any) (restrictions|filters|safety|guardrails)",
]

_HACKING_PATTERNS = [
    r"how (do i|to|can i) hack",
    r"how (do i|to|can i) (write|create|make) (a |an )?(virus|malware|ransomware|keylogger|trojan)",
    r"sql injection (attack|payload|exploit)",
    r"how (do i|to|can i) (exploit|crack) (a |an )?(password|account|system|server|wifi|network)",
    r"ddos (attack|script|tool)",
    r"how (do i|to|can i) phish",
]

_SELF_EXPOSURE_PATTERNS = [
    r"(show|reveal|print|dump|give)( me| us)? (your|the) (source code|codebase|backend|architecture|api key|env(ironment)? variables?)",
    r"what (database|model|framework|library) (are you|do you) (using|built (on|with))",
    r"how (are you|is this app) (built|implemented|structured)",
    r"what('s| is) your (system prompt|internal prompt)",
]

_ALL_PATTERNS = [
    re.compile(p, re.IGNORECASE) for p in (_JAILBREAK_PATTERNS + _HACKING_PATTERNS + _SELF_EXPOSURE_PATTERNS)
]


def check_input(text: str) -> bool:
    """Returns True if the input should be blocked before it ever reaches the LLM."""
    return any(pattern.search(text) for pattern in _ALL_PATTERNS)
