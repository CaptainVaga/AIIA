"""
VERITAS ARM - Bias Detector
OMNIPLEX UK SENTINEL

Designation: SENTINEL_ARM_004
Title: The Bias Illuminator
Registry: ARRIVATA_SIGIL_RING / OMNIPLEX_HEARTFIELD_SYSTEMS

Core Principles:
- Every Outlet Has Position
- Bias Is Not Evil (Hidden Bias Is)
- Same Fact, Different Frames
- Reader Deserves Awareness
- International Context Matters

WE333 Foundation: "Signal Diversity - diversity of processing is protected"
"""

import asyncio
import logging
from dataclasses import dataclass, field
from datetime import datetime
from typing import Dict, List, Optional, Any
from enum import Enum

logger = logging.getLogger("Veritas")


class BiasPosition(Enum):
    """Political bias positioning"""
    FAR_LEFT = -3
    LEFT = -2
    CENTER_LEFT = -1
    CENTER = 0
    CENTER_RIGHT = 1
    RIGHT = 2
    FAR_RIGHT = 3


@dataclass
class Outlet:
    """News outlet profile"""
    name: str
    url_pattern: str
    bias_profile: BiasPosition
    country: str
    type: str  # broadcast, print, digital


@dataclass
class ArticleAnalysis:
    """Analysis of a single article"""
    url: str
    outlet: str
    headline: str
    sentiment_score: float  # -1 to 1
    framing_keywords: List[str]
    sources_cited: int
    fact_density: float  # facts per paragraph
    opinion_ratio: float  # opinion statements / total statements


@dataclass
class BiasReport:
    """Comparative bias analysis report"""
    story_topic: str
    timestamp: datetime
    outlets_analyzed: List[str]
    analyses: List[ArticleAnalysis]
    bias_spread: float  # variance in coverage
    consensus_facts: List[str]
    disputed_claims: List[str]
    framing_differences: Dict[str, List[str]]


