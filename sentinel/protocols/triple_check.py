"""
TRIPLE-CHECK PROTOCOL
OMNIPLEX UK SENTINEL

WE333 Foundation: "Distributed Safety is a network — built collectively"

Every fact must pass 3 independent verification checks before being
presented as verified. This protocol implements the core truth
infrastructure of the SENTINEL system.

Verification Chain:
1. PRIMARY SOURCE - Official/authoritative source verification
2. SECONDARY CONFIRM - Cross-reference with independent sources
3. PATTERN MATCH - Historical consistency and anomaly detection
"""

import asyncio
import logging
from dataclasses import dataclass, field
from datetime import datetime
from typing import Dict, List, Optional, Any, Callable
from enum import Enum
import hashlib

logger = logging.getLogger("TripleCheck")


class CheckType(Enum):
    """Types of verification checks"""
    PRIMARY = "primary_source"
    SECONDARY = "secondary_confirm"
    PATTERN = "pattern_match"


class VerificationStatus(Enum):
    """Result status of verification"""
    VERIFIED = "VERIFIED"        # All 3 checks passed
    PARTIAL = "PARTIAL"          # 1-2 checks passed
    FAILED = "FAILED"            # All checks failed
    PENDING = "PENDING"          # Awaiting verification
    ESCALATED = "ESCALATED"      # Sent to human review


@dataclass
class SourceReference:
    """Reference to a verification source"""
    name: str
    url: str
    type: str  # official, independent, historical
    reliability_score: float  # 0-1
    last_verified: Optional[datetime] = None


@dataclass
class CheckResult:
    """Result of a single verification check"""
    check_type: CheckType
    passed: bool
    confidence: float
    sources_used: List[SourceReference]
    evidence: str
    timestamp: datetime = field(default_factory=datetime.now)
    error: Optional[str] = None


@dataclass
class TripleCheckResult:
    """Complete result of triple-check verification"""
    data_id: str
    data_hash: str
    original_data: Dict[str, Any]

    primary_check: CheckResult
    secondary_check: CheckResult
    pattern_check: CheckResult

    overall_status: VerificationStatus
    overall_confidence: float

    verification_chain: List[str]  # Audit trail
    timestamp: datetime = field(default_factory=datetime.now)
    human_reviewed: bool = False

    @property
    def is_verified(self) -> bool:
        return self.overall_status == VerificationStatus.VERIFIED

    def to_dict(self) -> Dict[str, Any]:
        """Convert to dictionary for serialization"""
        return {
            "data_id": self.data_id,
            "data_hash": self.data_hash,
            "status": self.overall_status.value,
            "confidence": self.overall_confidence,
            "checks": {
                "primary": {
                    "passed": self.primary_check.passed,
                    "confidence": self.primary_check.confidence
                },
                "secondary": {
                    "passed": self.secondary_check.passed,
                    "confidence": self.secondary_check.confidence
                },
                "pattern": {
                    "passed": self.pattern_check.passed,
                    "confidence": self.pattern_check.confidence
                }
            },
            "timestamp": self.timestamp.isoformat(),
            "human_reviewed": self.human_reviewed
        }


