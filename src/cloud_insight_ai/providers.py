#!/usr/bin/env python3
"""
Provider Interfaces for Cloud Insight AI

Author: MUBENDIRAN
"""

from abc import ABC, abstractmethod
from typing import Dict, Any, List, Optional


class AIProvider(ABC):
    """Abstract base class for AI/NLP providers"""
    
    @abstractmethod
    def analyze_text(self, text: str) -> Dict[str, Any]:
        """Analyze text and return insights"""
        pass
    
    @abstractmethod
    def detect_key_phrases(self, text: str) -> List[Dict[str, Any]]:
        """Extract key phrases"""
        pass
    
    @abstractmethod
    def detect_sentiment(self, text: str) -> Dict[str, Any]:
        """Detect sentiment"""
        pass
    
    @abstractmethod
    def detect_entities(self, text: str) -> List[Dict[str, Any]]:
        """Detect entities"""
        pass


class StorageProvider(ABC):
    """Abstract base class for storage providers"""
    
    @abstractmethod
    def upload_file(self, filename: str, content: bytes, content_type: str) -> bool:
        """Upload file"""
        pass
    
    @abstractmethod
    def download_file(self, filename: str) -> Optional[bytes]:
        """Download file"""
        pass
    
    @abstractmethod
    def list_files(self, prefix: str = "") -> List[str]:
        """List files"""
        pass


class MockAIProvider(AIProvider):
    """Mock AI provider for testing"""
    
    def analyze_text(self, text: str) -> Dict[str, Any]:
        return {
            'key_phrases': [{'Text': 'mock phrase', 'Score': 0.95}],
            'sentiment': {'Sentiment': 'NEUTRAL', 'SentimentScore': {}},
            'entities': []
        }
    
    def detect_key_phrases(self, text: str) -> List[Dict[str, Any]]:
        return [{'Text': 'mock phrase', 'Score': 0.95}]
    
    def detect_sentiment(self, text: str) -> Dict[str, Any]:
        return {'Sentiment': 'NEUTRAL', 'Score': {}}
    
    def detect_entities(self, text: str) -> List[Dict[str, Any]]:
        return []
