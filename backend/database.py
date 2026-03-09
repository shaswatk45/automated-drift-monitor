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
        filepath = os.path.join(self.report_dir, filename)
        if not os.path.exists(filepath):
            log.warning(f"Report not found: {filepath}")
            return None

        with open(filepath, "r") as f:
            report = json.load(f)
        log.info(f"Loaded report: {filename}")
        return report

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