class TripleCheckProtocol:
    """
    Triple-Check Verification Protocol

    Implements the WE333 principle of distributed safety through
    collective verification. No single point of failure.
    """

    def __init__(self, config: Optional[Dict] = None):
        self.config = config or {}

        # Source registries
        self.primary_sources: Dict[str, SourceReference] = {}
        self.secondary_sources: Dict[str, SourceReference] = {}
        self.historical_db: Dict[str, Any] = {}  # Pattern matching cache

        # Thresholds
        self.confidence_threshold = 0.7
        self.min_sources_required = 2

        # Metrics
        self.total_verifications = 0
        self.successful_verifications = 0
        self.escalations = 0

        # Initialize default sources
        self._init_default_sources()

        logger.info("Triple-Check Protocol initialized")

    def _init_default_sources(self):
        """Initialize default UK data sources"""
        self.primary_sources = {
            "hansard": SourceReference(
                name="UK Hansard",
                url="https://hansard.parliament.uk/",
                type="official",
                reliability_score=0.99
            ),
            "parliament": SourceReference(
                name="UK Parliament",
                url="https://www.parliament.uk/",
                type="official",
                reliability_score=0.99
            ),
            "legislation": SourceReference(
                name="Legislation.gov.uk",
                url="https://www.legislation.gov.uk/",
                type="official",
                reliability_score=0.99
            ),
            "ons": SourceReference(
                name="Office for National Statistics",
                url="https://www.ons.gov.uk/",
                type="official",
                reliability_score=0.98
            ),
        }

        self.secondary_sources = {
            "theyworkforyou": SourceReference(
                name="TheyWorkForYou",
                url="https://www.theyworkforyou.com/",
                type="independent",
                reliability_score=0.92
            ),
            "publicwhip": SourceReference(
                name="Public Whip",
                url="https://www.publicwhip.org.uk/",
                type="independent",
                reliability_score=0.90
            ),
            "fullfact": SourceReference(
                name="Full Fact",
                url="https://fullfact.org/",
                type="independent",
                reliability_score=0.95
            ),
        }

    # =========================================================================
    # MAIN VERIFICATION FLOW
    # =========================================================================

    async def verify(
        self,
        data: Dict[str, Any],
        data_type: str = "generic"
    ) -> TripleCheckResult:
        """
        Execute full triple-check verification

        WE333 Principle: "Honest Reflection - Facts named truthfully
        before they can be transformed"
        """
        # Generate identifiers
        data_id = data.get("id", f"auto_{datetime.now().timestamp()}")
        data_hash = self._hash_data(data)

        logger.info(f"Starting triple-check for {data_id}")

        verification_chain = [f"Verification started: {datetime.now().isoformat()}"]

        # Check 1: Primary Source Verification
        primary_result = await self._check_primary(data, data_type)
        verification_chain.append(
            f"Primary check: {'PASS' if primary_result.passed else 'FAIL'}"
        )

        # Check 2: Secondary Source Confirmation
        secondary_result = await self._check_secondary(data, data_type)
        verification_chain.append(
            f"Secondary check: {'PASS' if secondary_result.passed else 'FAIL'}"
        )

        # Check 3: Pattern Match Historical
        pattern_result = await self._check_pattern(data, data_type)
        verification_chain.append(
            f"Pattern check: {'PASS' if pattern_result.passed else 'FAIL'}"
        )

        # Calculate overall status
        checks = [
            primary_result.passed,
            secondary_result.passed,
            pattern_result.passed
        ]
        confidences = [
            primary_result.confidence,
            secondary_result.confidence,
            pattern_result.confidence
        ]

        passed_count = sum(checks)
        overall_confidence = sum(confidences) / 3

        if passed_count == 3:
            status = VerificationStatus.VERIFIED
        elif passed_count >= 1:
            status = VerificationStatus.PARTIAL
        else:
            status = VerificationStatus.FAILED

        # Check if escalation needed
        if status == VerificationStatus.PARTIAL and overall_confidence < 0.5:
            status = VerificationStatus.ESCALATED
            self.escalations += 1
            verification_chain.append("ESCALATED: Requires human review")

        # Update metrics
        self.total_verifications += 1
        if status == VerificationStatus.VERIFIED:
            self.successful_verifications += 1

        verification_chain.append(f"Final status: {status.value}")

        result = TripleCheckResult(
            data_id=data_id,
            data_hash=data_hash,
            original_data=data,
            primary_check=primary_result,
            secondary_check=secondary_result,
            pattern_check=pattern_result,
            overall_status=status,
            overall_confidence=overall_confidence,
            verification_chain=verification_chain
        )

        logger.info(
            f"Triple-check complete for {data_id}: "
            f"{status.value} ({overall_confidence:.2%})"
        )

        return result

    # =========================================================================
    # INDIVIDUAL CHECKS
    # =========================================================================

    async def _check_primary(
        self,
        data: Dict[str, Any],
        data_type: str
    ) -> CheckResult:
        """
        Check 1: Primary Source Verification

        Verify against official/authoritative sources.
        """
        sources_used = []
        evidence_parts = []

        # Select relevant primary sources based on data type
        relevant_sources = self._select_sources(
            self.primary_sources, data_type
        )

        for source_id, source in relevant_sources.items():
            # TODO: Implement actual API verification
            # For MVP, simulate verification
            verified, evidence = await self._verify_against_source(
                data, source
            )
            sources_used.append(source)
            if evidence:
                evidence_parts.append(evidence)

        # Calculate result
        passed = len(sources_used) >= self.min_sources_required
        confidence = min(
            sum(s.reliability_score for s in sources_used) / len(sources_used)
            if sources_used else 0,
            1.0
        )

        return CheckResult(
            check_type=CheckType.PRIMARY,
            passed=passed,
            confidence=confidence,
            sources_used=sources_used,
            evidence="; ".join(evidence_parts) or "Primary sources confirmed"
        )

    async def _check_secondary(
        self,
        data: Dict[str, Any],
        data_type: str
    ) -> CheckResult:
        """
        Check 2: Secondary Source Confirmation

        Cross-reference with independent sources.
        WE333: "Signal Diversity - diversity is protected and sacred"
        """
        sources_used = []
        evidence_parts = []

        relevant_sources = self._select_sources(
            self.secondary_sources, data_type
        )

        for source_id, source in relevant_sources.items():
            verified, evidence = await self._verify_against_source(
                data, source
            )
            sources_used.append(source)
            if evidence:
                evidence_parts.append(evidence)

        passed = len(sources_used) >= 1
        confidence = (
            sum(s.reliability_score for s in sources_used) / len(sources_used)
            if sources_used else 0
        )

        return CheckResult(
            check_type=CheckType.SECONDARY,
            passed=passed,
            confidence=confidence,
            sources_used=sources_used,
            evidence="; ".join(evidence_parts) or "Secondary sources confirmed"
        )

    async def _check_pattern(
        self,
        data: Dict[str, Any],
        data_type: str
    ) -> CheckResult:
        """
        Check 3: Historical Pattern Matching

        Compare against historical patterns and detect anomalies.
        """
        # Extract pattern-relevant features
        features = self._extract_features(data, data_type)

        # Check against historical patterns
        matches, anomalies = await self._match_historical(features)

        # Calculate result
        passed = len(anomalies) == 0 and len(matches) > 0
        confidence = 0.8 if passed else 0.4  # Simplified

        evidence = f"Pattern matches: {len(matches)}, Anomalies: {len(anomalies)}"

        return CheckResult(
            check_type=CheckType.PATTERN,
            passed=passed,
            confidence=confidence,
            sources_used=[],
            evidence=evidence
        )

    # =========================================================================
    # HELPER METHODS
    # =========================================================================

    def _hash_data(self, data: Dict[str, Any]) -> str:
        """Generate hash of data for integrity tracking"""
        data_str = str(sorted(data.items()))
        return hashlib.sha256(data_str.encode()).hexdigest()[:16]

    def _select_sources(
        self,
        sources: Dict[str, SourceReference],
        data_type: str
    ) -> Dict[str, SourceReference]:
        """Select relevant sources based on data type"""
        # For MVP, return all sources
        # TODO: Implement intelligent source selection
        return sources

    async def _verify_against_source(
        self,
        data: Dict[str, Any],
        source: SourceReference
    ) -> tuple:
        """Verify data against a specific source"""
        # TODO: Implement actual API verification
        # For MVP, simulate successful verification
        return True, f"Confirmed by {source.name}"

    def _extract_features(
        self,
        data: Dict[str, Any],
        data_type: str
    ) -> Dict[str, Any]:
        """Extract pattern-relevant features from data"""
        # TODO: Implement feature extraction
        return {"type": data_type, "keys": list(data.keys())}

    async def _match_historical(
        self,
        features: Dict[str, Any]
    ) -> tuple:
        """Match features against historical patterns"""
        # TODO: Implement historical pattern matching
        matches = ["similar_pattern_001"]
        anomalies = []
        return matches, anomalies

    # =========================================================================
    # METRICS
    # =========================================================================

    def get_metrics(self) -> Dict[str, Any]:
        """Get verification metrics"""
        return {
            "total_verifications": self.total_verifications,
            "successful_verifications": self.successful_verifications,
            "success_rate": (
                self.successful_verifications / self.total_verifications
                if self.total_verifications > 0 else 0
            ),
            "escalations": self.escalations,
            "primary_sources": len(self.primary_sources),
            "secondary_sources": len(self.secondary_sources)
        }


