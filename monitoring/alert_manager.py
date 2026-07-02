# alert_manager.py
# ──────────────────────────────────────────────────────────────────────────────
# Alert manager for the Automated Drift Monitor.
#
# Provides a simple, extensible alerting system that fires when drift is
# detected.  Currently supports:
#   - Console (logging) alerts  — always active
#   - File-based alerts         — writes a plaintext alert to logs/alerts.log
#
# Designed so new channels (email, Slack, PagerDuty) can be added by
# implementing the abstract AlertChannel interface.
# ──────────────────────────────────────────────────────────────────────────────

import logging
import os
from abc import ABC, abstractmethod
from datetime import datetime, timezone
from typing import List, Optional

log = logging.getLogger(__name__)


# ── Base channel interface ─────────────────────────────────────────────────────

class AlertChannel(ABC):
    """Abstract base class for alert delivery channels."""

    @abstractmethod
    def send(self, subject: str, body: str) -> bool:
        """
        Send an alert.

        Parameters
        ----------
        subject : str
            Short one-line summary of the alert.
        body : str
            Full alert message with details.

        Returns
        -------
        bool
            True if the alert was delivered successfully, False otherwise.
        """


# ── Console channel ───────────────────────────────────────────────────────────

class ConsoleAlertChannel(AlertChannel):
    """Emits alerts to the application log (always active)."""

    def send(self, subject: str, body: str) -> bool:
        log.warning("=" * 60)
        log.warning(f"[ALERT] {subject}")
        log.warning(body)
        log.warning("=" * 60)
        return True


# ── File channel ──────────────────────────────────────────────────────────────

class FileAlertChannel(AlertChannel):
    """Appends alerts to a plaintext log file."""

    def __init__(self, alert_log_path: str = "logs/alerts.log"):
        self.path = alert_log_path
        os.makedirs(os.path.dirname(self.path), exist_ok=True)

    def send(self, subject: str, body: str) -> bool:
        timestamp = datetime.now(timezone.utc).isoformat()
        try:
            with open(self.path, "a") as f:
                f.write(f"\n{'=' * 60}\n")
                f.write(f"[{timestamp}] {subject}\n")
                f.write(f"{body}\n")
            log.info(f"Alert written to {self.path}")
            return True
        except Exception as e:
            log.error(f"FileAlertChannel failed: {e}")
            return False


# ── Alert manager ─────────────────────────────────────────────────────────────

class AlertManager:
    """
    Manages one or more alert channels and fires alerts when drift is detected.

    Usage
    -----
        manager = AlertManager()
        manager.add_channel(ConsoleAlertChannel())
        manager.add_channel(FileAlertChannel("logs/alerts.log"))
        manager.check_and_alert(drift_results)
    """

    def __init__(self, channels: Optional[List[AlertChannel]] = None):
        self.channels: List[AlertChannel] = channels or []

    def add_channel(self, channel: AlertChannel) -> None:
        """Register an additional alert channel."""
        self.channels.append(channel)

    def check_and_alert(self, drift_results: dict) -> bool:
        """
        Inspect a drift report and fire alerts if drift was detected.

        Parameters
        ----------
        drift_results : dict
            Dictionary returned by ``DriftDetector.detect_drift()``.

        Returns
        -------
        bool
            True if an alert was fired (i.e. drift was detected), False otherwise.
        """
        overall_drift = drift_results.get("overall_drift", False)
        if not overall_drift:
            log.info("AlertManager: no drift detected — no alert fired.")
            return False

        drifted = drift_results.get("drifted_features", [])
        summary = drift_results.get("summary", {})
        timestamp = drift_results.get("timestamp", "N/A")
        dataset_size = drift_results.get("dataset_size", "N/A")

        subject = (
            f"[DRIFT ALERT] {len(drifted)} feature(s) drifted "
            f"({summary.get('drifted_count', '?')}/{summary.get('total_features', '?')} total)"
        )

        lines = [
            f"Timestamp    : {timestamp}",
            f"Dataset size : {dataset_size}",
            f"Drifted features ({len(drifted)}): {', '.join(drifted)}",
            "",
            "Feature breakdown:",
        ]
        for feat in drifted:
            result = drift_results.get("feature_results", {}).get(feat, {})
            reasons = result.get("reasons", [])
            lines.append(f"  • {feat}:")
            for r in reasons:
                lines.append(f"      – {r}")

        body = "\n".join(lines)

        success = True
        for channel in self.channels:
            try:
                ok = channel.send(subject, body)
                if not ok:
                    success = False
            except Exception as e:
                log.error(f"Alert channel {type(channel).__name__} raised: {e}")
                success = False

        return success


# ── Default singleton factory ──────────────────────────────────────────────────

def create_default_alert_manager(alert_log_path: str = "logs/alerts.log") -> AlertManager:
    """
    Create an AlertManager with the default Console + File channels.

    Parameters
    ----------
    alert_log_path : str
        Path to the alert log file.

    Returns
    -------
    AlertManager
    """
    manager = AlertManager()
    manager.add_channel(ConsoleAlertChannel())
    manager.add_channel(FileAlertChannel(alert_log_path))
    return manager
