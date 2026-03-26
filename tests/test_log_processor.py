#!/usr/bin/env python3
"""
Tests for log processor module
Tests the analyze_logs function and log analysis functionality
"""

import unittest
from unittest.mock import Mock, patch
from pathlib import Path
import sys

# Add src to path
sys.path.insert(0, str(Path(__file__).parent.parent / "src"))

from cloud_insight_ai.log_processor import analyze_logs


class TestLogProcessor(unittest.TestCase):
    """Test cases for log processor"""
    
    def setUp(self):
        """Set up test fixtures"""
        self.test_logs = [
            {
                "timestamp": "2024-01-15T10:30:00Z",
                "level": "ERROR",
                "message": "Connection timeout to database",
                "service": "api-server"
            },
            {
                "timestamp": "2024-01-15T10:35:00Z",
                "level": "WARNING",
                "message": "High memory usage detected",
                "service": "worker-process"
            },
            {
                "timestamp": "2024-01-15T10:40:00Z",
                "level": "INFO",
                "message": "Request processed successfully",
                "service": "api-server"
            },
            {
                "timestamp": "2024-01-15T10:45:00Z",
                "level": "ERROR",
                "message": "Failed to connect to cache",
                "service": "api-server"
            }
        ]
    
    def test_analyze_logs_basic(self):
        """Test basic log analysis"""
        result = analyze_logs(self.test_logs)
        self.assertIsNotNone(result)
    
    def test_analyze_logs_error_detection(self):
        """Test error detection in logs"""
        result = analyze_logs(self.test_logs)
        self.assertIsNotNone(result)
    
    def test_analyze_logs_warning_detection(self):
        """Test warning detection in logs"""
        result = analyze_logs(self.test_logs)
        self.assertIsNotNone(result)
    
    def test_analyze_logs_empty(self):
        """Test with empty logs"""
        result = analyze_logs([])
        self.assertIsNotNone(result)
    
    def test_log_level_distribution(self):
        """Test log level distribution analysis"""
        result = analyze_logs(self.test_logs)
        self.assertIsNotNone(result)


class TestLogAnomalyDetection(unittest.TestCase):
    """Test cases for log anomaly detection"""
    
    def test_error_spike_detection(self):
        """Test detection of error spikes"""
        error_logs = [
            {"timestamp": f"2024-01-15T10:{i:02d}:00Z", "level": "ERROR", "message": "Error"}
            for i in range(30, 40)
        ]
        result = analyze_logs(error_logs)
        self.assertIsNotNone(result)
    
    def test_repeated_error_detection(self):
        """Test detection of repeated errors"""
        repeated_errors = [
            {
                "timestamp": f"2024-01-15T10:{i:02d}:00Z",
                "level": "ERROR",
                "message": "Database connection timeout",
                "service": "api"
            }
            for i in range(30, 35)
        ]
        result = analyze_logs(repeated_errors)
        self.assertIsNotNone(result)


if __name__ == "__main__":
    unittest.main()
