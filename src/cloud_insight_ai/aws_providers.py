#!/usr/bin/env python3
"""
AWS Provider Implementations

Author: MUBENDIRAN
"""

import logging
from typing import Dict, Any, List, Optional
from .providers import AIProvider, StorageProvider

logger = logging.getLogger(__name__)


class AWSComprehendProvider(AIProvider):
    """AWS Comprehend NLP provider"""
    
    def __init__(self, region: str = 'us-east-1'):
        self.region = region
        try:
            import boto3
            self.client = boto3.client('comprehend', region_name=region)
            logger.info(f"AWS Comprehend initialized: {region}")
        except ImportError:
            logger.warning("boto3 not available - using mock provider")
            self.client = None
    
    def analyze_text(self, text: str) -> Dict[str, Any]:
        if not text or len(text.strip()) < 10:
            return {'key_phrases': [], 'sentiment': {}, 'entities': []}
        
        # Truncate if needed
        if len(text.encode('utf-8')) > 5000:
            text = text[:5000]
        
        return {
            'key_phrases': self.detect_key_phrases(text),
            'sentiment': self.detect_sentiment(text),
            'entities': self.detect_entities(text)
        }
    
    def detect_key_phrases(self, text: str) -> List[Dict[str, Any]]:
        if not self.client:
            return []
        try:
            response = self.client.detect_key_phrases(Text=text, LanguageCode='en')
            return response.get('KeyPhrases', [])
        except Exception as e:
            logger.error(f"Key phrase detection failed: {e}")
            return []
    
    def detect_sentiment(self, text: str) -> Dict[str, Any]:
        if not self.client:
            return {}
        try:
            response = self.client.detect_sentiment(Text=text, LanguageCode='en')
            return {
                'Sentiment': response.get('Sentiment'),
                'SentimentScore': response.get('SentimentScore', {})
            }
        except Exception as e:
            logger.error(f"Sentiment detection failed: {e}")
            return {}
    
    def detect_entities(self, text: str) -> List[Dict[str, Any]]:
        if not self.client:
            return []
        try:
            response = self.client.detect_entities(Text=text, LanguageCode='en')
            return response.get('Entities', [])
        except Exception as e:
            logger.error(f"Entity detection failed: {e}")
            return []


class S3StorageProvider(StorageProvider):
    """AWS S3 storage provider"""
    
    def __init__(self, bucket_name: str, region: str = 'us-east-1'):
        self.bucket_name = bucket_name
        self.region = region
        try:
            import boto3
            self.client = boto3.client('s3', region_name=region)
            logger.info(f"S3 storage initialized: {bucket_name}")
        except ImportError:
            logger.warning("boto3 not available")
            self.client = None
    
    def upload_file(self, filename: str, content: bytes, content_type: str) -> bool:
        if not self.client:
            return False
        try:
            self.client.put_object(
                Bucket=self.bucket_name,
                Key=filename,
                Body=content,
                ContentType=content_type
            )
            logger.info(f"Uploaded: {filename}")
            return True
        except Exception as e:
            logger.error(f"Upload failed: {e}")
            return False
    
    def download_file(self, filename: str) -> Optional[bytes]:
        if not self.client:
            return None
        try:
            response = self.client.get_object(Bucket=self.bucket_name, Key=filename)
            return response['Body'].read()
        except Exception as e:
            logger.error(f"Download failed: {e}")
            return None
    
    def list_files(self, prefix: str = "") -> List[str]:
        if not self.client:
            return []
        try:
            response = self.client.list_objects_v2(Bucket=self.bucket_name, Prefix=prefix)
            return [obj['Key'] for obj in response.get('Contents', [])]
        except Exception as e:
            logger.error(f"List failed: {e}")
            return []
