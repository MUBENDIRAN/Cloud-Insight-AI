#!/usr/bin/env python3
"""
Tests for core analyzer
"""


class TestCloudAnalyzer:
    """Test CloudAnalyzer class"""
    
    def test_initialization(self):
        from cloud_insight_ai.core import CloudAnalyzer
        analyzer = CloudAnalyzer()
        assert analyzer.config == {}
    
    def test_analyze(self):
        from cloud_insight_ai.core import CloudAnalyzer
        analyzer = CloudAnalyzer()
        cost_data = [
            {'service': 'EC2', 'date': '2025-01-01', 'cost': 10.0},
            {'service': 'S3', 'date': '2025-01-01', 'cost': 5.0},
        ]
        logs = [
            '2025-01-01 10:00:00 [INFO] Started',
            '2025-01-01 10:01:00 [ERROR] Timeout',
        ]
        result = analyzer.run(cost_data, logs)
        assert result['summary']['total_cost'] == 15.0
        assert result['summary']['error_count'] == 1
