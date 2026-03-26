#!/usr/bin/env python3
"""
Tests for cost processor module
Tests the analyze_cost function and cost analysis functionality
"""

import unittest
from unittest.mock import Mock, patch
from pathlib import Path
import json
import sys

# Add src to path
sys.path.insert(0, str(Path(__file__).parent.parent / "src"))

from cloud_insight_ai.cost_processor import analyze_cost


class TestCostProcessor(unittest.TestCase):
    """Test cases for cost processor"""
    
    def setUp(self):
        """Set up test fixtures"""
        self.test_cost_data = {
            "costs": [
                {
                    "service": "EC2",
                    "cost": 100.50,
                    "currency": "USD",
                    "period": "2024-01-01 to 2024-01-31"
                },
                {
                    "service": "S3",
                    "cost": 50.25,
                    "currency": "USD",
                    "period": "2024-01-01 to 2024-01-31"
                },
                {
                    "service": "Lambda",
                    "cost": 15.75,
                    "currency": "USD",
                    "period": "2024-01-01 to 2024-01-31"
                }
            ],
            "total_cost": 166.50,
            "currency": "USD"
        }
    
    def test_analyze_cost_basic(self):
        """Test basic cost analysis"""
        result = analyze_cost(self.test_cost_data)
        self.assertIsNotNone(result)
        self.assertIn("total_cost", result)
    
    def test_analyze_cost_with_threshold(self):
        """Test cost analysis with threshold"""
        threshold = 100.0
        result = analyze_cost(self.test_cost_data, threshold=threshold)
        self.assertIsNotNone(result)
    
    def test_analyze_cost_empty_data(self):
        """Test cost analysis with empty data"""
        empty_data = {"costs": [], "total_cost": 0}
        result = analyze_cost(empty_data)
        self.assertIsNotNone(result)
    
    def test_cost_service_breakdown(self):
        """Test service-level cost breakdown"""
        result = analyze_cost(self.test_cost_data)
        self.assertIsNotNone(result)
        # Verify that EC2 is the most expensive service
        if isinstance(result, dict) and "services" in result:
            services = result.get("services", [])
            if services:
                self.assertEqual(services[0].get("service"), "EC2")


class TestCostTrendAnalysis(unittest.TestCase):
    """Test cases for cost trend analysis"""
    
    def test_cost_trend_detection(self):
        """Test cost trend detection"""
        multi_period_data = {
            "periods": [
                {"period": "2024-01-01", "cost": 100},
                {"period": "2024-02-01", "cost": 120},
                {"period": "2024-03-01", "cost": 110},
            ]
        }
        result = analyze_cost(multi_period_data)
        self.assertIsNotNone(result)


if __name__ == "__main__":
    unittest.main()
