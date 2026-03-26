#!/usr/bin/env python3
"""
Tests for core analyzer
"""


class TestCloudAnalyzer:
    """Test CloudAnalyzer class"""
    
    def test_initialization(self):
        from cloud_insight_ai.core import CloudAnalyzer
        analyzer = CloudAnalyzer()
        assert analyzer.region == 'us-east-1'
    
    def test_analyze(self):
        from cloud_insight_ai.core import CloudAnalyzer
        analyzer = CloudAnalyzer()
        result = analyzer.analyze({})
        assert result['status'] == 'ok'
