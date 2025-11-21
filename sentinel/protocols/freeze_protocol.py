"""
FREEZE PROTOCOL
OMNIPLEX UK SENTINEL

WE333 Foundation: "Safety is not a boundary. It's a network."

If ANY component fails, the entire system halts to protect truth integrity.
This ensures no corrupted or unverified information is propagated.

The freeze is not punishment — it is protection.
"""

import asyncio
import logging
from dataclasses import dataclass, field
from datetime import datetime
from typing import Dict, List, Optional, Any, Callable
from enum import Enum

logger = logging.getLogger("FreezeProtocol")


class SystemState(Enum):
    """Overall system state"""
    ACTIVE = "ACTIVE"
    FROZEN = "FROZEN"
    RECOVERING = "RECOVERING"
    MAINTENANCE = "MAINTENANCE"


class FreezeReason(Enum):
    """Categories of freeze triggers"""
    ARM_FAILURE = "arm_failure"
    VERIFICATION_FAILURE = "verification_failure"
    DATA_INTEGRITY = "data_integrity"
    API_ERROR = "api_error"
    ANOMALY_DETECTED = "anomaly_detected"
    HUMAN_TRIGGERED = "human_triggered"
    SECURITY_CONCERN = "security_concern"


class RecoveryAction(Enum):
    """Types of recovery actions"""
    RESTART_ARM = "restart_arm"
    CLEAR_CACHE = "clear_cache"
    ROLLBACK_DATA = "rollback_data"
    HUMAN_REVIEW = "human_review"
    FULL_DIAGNOSTIC = "full_diagnostic"


@dataclass
class FreezeEvent:
    """Record of a freeze event"""
    event_id: str
    timestamp: datetime
    reason: FreezeReason
    trigger_source: str
    details: str
    affected_components: List[str]
    resolved: bool = False
    resolution_time: Optional[datetime] = None
    resolution_action: Optional[str] = None


@dataclass
class DiagnosticReport:
    """System diagnostic report"""
    timestamp: datetime
    system_state: SystemState
    freeze_event: Optional[FreezeEvent]

    component_status: Dict[str, str]
    data_integrity_score: float
    recent_verifications: int
    verification_success_rate: float

    recommended_actions: List[RecoveryAction]
    estimated_recovery_time: str
    human_intervention_required: bool