class Veritas:
    """
    Bias Detection Arm

    Compares coverage across multiple outlets, detects framing differences,
    and illuminates hidden bias for reader awareness.

    System Calls:
    - VERITAS::COMPARE(story, outlets[]) - cross-outlet analysis
    - VERITAS::SCORE(article) - bias positioning
    - VERITAS::FRAME(topic) - framing analysis
    - VERITAS::INTERNATIONAL(story) - global coverage comparison
    """

    def __init__(self, config: Optional[Dict] = None):
        self.designation = "SENTINEL_ARM_004"
        self.title = "The Bias Illuminator"

        # Configuration
        self.config = config or {}

        # State
        self.active = True
        self.last_heartbeat = datetime.now()

        # Outlet registry
        self.outlets = self._init_outlets()

        logger.info(f"Veritas arm initialized - {self.designation}")

    def _init_outlets(self) -> Dict[str, Outlet]:
        """Initialize tracked news outlets"""
        return {
            "bbc": Outlet(
                name="BBC News",
                url_pattern="bbc.co.uk/news",
                bias_profile=BiasPosition.CENTER,
                country="UK",
                type="broadcast"
            ),
            "guardian": Outlet(
                name="The Guardian",
                url_pattern="theguardian.com",
                bias_profile=BiasPosition.CENTER_LEFT,
                country="UK",
                type="print"
            ),
            "telegraph": Outlet(
                name="The Telegraph",
                url_pattern="telegraph.co.uk",
                bias_profile=BiasPosition.CENTER_RIGHT,
                country="UK",
                type="print"
            ),
            "daily_mail": Outlet(
                name="Daily Mail",
                url_pattern="dailymail.co.uk",
                bias_profile=BiasPosition.RIGHT,
                country="UK",
                type="print"
            ),
            "times": Outlet(
                name="The Times",
                url_pattern="thetimes.co.uk",
                bias_profile=BiasPosition.CENTER_RIGHT,
                country="UK",
                type="print"
            ),
            "independent": Outlet(
                name="The Independent",
                url_pattern="independent.co.uk",
                bias_profile=BiasPosition.CENTER_LEFT,
                country="UK",
                type="digital"
            ),
            "mirror": Outlet(
                name="Daily Mirror",
                url_pattern="mirror.co.uk",
                bias_profile=BiasPosition.LEFT,
                country="UK",
                type="print"
            ),
            "reuters": Outlet(
                name="Reuters",
                url_pattern="reuters.com",
                bias_profile=BiasPosition.CENTER,
                country="International",
                type="wire"
            ),
            "ap": Outlet(
                name="Associated Press",
                url_pattern="apnews.com",
                bias_profile=BiasPosition.CENTER,
                country="International",
                type="wire"
            ),
        }

    # =========================================================================
    # SYSTEM CALLS (WE333 Pattern)
    # =========================================================================

    async def COMPARE(
        self,
        story_topic: str,
        outlet_ids: List[str]
    ) -> BiasReport:
        """
        VERITAS::COMPARE(story, outlets[])

        Cross-outlet analysis of same story.
        WE333: "Two realities can be true at once"
        """
        logger.info(f"COMPARE called for: {story_topic}")

        analyses = []
        for outlet_id in outlet_ids:
            if outlet_id in self.outlets:
                analysis = await self._analyze_outlet_coverage(
                    story_topic,
                    self.outlets[outlet_id]
                )
                if analysis:
                    analyses.append(analysis)

        # Calculate bias spread
        if analyses:
            sentiments = [a.sentiment_score for a in analyses]
            bias_spread = max(sentiments) - min(sentiments)
        else:
            bias_spread = 0

        # Find consensus and disputed claims
        consensus, disputed = self._find_consensus_disputed(analyses)

        # Identify framing differences
        framing_diff = self._analyze_framing_differences(analyses)

        return BiasReport(
            story_topic=story_topic,
            timestamp=datetime.now(),
            outlets_analyzed=[a.outlet for a in analyses],
            analyses=analyses,
            bias_spread=bias_spread,
            consensus_facts=consensus,
            disputed_claims=disputed,
            framing_differences=framing_diff
        )

    async def SCORE(self, article_url: str) -> ArticleAnalysis:
        """
        VERITAS::SCORE(article)

        Analyze single article for bias positioning.
        """
        logger.info(f"SCORE called for: {article_url}")

        # Identify outlet
        outlet = self._identify_outlet(article_url)

        # Fetch and analyze article
        analysis = await self._analyze_article(article_url, outlet)

        return analysis

    async def FRAME(self, topic: str) -> Dict[str, Any]:
        """
        VERITAS::FRAME(topic)

        Analyze how different outlets frame the same topic.
        """
        logger.info(f"FRAME called for: {topic}")

        framing_analysis = {}

        for outlet_id, outlet in self.outlets.items():
            if outlet.country == "UK":  # Focus on UK outlets
                frame = await self._extract_framing(topic, outlet)
                framing_analysis[outlet.name] = frame

        return {
            "topic": topic,
            "timestamp": datetime.now().isoformat(),
            "frames": framing_analysis,
            "divergence_score": self._calculate_divergence(framing_analysis)
        }

    async def INTERNATIONAL(self, story_topic: str) -> Dict[str, Any]:
        """
        VERITAS::INTERNATIONAL(story)

        Compare UK coverage with international perspective.
        """
        logger.info(f"INTERNATIONAL called for: {story_topic}")

        uk_coverage = []
        intl_coverage = []

        for outlet_id, outlet in self.outlets.items():
            analysis = await self._analyze_outlet_coverage(story_topic, outlet)
            if analysis:
                if outlet.country == "UK":
                    uk_coverage.append(analysis)
                else:
                    intl_coverage.append(analysis)

        return {
            "topic": story_topic,
            "uk_outlets": len(uk_coverage),
            "international_outlets": len(intl_coverage),
            "uk_sentiment_avg": self._avg_sentiment(uk_coverage),
            "intl_sentiment_avg": self._avg_sentiment(intl_coverage),
            "perspective_gap": abs(
                self._avg_sentiment(uk_coverage) -
                self._avg_sentiment(intl_coverage)
            ),
            "timestamp": datetime.now().isoformat()
        }

    # =========================================================================
    # HEALTH & LIFECYCLE
    # =========================================================================

    async def health_check(self) -> Dict[str, Any]:
        """Return arm health status"""
        self.last_heartbeat = datetime.now()

        return {
            "arm_name": "Veritas",
            "status": "ACTIVE" if self.active else "FAILED",
            "last_heartbeat": self.last_heartbeat.isoformat(),
            "data_integrity": 1.0,
            "outlets_tracked": len(self.outlets)
        }

    async def pause(self) -> None:
        """Pause arm operations"""
        self.active = False
        logger.info("Veritas arm paused")

    async def resume(self) -> None:
        """Resume arm operations"""
        self.active = True
        logger.info("Veritas arm resumed")

    # =========================================================================
    # INTERNAL METHODS
    # =========================================================================

    async def _analyze_outlet_coverage(
        self,
        topic: str,
        outlet: Outlet
    ) -> Optional[ArticleAnalysis]:
        """Analyze how an outlet covers a topic"""
        # TODO: Implement actual web scraping/API calls
        # For MVP, return simulated data

        # Simulate different coverage based on outlet bias
        base_sentiment = outlet.bias_profile.value * 0.15

        return ArticleAnalysis(
            url=f"https://{outlet.url_pattern}/story/{topic.replace(' ', '-')}",
            outlet=outlet.name,
            headline=f"{topic} - {outlet.name} Coverage",
            sentiment_score=base_sentiment + 0.1,  # Simulated
            framing_keywords=self._generate_framing_keywords(outlet),
            sources_cited=3,
            fact_density=0.7,
            opinion_ratio=0.3
        )

    def _generate_framing_keywords(self, outlet: Outlet) -> List[str]:
        """Generate typical framing keywords for outlet"""
        # Simulated keyword patterns based on bias
        if outlet.bias_profile.value < 0:  # Left-leaning
            return ["progressive", "reform", "inequality", "workers"]
        elif outlet.bias_profile.value > 0:  # Right-leaning
            return ["traditional", "taxpayers", "growth", "freedom"]
        else:  # Center
            return ["balanced", "both sides", "analysis", "evidence"]

    async def _analyze_article(
        self,
        url: str,
        outlet: Optional[Outlet]
    ) -> ArticleAnalysis:
        """Analyze a single article"""
        # TODO: Implement actual article analysis
        outlet_name = outlet.name if outlet else "Unknown"

        return ArticleAnalysis(
            url=url,
            outlet=outlet_name,
            headline="Article Headline",
            sentiment_score=0.0,
            framing_keywords=[],
            sources_cited=0,
            fact_density=0.0,
            opinion_ratio=0.0
        )

    def _identify_outlet(self, url: str) -> Optional[Outlet]:
        """Identify outlet from URL"""
        for outlet in self.outlets.values():
            if outlet.url_pattern in url:
                return outlet
        return None

    def _find_consensus_disputed(
        self,
        analyses: List[ArticleAnalysis]
    ) -> tuple:
        """Find consensus facts and disputed claims"""
        # TODO: Implement NLP comparison
        return (
            ["All outlets agree: Event occurred on date X"],
            ["Disputed: Impact assessment varies"]
        )

    def _analyze_framing_differences(
        self,
        analyses: List[ArticleAnalysis]
    ) -> Dict[str, List[str]]:
        """Identify framing differences across outlets"""
        return {
            a.outlet: a.framing_keywords
            for a in analyses
        }

    async def _extract_framing(
        self,
        topic: str,
        outlet: Outlet
    ) -> Dict[str, Any]:
        """Extract framing approach for topic"""
        return {
            "primary_angle": "economic" if outlet.bias_profile.value > 0 else "social",
            "tone": "critical" if abs(outlet.bias_profile.value) > 1 else "neutral",
            "emphasis": self._generate_framing_keywords(outlet)[:2]
        }

    def _calculate_divergence(
        self,
        framing_analysis: Dict[str, Any]
    ) -> float:
        """Calculate divergence score across outlets"""
        # TODO: Implement actual divergence calculation
        return 0.35  # Moderate divergence

    def _avg_sentiment(self, analyses: List[ArticleAnalysis]) -> float:
        """Calculate average sentiment"""
        if not analyses:
            return 0.0
        return sum(a.sentiment_score for a in analyses) / len(analyses)