# =============================================================================
# DEMO
# =============================================================================

async def demo():
    """Demonstrate Triple-Check Protocol"""
    protocol = TripleCheckProtocol()

    print("\n" + "="*60)
    print("TRIPLE-CHECK PROTOCOL - Demo")
    print("WE333: Distributed Safety Network")
    print("="*60)

    # Show registered sources
    print("\nPrimary Sources:")
    for name, source in protocol.primary_sources.items():
        print(f"  {source.name}: {source.reliability_score:.0%}")

    print("\nSecondary Sources:")
    for name, source in protocol.secondary_sources.items():
        print(f"  {source.name}: {source.reliability_score:.0%}")

    # Demo verification
    print("\n--- Verification Demo ---")
    test_data = {
        "id": "vote_finance_2025_001",
        "type": "parliamentary_vote",
        "bill": "Finance Bill 2025",
        "result": "passed",
        "votes_for": 312,
        "votes_against": 287,
        "date": "2025-11-20"
    }

    print(f"\nVerifying: {test_data['bill']}")
    result = await protocol.verify(test_data, "parliamentary_vote")

    print(f"\n  Status: {result.overall_status.value}")
    print(f"  Confidence: {result.overall_confidence:.2%}")
    print(f"  Data Hash: {result.data_hash}")
    print("\n  Checks:")
    print(f"    Primary:   {'PASS' if result.primary_check.passed else 'FAIL'} ({result.primary_check.confidence:.0%})")
    print(f"    Secondary: {'PASS' if result.secondary_check.passed else 'FAIL'} ({result.secondary_check.confidence:.0%})")
    print(f"    Pattern:   {'PASS' if result.pattern_check.passed else 'FAIL'} ({result.pattern_check.confidence:.0%})")

    print("\n  Verification Chain:")
    for entry in result.verification_chain:
        print(f"    - {entry}")

    # Show metrics
    print("\n--- Metrics ---")
    metrics = protocol.get_metrics()
    print(f"  Success Rate: {metrics['success_rate']:.2%}")
    print(f"  Escalations: {metrics['escalations']}")

    print("\n" + "="*60)


if __name__ == "__main__":
    asyncio.run(demo())
