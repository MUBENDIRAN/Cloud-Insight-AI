#!/usr/bin/env python3
"""
Configuration Loader - Loads and validates config.yaml
"""

import yaml
import os
from typing import Dict, Any


class ConfigLoader:
    """Loads and manages application configuration"""
    
    def __init__(self, config_file='config.yaml'):
        self.config_file = config_file
        self.config = {}
        self.load_config()
    
    def load_config(self):
        """Load configuration from YAML file"""
        try:
            with open(self.config_file, 'r') as f:
                self.config = yaml.safe_load(f)
            print(f"[INFO] Configuration loaded from {self.config_file}")
            
            # Override with environment variables if present
            self._apply_env_overrides()
            
            return self.config
        except FileNotFoundError:
            print(f"[WARNING] Config file not found: {self.config_file}")
            print("[INFO] Using default configuration")
            self.config = self._get_default_config()
            return self.config
        except yaml.YAMLError as e:
            print(f"[ERROR] Invalid YAML in config file: {e}")
            raise
    
    def _apply_env_overrides(self):
        """Override config with environment variables"""
        # S3 bucket from environment
        if os.environ.get('S3_BUCKET'):
            self.config.setdefault('storage', {})['s3_bucket'] = os.environ['S3_BUCKET']
        
        # AWS region
        if os.environ.get('AWS_DEFAULT_REGION'):
            self.config.setdefault('comprehend', {})['region'] = os.environ['AWS_DEFAULT_REGION']
        
        # Email sender from environment
        if os.environ.get('SES_SENDER_EMAIL'):
            self.config.setdefault('notifications', {}).setdefault('email', {})['sender'] = os.environ['SES_SENDER_EMAIL']
        
        # Email recipients from environment (comma-separated)
        if os.environ.get('SES_RECIPIENT_EMAILS'):
            recipients = os.environ['SES_RECIPIENT_EMAILS'].split(',')
            self.config.setdefault('notifications', {}).setdefault('email', {})['recipients'] = recipients
    
    def _get_default_config(self) -> Dict[str, Any]:
        """Return default configuration"""
        return {
            'general': {
                'project_name': 'Cloud Insight AI',
                'report_filename': 'final_report.txt',
                'enable_comprehend': True
            },
            'cost_analysis': {
                'enabled': True,
                'data_sources': ['data/cost.json'],
                'thresholds': {
                    'cost_increase_alert_percent': 15.0,
                    'high_cost_service_percent': 30.0,
                    'stable_range_percent': 5.0
                }
            },
            'log_analysis': {
                'enabled': True,
                'data_sources': [
                    {'path': 'data/logs.txt', 'type': 'application', 'description': 'Main logs'}
                ],
                'thresholds': {
                    'max_error_rate_percent': 10.0,
                    'max_error_count': 15,
                    'max_warning_count': 25
                }
            },
            'notifications': {
                'enabled': False,
                'email': {'enabled': False}
            },
            'storage': {
                's3_bucket': os.environ.get('S3_BUCKET', ''),
                'use_date_prefix': True
            }
        }
    
    def get(self, key_path: str, default=None):
        """
        Get config value by dot-notation path
        Example: config.get('cost_analysis.thresholds.cost_increase_alert_percent')
        """
        keys = key_path.split('.')
        value = self.config
        
        for key in keys:
            if isinstance(value, dict) and key in value:
                value = value[key]
            else:
                return default
        
        return value
    
    def get_cost_threshold(self, name: str) -> float:
        """Get cost analysis threshold"""
        return self.get(f'cost_analysis.thresholds.{name}', 0.0)
    
    def get_log_threshold(self, name: str) -> float:
        """Get log analysis threshold"""
        return self.get(f'log_analysis.thresholds.{name}', 0.0)
    
    def is_cost_analysis_enabled(self) -> bool:
        """Check if cost analysis is enabled"""
        return self.get('cost_analysis.enabled', True)
    
    def is_log_analysis_enabled(self) -> bool:
        """Check if log analysis is enabled"""
        return self.get('log_analysis.enabled', True)
    
    def is_comprehend_enabled(self) -> bool:
        """Check if Comprehend analysis is enabled"""
        return self.get('general.enable_comprehend', True)
    
    def is_notifications_enabled(self) -> bool:
        """Check if notifications are enabled"""
        return self.get('notifications.enabled', False)
    
    def get_log_sources(self) -> list:
        """Get list of log data sources"""
        sources = self.get('log_analysis.data_sources', [])
        
        # Ensure sources is a list of dicts
        normalized = []
        for source in sources:
            if isinstance(source, str):
                normalized.append({
                    'path': source,
                    'type': 'application',
                    'description': 'Log file'
                })
            elif isinstance(source, dict):
                normalized.append(source)
        
        return normalized
    
    def get_error_patterns(self) -> list:
        """Get configured error patterns"""
        return self.get('log_analysis.error_patterns', [])