class FreezeProtocol:
    """
    Freeze Protocol Implementation

    Implements the WE333 principle that safety is a collective network.
    One failure affects all — because truth cannot be partial.
    """

    def __init__(self, brain_callback: Optional[Callable] = None):
        """
        Initialize Freeze Protocol

        Args:
            brain_callback: Callback to notify brain orchestrator
        """
        self.brain_callback = brain_callback

        # State
        self.state = SystemState.ACTIVE
        self.current_freeze: Optional[FreezeEvent] = None

        # Component registry
        self.components: Dict[str, Any] = {}
        self.component_status: Dict[str, str] = {}

        # History
        self.freeze_history: List[FreezeEvent] = []

        # Configuration
        self.auto_recovery_enabled = True
        self.max_auto_recovery_attempts = 3
        self.recovery_attempts = 0

        logger.info("Freeze Protocol initialized")

    # =========================================================================
    # REGISTRATION
    # =========================================================================

    def register_component(self, name: str, component: Any) -> None:
        """Register a component for monitoring"""
        self.components[name] = component
        self.component_status[name] = "ACTIVE"
        logger.info(f"Registered component: {name}")

    def unregister_component(self, name: str) -> None:
        """Unregister a component"""
        if name in self.components:
            del self.components[name]
            del self.component_status[name]
            logger.info(f"Unregistered component: {name}")

    # =========================================================================
    # FREEZE OPERATIONS
    # =========================================================================

    async def trigger_freeze(
        self,
        reason: FreezeReason,
        trigger_source: str,
        details: str,
        affected_components: Optional[List[str]] = None
    ) -> FreezeEvent:
        """
        Trigger system freeze

        WE333 Principle: "If ANY arm fails → System halts"
        """
        if self.state == SystemState.FROZEN:
            logger.warning("System already frozen")
            return self.current_freeze

        event_id = f"freeze_{datetime.now().strftime('%Y%m%d_%H%M%S')}"
        affected = affected_components or list(self.components.keys())

        freeze_event = FreezeEvent(
            event_id=event_id,
            timestamp=datetime.now(),
            reason=reason,
            trigger_source=trigger_source,
            details=details,
            affected_components=affected
        )

        logger.warning(
            f"FREEZE TRIGGERED: {reason.value} by {trigger_source}"
        )
        logger.warning(f"Details: {details}")
        logger.warning(f"Affected: {affected}")

        # Update state
        self.state = SystemState.FROZEN
        self.current_freeze = freeze_event
        self.freeze_history.append(freeze_event)

        # Halt all components
        await self._halt_components()

        # Notify brain if callback registered
        if self.brain_callback:
            await self.brain_callback("freeze", freeze_event)

        # Run diagnostics
        diagnostics = await self.run_diagnostics()

        # Attempt auto-recovery if enabled
        if self.auto_recovery_enabled:
            await self._attempt_auto_recovery(diagnostics)

        return freeze_event

    async def _halt_components(self) -> None:
        """Halt all registered components"""
        for name, component in self.components.items():
            try:
                if hasattr(component, 'pause'):
                    await component.pause()
                self.component_status[name] = "PAUSED"
                logger.info(f"Halted component: {name}")
            except Exception as e:
                logger.error(f"Error halting {name}: {e}")
                self.component_status[name] = "ERROR"

    # =========================================================================
    # DIAGNOSTICS
    # =========================================================================

    async def run_diagnostics(self) -> DiagnosticReport:
        """
        Run full system diagnostics

        WE333: "Self-diagnose before resume"
        """
        logger.info("Running system diagnostics...")

        # Check each component
        for name, component in self.components.items():
            try:
                if hasattr(component, 'health_check'):
                    health = await component.health_check()
                    self.component_status[name] = health.get('status', 'UNKNOWN')
                else:
                    self.component_status[name] = 'NO_HEALTH_CHECK'
            except Exception as e:
                self.component_status[name] = f'ERROR: {e}'

        # Calculate data integrity
        integrity_score = self._calculate_integrity_score()

        # Determine recommended actions
        actions = self._determine_recovery_actions()

        # Check if human needed
        human_needed = (
            self.recovery_attempts >= self.max_auto_recovery_attempts or
            self.current_freeze and
            self.current_freeze.reason in [
                FreezeReason.SECURITY_CONCERN,
                FreezeReason.DATA_INTEGRITY
            ]
        )

        report = DiagnosticReport(
            timestamp=datetime.now(),
            system_state=self.state,
            freeze_event=self.current_freeze,
            component_status=self.component_status.copy(),
            data_integrity_score=integrity_score,
            recent_verifications=0,  # TODO: Get from metrics
            verification_success_rate=0.0,  # TODO: Get from metrics
            recommended_actions=actions,
            estimated_recovery_time="5-10 minutes",
            human_intervention_required=human_needed
        )

        logger.info(f"Diagnostics complete. Integrity: {integrity_score:.2%}")

        return report

    def _calculate_integrity_score(self) -> float:
        """Calculate overall data integrity score"""
        if not self.component_status:
            return 0.0

        active = sum(
            1 for s in self.component_status.values()
            if s == "ACTIVE"
        )
        return active / len(self.component_status)

    def _determine_recovery_actions(self) -> List[RecoveryAction]:
        """Determine recommended recovery actions"""
        actions = []

        if not self.current_freeze:
            return actions

        reason = self.current_freeze.reason

        if reason == FreezeReason.ARM_FAILURE:
            actions.append(RecoveryAction.RESTART_ARM)
        elif reason == FreezeReason.DATA_INTEGRITY:
            actions.append(RecoveryAction.ROLLBACK_DATA)
            actions.append(RecoveryAction.HUMAN_REVIEW)
        elif reason == FreezeReason.API_ERROR:
            actions.append(RecoveryAction.CLEAR_CACHE)
            actions.append(RecoveryAction.RESTART_ARM)
        elif reason == FreezeReason.SECURITY_CONCERN:
            actions.append(RecoveryAction.FULL_DIAGNOSTIC)
            actions.append(RecoveryAction.HUMAN_REVIEW)
        else:
            actions.append(RecoveryAction.FULL_DIAGNOSTIC)

        return actions

    # =========================================================================
    # RECOVERY
    # =========================================================================

    async def _attempt_auto_recovery(
        self,
        diagnostics: DiagnosticReport
    ) -> bool:
        """Attempt automatic recovery"""
        if diagnostics.human_intervention_required:
            logger.info("Human intervention required - skipping auto-recovery")
            return False

        if self.recovery_attempts >= self.max_auto_recovery_attempts:
            logger.warning("Max auto-recovery attempts reached")
            return False

        self.recovery_attempts += 1
        logger.info(
            f"Auto-recovery attempt {self.recovery_attempts}/"
            f"{self.max_auto_recovery_attempts}"
        )

        # Execute recommended actions
        for action in diagnostics.recommended_actions:
            success = await self._execute_recovery_action(action)
            if not success:
                logger.error(f"Recovery action failed: {action.value}")
                return False

        # Verify recovery
        post_diagnostics = await self.run_diagnostics()

        if post_diagnostics.data_integrity_score >= 0.8:
            logger.info("Auto-recovery successful")
            await self.unfreeze("auto_recovery")
            return True

        logger.warning("Auto-recovery incomplete - manual review needed")
        return False

    async def _execute_recovery_action(
        self,
        action: RecoveryAction
    ) -> bool:
        """Execute a single recovery action"""
        logger.info(f"Executing recovery action: {action.value}")

        try:
            if action == RecoveryAction.RESTART_ARM:
                # Restart affected components
                if self.current_freeze:
                    for comp_name in self.current_freeze.affected_components:
                        if comp_name in self.components:
                            comp = self.components[comp_name]
                            if hasattr(comp, 'resume'):
                                await comp.resume()
                return True

            elif action == RecoveryAction.CLEAR_CACHE:
                # Clear component caches
                for comp in self.components.values():
                    if hasattr(comp, 'clear_cache'):
                        await comp.clear_cache()
                return True

            elif action == RecoveryAction.ROLLBACK_DATA:
                # Would implement actual rollback
                logger.info("Data rollback simulated")
                return True

            elif action == RecoveryAction.FULL_DIAGNOSTIC:
                # Already run
                return True

            elif action == RecoveryAction.HUMAN_REVIEW:
                logger.info("Awaiting human review")
                return False

        except Exception as e:
            logger.error(f"Recovery action error: {e}")
            return False

        return False

    async def unfreeze(self, authorization: str) -> bool:
        """
        Unfreeze system after authorization

        WE333 Principle: "Human judgment preserved over AI"
        """
        if self.state != SystemState.FROZEN:
            logger.info("System not frozen")
            return True

        if not authorization:
            logger.error("Authorization required to unfreeze")
            return False

        logger.info(f"Unfreezing system - Auth: {authorization}")

        # Resume all components
        self.state = SystemState.RECOVERING

        for name, component in self.components.items():
            try:
                if hasattr(component, 'resume'):
                    await component.resume()
                self.component_status[name] = "ACTIVE"
            except Exception as e:
                logger.error(f"Error resuming {name}: {e}")
                self.component_status[name] = "ERROR"

        # Update freeze event
        if self.current_freeze:
            self.current_freeze.resolved = True
            self.current_freeze.resolution_time = datetime.now()
            self.current_freeze.resolution_action = authorization

        # Reset state
        self.state = SystemState.ACTIVE
        self.current_freeze = None
        self.recovery_attempts = 0

        logger.info("System unfrozen successfully")

        # Notify brain
        if self.brain_callback:
            await self.brain_callback("unfreeze", None)

        return True

    # =========================================================================
    # STATUS
    # =========================================================================

    def get_status(self) -> Dict[str, Any]:
        """Get current freeze protocol status"""
        return {
            "system_state": self.state.value,
            "is_frozen": self.state == SystemState.FROZEN,
            "current_freeze": (
                {
                    "event_id": self.current_freeze.event_id,
                    "reason": self.current_freeze.reason.value,
                    "timestamp": self.current_freeze.timestamp.isoformat(),
                    "details": self.current_freeze.details
                }
                if self.current_freeze else None
            ),
            "component_status": self.component_status.copy(),
            "freeze_history_count": len(self.freeze_history),
            "recovery_attempts": self.recovery_attempts
        }


