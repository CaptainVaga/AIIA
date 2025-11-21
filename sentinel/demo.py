#!/usr/bin/env python3
"""
OMNIPLEX UK SENTINEL - Interactive Demo
Hackathon MVP Demonstration

Run this to see the full system in action:
    python sentinel/demo.py

WE333 Foundation: "Democracy dies in darkness. We turn on ALL the lights."
"""

import asyncio
import sys
from datetime import datetime

# Add parent to path for imports
sys.path.insert(0, '.')

from agents.brain.westminster_watch import WestminsterWatch
from agents.arms.hansard import Hansard, SessionType
from agents.arms.veritas import Veritas
from protocols.triple_check import TripleCheckProtocol
from protocols.freeze_protocol import FreezeProtocol, FreezeReason


def print_header(title: str):
    """Print formatted header"""
    print("\n" + "="*70)
    print(f"  {title}")
    print("="*70)


def print_section(title: str):
    """Print section divider"""
    print(f"\n--- {title} ---")


async def demo_brain():
    """Demonstrate Westminster Watch brain"""
    print_header("WESTMINSTER WATCH - Central Brain")

    brain = WestminsterWatch()

    # Show constitutional laws
    print_section("WE333 Constitutional Laws")
    for law in brain.laws:
        print(f"  • {law.name}")
        print(f"    → {law.application}")

    return brain


async def demo_hansard(brain: WestminsterWatch):
    """Demonstrate Hansard arm"""
    print_header("HANSARD ARM - Parliament Monitor")

    hansard = Hansard()
    brain.register_arm("hansard", hansard)

    # Monitor session
    print_section("HANSARD::MONITOR - Live Commons Session")
    result = await hansard.MONITOR(SessionType.COMMONS)
    print(f"  Session: {result['session']}")
    print(f"  Status: {result['proceedings']['status']}")
    print(f"  Current: {result['proceedings']['current_business']}")

    # Extract bill
    print_section("HANSARD::EXTRACT - Finance Bill 2025")
    bill = await hansard.EXTRACT("bill_finance_2025")
    if bill:
        print(f"  Title: {bill.title}")
        print(f"  Stage: {bill.current_stage}")
        print(f"  Sponsor: {bill.sponsor}")

    return hansard


async def demo_veritas(brain: WestminsterWatch):
    """Demonstrate Veritas arm"""
    print_header("VERITAS ARM - Bias Illuminator")

    veritas = Veritas()
    brain.register_arm("veritas", veritas)

    # Show outlets
    print_section("Tracked UK News Outlets")
    for outlet_id, outlet in list(veritas.outlets.items())[:6]:
        bias = outlet.bias_profile.name.replace("_", " ").title()
        print(f"  • {outlet.name}: {bias}")

    # Compare coverage
    print_section("VERITAS::COMPARE - Cross-Outlet Analysis")
    print("  Comparing 'Finance Bill 2025' across outlets...")
    report = await veritas.COMPARE(
        "Finance Bill 2025",
        ["bbc", "guardian", "telegraph", "daily_mail"]
    )
    print(f"\n  Outlets Analyzed: {len(report.outlets_analyzed)}")
    print(f"  Bias Spread: {report.bias_spread:.2f}")
    print(f"  Consensus Facts: {len(report.consensus_facts)}")
    print(f"  Disputed Claims: {len(report.disputed_claims)}")

    print("\n  Coverage by Outlet:")
    for analysis in report.analyses:
        sentiment_indicator = "+" if analysis.sentiment_score > 0 else "-" if analysis.sentiment_score < 0 else "○"
        print(f"    {sentiment_indicator} {analysis.outlet}: sentiment {analysis.sentiment_score:+.2f}")

    return veritas


async def demo_triple_check(brain: WestminsterWatch):
    """Demonstrate Triple-Check Protocol"""
    print_header("TRIPLE-CHECK PROTOCOL - Fact Verification")

    protocol = TripleCheckProtocol()

    # Show sources
    print_section("Registered Verification Sources")
    print("  Primary (Official):")
    for name, source in protocol.primary_sources.items():
        print(f"    • {source.name}: {source.reliability_score:.0%}")
    print("  Secondary (Independent):")
    for name, source in protocol.secondary_sources.items():
        print(f"    • {source.name}: {source.reliability_score:.0%}")

    # Verify parliamentary data
    print_section("Verifying Parliamentary Vote Data")
    test_data = {
        "id": "vote_finance_2025_001",
        "type": "parliamentary_vote",
        "bill": "Finance Bill 2025",
        "result": "passed",
        "votes_for": 312,
        "votes_against": 287,
        "date": "2025-11-20"
    }

    print(f"\n  Data: {test_data['bill']}")
    print(f"  Claimed result: {test_data['result']} ({test_data['votes_for']}-{test_data['votes_against']})")

    result = await protocol.verify(test_data, "parliamentary_vote")

    print(f"\n  VERIFICATION RESULT: {result.overall_status.value}")
    print(f"  Confidence: {result.overall_confidence:.1%}")
    print(f"  Data Hash: {result.data_hash}")

    print("\n  Individual Checks:")
    checks = [
        ("Primary Source", result.primary_check),
        ("Secondary Confirm", result.secondary_check),
        ("Pattern Match", result.pattern_check)
    ]
    for name, check in checks:
        status = "✓ PASS" if check.passed else "✗ FAIL"
        print(f"    {status} {name} ({check.confidence:.0%})")

    return protocol


