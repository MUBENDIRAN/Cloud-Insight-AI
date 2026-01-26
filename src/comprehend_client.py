#!/usr/bin/env python3
"""
AWS Comprehend Client - Wrapper for NLP analysis
Supports multi-region (use us-east-1 for free tier)
"""

import boto3
from botocore.exceptions import ClientError


class ComprehendClient:
    """Wrapper for AWS Comprehend API interactions with multi-region support"""
    
    def __init__(self, region='us-east-1'):
        """
        Initialize Comprehend client
        
        Args:
            region: AWS region (default: us-east-1 for free tier)
        """
        self.region = region
        
        # Always use us-east-1 for Comprehend (free tier available)
        self.comprehend_region = 'us-east-1'
        
        try:
            self.client = boto3.client('comprehend', region_name=self.comprehend_region)
            print(f"[INFO] Comprehend client initialized in region: {self.comprehend_region}")
        except Exception as e:
            print(f"[ERROR] Failed to initialize Comprehend client: {e}")
            self.client = None
    
    def analyze_text(self, text):
        """
        Perform comprehensive text analysis using Comprehend
        Returns key phrases, sentiment, and entities
        """
        if not self.client:
            print("[WARNING] Comprehend client not available")
            return {
                'key_phrases': [],
                'sentiment': {},
                'entities': []
            }
        
        if not text or len(text.strip()) < 10:
            print("[WARNING] Text too short for Comprehend analysis")
            return {
                'key_phrases': [],
                'sentiment': {},
                'entities': []
            }
        
        # Truncate text if too long (Comprehend has limits)
        max_bytes = 5000
        if len(text.encode('utf-8')) > max_bytes:
            text = text[:max_bytes]
            print(f"[INFO] Text truncated to {max_bytes} bytes for Comprehend")
        
        results = {}
        
        # Detect key phrases
        try:
            key_phrases_response = self.client.detect_key_phrases(
                Text=text,
                LanguageCode='en'
            )
            results['key_phrases'] = key_phrases_response.get('KeyPhrases', [])
            print(f"[INFO] Detected {len(results['key_phrases'])} key phrases")
        except ClientError as e:
            error_code = e.response['Error']['Code']
            if error_code == 'SubscriptionRequiredException':
                print(f"[WARNING] Comprehend subscription required in {self.comprehend_region}")
            else:
                print(f"[ERROR] Key phrase detection failed: {e}")
            results['key_phrases'] = []
        except Exception as e:
            print(f"[ERROR] Unexpected error in key phrase detection: {e}")
            results['key_phrases'] = []
        
        # Detect sentiment
        try:
            sentiment_response = self.client.detect_sentiment(
                Text=text,
                LanguageCode='en'
            )
            results['sentiment'] = {
                'Sentiment': sentiment_response.get('Sentiment'),
                'SentimentScore': sentiment_response.get('SentimentScore', {})
            }
            print(f"[INFO] Sentiment: {results['sentiment']['Sentiment']}")
        except ClientError as e:
            error_code = e.response['Error']['Code']
            if error_code != 'SubscriptionRequiredException':
                print(f"[ERROR] Sentiment detection failed: {e}")
            results['sentiment'] = {}
        except Exception as e:
            print(f"[ERROR] Unexpected error in sentiment detection: {e}")
            results['sentiment'] = {}
        
        # Detect entities
        try:
            entities_response = self.client.detect_entities(
                Text=text,
                LanguageCode='en'
            )
            results['entities'] = entities_response.get('Entities', [])
            print(f"[INFO] Detected {len(results['entities'])} entities")
        except ClientError as e:
            error_code = e.response['Error']['Code']
            if error_code != 'SubscriptionRequiredException':
                print(f"[ERROR] Entity detection failed: {e}")
            results['entities'] = []
        except Exception as e:
            print(f"[ERROR] Unexpected error in entity detection: {e}")
            results['entities'] = []
        
        return results
    
    def detect_key_phrases(self, text):
        """Detect key phrases in text"""
        if not self.client:
            return []
        
        try:
            response = self.client.detect_key_phrases(
                Text=text,
                LanguageCode='en'
            )
            return response.get('KeyPhrases', [])
        except ClientError as e:
            print(f"[ERROR] Comprehend API error: {e}")
            return []
    
    def detect_sentiment(self, text):
        """Detect sentiment in text"""
        if not self.client:
            return {}
        
        try:
            response = self.client.detect_sentiment(
                Text=text,
                LanguageCode='en'
            )
            return {
                'Sentiment': response.get('Sentiment'),
                'Score': response.get('SentimentScore', {})
            }
        except ClientError as e:
            print(f"[ERROR] Comprehend API error: {e}")
            return {}
    
    def detect_entities(self, text):
        """Detect named entities in text"""
        if not self.client:
            return []
        
        try:
            response = self.client.detect_entities(
                Text=text,
                LanguageCode='en'
            )
            return response.get('Entities', [])
        except ClientError as e:
            print(f"[ERROR] Comprehend API error: {e}")
            return []