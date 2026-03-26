#!/usr/bin/env python3
"""
Tests for provider implementations
"""

import pytest


class TestMockAIProvider:
    """Test MockAIProvider"""
    
    def test_analyze_text(self):
        from cloud_insight_ai.providers import MockAIProvider
        provider = MockAIProvider()
        result = provider.analyze_text("This is a test")
        assert 'key_phrases' in result
        assert 'sentiment' in result


class TestProviderInterfaces:
    """Test provider abstract interfaces"""
    
    def test_ai_provider_is_abstract(self):
        from cloud_insight_ai.providers import AIProvider
        with pytest.raises(TypeError):
            AIProvider()
