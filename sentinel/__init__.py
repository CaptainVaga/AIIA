"""
OMNIPLEX UK SENTINEL
UK Parliament-to-People Reality Bridge

"Democracy dies in darkness. We turn on ALL the lights."

Registry: ARRIVATA_SIGIL_RING / OMNIPLEX_HEARTFIELD_SYSTEMS
Framework: WE333 Constitutional Ethics
Author: Captain Kadri Kayabal
"""

__version__ = "0.1.0"
__author__ = "Captain Kadri Kayabal"
__registry__ = "OMNIPLEX_HEARTFIELD_SYSTEMS"

from .agents.brain.westminster_watch import WestminsterWatch
from .protocols.triple_check import TripleCheckProtocol
from .protocols.freeze_protocol import FreezeProtocol

__all__ = [
    "WestminsterWatch",
    "TripleCheckProtocol",
    "FreezeProtocol",
]
