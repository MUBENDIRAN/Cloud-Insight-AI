#!/usr/bin/env python3
"""
Basic usage example for Cloud Insight AI
"""

from cloud_insight_ai import CloudAnalyzer
from cloud_insight_ai.providers import MockAIProvider


def main():
    # Initialize analyzer
    analyzer = CloudAnalyzer(region='us-east-1')
    
    # Analyze data
    result = analyzer.analyze({
        'cost': 1000,
        'region': 'us-east-1'
    })
    
    print(f"Analysis result: {result}")
    
    # Use mock provider
    provider = MockAIProvider()
    text_result = provider.analyze_text("Sample cloud log")
    print(f"Text analysis: {text_result}")


if __name__ == '__main__':
    main()