# =============================================================================
# DEMO
# =============================================================================

async def demo():
    """Demonstrate Freeze Protocol"""
    protocol = FreezeProtocol()

    print("\n" + "="*60)
    print("FREEZE PROTOCOL - Demo")
    print("WE333: Safety is a network")
    print("="*60)

    # Mock component for demo
    class MockArm:
        def __init__(self, name):
            self.name = name
            self.active = True

        async def pause(self):
            self.active = False
            print(f"    {self.name} paused")

        async def resume(self):
            self.active = True
            print(f"    {self.name} resumed")

        async def health_check(self):
            return {"status": "ACTIVE" if self.active else "PAUSED"}

    # Register components
    hansard = MockArm("Hansard")
    veritas = MockArm("Veritas")
    protocol.register_component("hansard", hansard)
    protocol.register_component("veritas", veritas)

    print("\nRegistered Components:")
    for name, status in protocol.component_status.items():
        print(f"  {name}: {status}")

    # Trigger freeze
    print("\n--- Triggering Freeze ---")
    freeze = await protocol.trigger_freeze(
        reason=FreezeReason.ARM_FAILURE,
        trigger_source="hansard",
        details="API connection timeout",
        affected_components=["hansard"]
    )

    print(f"\nFreeze Event: {freeze.event_id}")
    print(f"Reason: {freeze.reason.value}")
    print(f"Affected: {freeze.affected_components}")

    # Show status
    print("\n--- System Status ---")
    status = protocol.get_status()
    print(f"State: {status['system_state']}")
    print(f"Frozen: {status['is_frozen']}")
    for comp, state in status['component_status'].items():
        print(f"  {comp}: {state}")

    # Manual unfreeze
    print("\n--- Manual Unfreeze ---")
    await protocol.unfreeze("admin_authorization")

    # Final status
    print("\n--- Final Status ---")
    status = protocol.get_status()
    print(f"State: {status['system_state']}")
    for comp, state in status['component_status'].items():
        print(f"  {comp}: {state}")

    print("\n" + "="*60)


if __name__ == "__main__":
    asyncio.run(demo())
