#!/usr/bin/env python3
"""
Configuration module for Cloud Insight AI
"""

import os
from pathlib import Path


class Config:
    """Base configuration"""
    
    DEBUG = os.getenv('DEBUG', 'False').lower() == 'true'
    AWS_REGION = os.getenv('AWS_REGION', 'us-east-1')
    S3_BUCKET = os.getenv('S3_BUCKET', 'cloud-insight-ai')
    
    # Paths
    BASE_DIR = Path(__file__).parent.parent.parent
    DATA_DIR = BASE_DIR / 'data'
    LOG_DIR = BASE_DIR / 'logs'


class DevelopmentConfig(Config):
    """Development configuration"""
    DEBUG = True


class ProductionConfig(Config):
    """Production configuration"""
    DEBUG = False


def get_config():
    """Get configuration based on environment"""
    env = os.getenv('ENV', 'development')
    if env == 'production':
        return ProductionConfig()
    return DevelopmentConfig()
