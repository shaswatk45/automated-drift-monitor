# database.py
# ──────────────────────────────────────────────────────────────────────────────
# Simple file-based drift report storage.
#
# WHY NOT A REAL DATABASE?
#   At this stage the project only needs to list and read JSON report files
#   that the drift detector already saves to logs/drift_reports/.  A real
#   database (SQLite, PostgreSQL, etc.) can be added later when we need to
#   store predictions, model versions, or alert history.
#
#   This module provides a clean interface so the rest of the backend never
#   touches the file system directly — making it easy to swap in a database
#   later without changing the API routes.
# ──────────────────────────────────────────────────────────────────────────────

import json
import logging
import os
from typing import Optional

log = logging.getLogger(__name__)


class ReportStore:
    """
    Interface for reading drift reports stored as JSON files.

    Usage:
        store = ReportStore("logs/drift_reports")
        reports = store.list_reports()
        latest = store.get_latest_report()
    """

    def __init__(self, report_dir: str):
        """
        Parameters
        ----------
        report_dir : str
            Path to the directory containing drift report JSON files.
        """
        self.report_dir = report_dir
        # Ensure the directory exists
        os.makedirs(self.report_dir, exist_ok=True)

    def _safe_path(self, filename: str) -> Optional[str]:
        """
        Resolve ``filename`` to an absolute path *inside* report_dir, or return
        None if it escapes the directory (path-traversal guard). Only bare
        ``.json`` filenames are accepted — no sub-paths, no ``..``.
        """
        if not filename.endswith(".json") or "/" in filename or "\\" in filename:
            return None
        base = os.path.realpath(self.report_dir)
        target = os.path.realpath(os.path.join(base, filename))
        if os.path.commonpath([base, target]) != base:
            return None
        return target

    def list_reports(self) -> list:
        """
        Return a sorted list of all drift report filenames (newest first).

        Returns
        -------
        list of dict
            Each dict has: filename, created_at (from file modification time),
            and file_size_bytes.
        """
        reports = []
        for filename in os.listdir(self.report_dir):
            if filename.endswith(".json"):
                filepath = os.path.join(self.report_dir, filename)
                stat = os.stat(filepath)
                reports.append({
                    "filename": filename,
                    "created_at": stat.st_mtime,
                    "file_size_bytes": stat.st_size,
                })

        # Sort by creation time, newest first
        reports.sort(key=lambda r: r["created_at"], reverse=True)
        log.info(f"Found {len(reports)} drift reports in {self.report_dir}")
        return reports

    def get_report(self, filename: str) -> Optional[dict]:
        """
        Load and return a specific drift report by filename.

        Parameters
        ----------
        filename : str
            Name of the report file (e.g. "drift_report_20260309_135316.json").

        Returns
        -------
        dict or None
            The parsed JSON contents of the report, or None if not found.
        """
        filepath = self._safe_path(filename)
        if filepath is None:
            log.warning(f"Rejected unsafe report filename: {filename!r}")
            return None
        if not os.path.exists(filepath):
            log.warning(f"Report not found: {filepath}")
            return None

        with open(filepath, "r") as f:
            report = json.load(f)
        log.info(f"Loaded report: {filename}")
        return report

    def delete_report(self, filename: str) -> bool:
        """
        Delete a report by filename. Returns True if a file was removed,
        False if it did not exist or the filename was unsafe.
        """
        filepath = self._safe_path(filename)
        if filepath is None:
            log.warning(f"Rejected unsafe delete filename: {filename!r}")
            return False
        if not os.path.exists(filepath):
            return False
        os.remove(filepath)
        log.info(f"Deleted report: {filename}")
        return True

    def history(self, limit: int = 100) -> list:
        """
        Return a lightweight, time-ordered (oldest-first) history of drift
        runs for trend charts: timestamp, drift_score, counts, overall_drift.
        """
        points = []
        for meta in self.list_reports():
            report = self.get_report(meta["filename"])
            if not report:
                continue
            summary = report.get("summary", {})
            points.append({
                "filename":       meta["filename"],
                "timestamp":      report.get("timestamp"),
                "drift_score":    report.get("drift_score", 0.0),
                "overall_drift":  report.get("overall_drift", False),
                "drifted_count":  summary.get("drifted_count", 0),
                "total_features": summary.get("total_features", 0),
                "critical_count": summary.get("critical_count", 0),
            })
        # Oldest-first is friendlier for time-series charts.
        points.sort(key=lambda p: p["timestamp"] or "")
        return points[-limit:]

    def get_latest_report(self) -> Optional[dict]:
        """
        Load and return the most recent drift report.

        Returns
        -------
        dict or None
            The parsed JSON contents of the newest report, or None if
            no reports exist.
        """
        reports = self.list_reports()
        if not reports:
            log.info("No drift reports found")
            return None

        # The list is already sorted newest-first
        newest = reports[0]["filename"]
        return self.get_report(newest)