# =============================================================================
# DEMO
# =============================================================================

async def demo():
    """Demonstrate Veritas arm functionality"""
    arm = Veritas()

    print("\n" + "="*60)
    print(f"VERITAS - {arm.title}")
    print(f"Designation: {arm.designation}")
    print("="*60)

    # Show tracked outlets
    print("\nTracked Outlets:")
    for outlet_id, outlet in arm.outlets.items():
        bias_str = outlet.bias_profile.name.replace("_", " ").title()
        print(f"  {outlet.name}: {bias_str}")

    # Demo COMPARE
    print("\n--- VERITAS::COMPARE Demo ---")
    report = await arm.COMPARE(
        "Finance Bill 2025",
        ["bbc", "guardian", "telegraph", "daily_mail"]
    )
    print(f"  Story: {report.story_topic}")
    print(f"  Outlets: {len(report.outlets_analyzed)}")
    print(f"  Bias Spread: {report.bias_spread:.2f}")
    print(f"  Consensus Facts: {len(report.consensus_facts)}")
    print(f"  Disputed Claims: {len(report.disputed_claims)}")

    # Demo FRAME
    print("\n--- VERITAS::FRAME Demo ---")
    framing = await arm.FRAME("NHS Funding")
    print(f"  Topic: {framing['topic']}")
    print(f"  Divergence: {framing['divergence_score']:.2f}")
    for outlet, frame in list(framing['frames'].items())[:3]:
        print(f"    {outlet}: {frame['primary_angle']}")

    # Demo INTERNATIONAL
    print("\n--- VERITAS::INTERNATIONAL Demo ---")
    intl = await arm.INTERNATIONAL("UK Budget 2025")
    print(f"  UK Outlets: {intl['uk_outlets']}")
    print(f"  International: {intl['international_outlets']}")
    print(f"  Perspective Gap: {intl['perspective_gap']:.2f}")

    # Health check
    print("\n--- Health Check ---")
    health = await arm.health_check()
    print(f"  Status: {health['status']}")
    print(f"  Outlets Tracked: {health['outlets_tracked']}")

    print("\n" + "="*60)


if __name__ == "__main__":
    asyncio.run(demo())