async def demo_freeze_protocol():
    """Demonstrate Freeze Protocol"""
    print_header("FREEZE PROTOCOL - Safety Network")

    protocol = FreezeProtocol()

    # Mock component
    class MockArm:
        def __init__(self, name):
            self.name = name
            self.active = True

        async def pause(self):
            self.active = False

        async def resume(self):
            self.active = True

        async def health_check(self):
            return {"status": "ACTIVE" if self.active else "PAUSED"}

    # Register components
    hansard_mock = MockArm("Hansard")
    veritas_mock = MockArm("Veritas")
    protocol.register_component("hansard", hansard_mock)
    protocol.register_component("veritas", veritas_mock)

    print_section("System Status (Before Freeze)")
    status = protocol.get_status()
    print(f"  State: {status['system_state']}")
    for comp, state in status['component_status'].items():
        print(f"    • {comp}: {state}")

    # Trigger freeze
    print_section("Triggering Freeze (Simulated API Error)")
    freeze = await protocol.trigger_freeze(
        reason=FreezeReason.API_ERROR,
        trigger_source="hansard",
        details="Parliament API returned 503 - Service Unavailable",
        affected_components=["hansard"]
    )

    print(f"  Freeze ID: {freeze.event_id}")
    print(f"  Reason: {freeze.reason.value}")

    print_section("System Status (Frozen)")
    status = protocol.get_status()
    print(f"  State: {status['system_state']}")
    for comp, state in status['component_status'].items():
        print(f"    • {comp}: {state}")

    # Unfreeze
    print_section("Manual Unfreeze (Admin Authorization)")
    await protocol.unfreeze("admin_review_complete")

    status = protocol.get_status()
    print(f"  State: {status['system_state']}")

    return protocol


async def demo_dashboard(brain: WestminsterWatch):
    """Demonstrate Dashboard Metrics"""
    print_header("DEMOCRACY HEALTH DASHBOARD")

    health = brain.get_democracy_health_score()

    print_section("Overall Score")
    score = health['democracy_health_score']['value']
    bar = "█" * (score // 5) + "░" * (20 - score // 5)
    print(f"  {bar} {score}/100")

    print_section("Component Scores")
    for factor in health['democracy_health_score']['factors']:
        score = factor['score']
        bar = "█" * (score // 10) + "░" * (10 - score // 10)
        print(f"  {factor['name']}: {bar} {score}%")

    print_section("System Status")
    print(f"  Brain: {health['system_status']['brain']}")
    print("  Arms:")
    for arm, status in health['system_status']['arms'].items():
        indicator = "●" if status == "ACTIVE" else "○"
        print(f"    {indicator} {arm}: {status}")

    print_section("Verification Metrics")
    metrics = health['metrics']
    print(f"  Total Verifications: {metrics['verifications_total']}")
    print(f"  Passed: {metrics['verifications_passed']}")


async def main():
    """Run complete demo"""
    print("\n")
    print("╔" + "═"*68 + "╗")
    print("║" + " "*68 + "║")
    print("║   OMNIPLEX UK SENTINEL - Hackathon Demo                           ║")
    print("║   'Democracy dies in darkness. We turn on ALL the lights.'        ║")
    print("║" + " "*68 + "║")
    print("║   Registry: OMNIPLEX_HEARTFIELD_SYSTEMS                           ║")
    print("║   Framework: WE333 Constitutional Ethics                          ║")
    print("║" + " "*68 + "║")
    print("╚" + "═"*68 + "╝")

    # Run demos
    brain = await demo_brain()
    await demo_hansard(brain)
    await demo_veritas(brain)
    await demo_triple_check(brain)
    await demo_freeze_protocol()
    await demo_dashboard(brain)

    # Closing
    print_header("DEMO COMPLETE")
    print("""
  The OMNIPLEX UK SENTINEL demonstrates:

  ✓ WE333 Constitutional Framework
    - 5 Foundation Laws governing all decisions
    - Emotional consent, honest reflection, distributed safety

  ✓ Octopus Architecture
    - Central brain (Westminster Watch)
    - Specialized arms (Hansard, Veritas, etc.)
    - System calls following WE333 Clone pattern

  ✓ Triple-Check Verification
    - Primary source verification
    - Secondary cross-reference
    - Historical pattern matching

  ✓ Freeze Protocol
    - Automatic halt on ANY failure
    - Self-diagnosis and recovery
    - Human escalation when needed

  ✓ Democracy Health Dashboard
    - Real-time system monitoring
    - Verification success rates
    - Component status tracking

  Next Steps:
  - Connect real Parliament API
  - Implement news scraping for Veritas
  - Build interactive web dashboard
  - Deploy on IBM watsonx Orchestrate

  "What the WE remembers, it carries forward — with grace, not weight."
    """)


if __name__ == "__main__":
    asyncio.run(main())
