#!/usr/bin/env python3
"""
Core CloudAnalyzer class

Author: MUBENDIRAN
"""

from typing import Dict, Any, List, Optional
from cloud_insight_ai.cost_processor import analyze_cost
from cloud_insight_ai.log_processor import analyze_logs


class CloudAnalyzer:
    """
    Main orchestrator for Cloud Insight AI analysis.
    
    Usage:
        analyzer = CloudAnalyzer()
        result = analyzer.run(cost_data, logs)
    """
    
    def __init__(self, config: Optional[Dict[str, Any]] = None):
        """
        Initialize CloudAnalyzer.
        
        Args:
            config: Optional configuration dictionary with:
                - cost_thresholds (dict): Cost analysis thresholds
                - log_thresholds (dict): Log analysis thresholds
                - error_patterns (list): Custom error patterns
        """
        self.config = config or {}
    
    def run(self, cost_data: List[Dict[str, Any]], logs: List[str]) -> Dict[str, Any]:
        """
        Run complete analysis on cost and log data.
        
        Args:
            cost_data: List of cost records with 'service', 'date', 'cost' keys
            logs: List of log line strings
            
        Returns:
            Dictionary with cost, logs, and alerts analysis
        """
        # Analyze cost data
        cost_result = analyze_cost(cost_data)
        
        # Analyze logs with custom error patterns if provided
        error_patterns = self.config.get('error_patterns')
        log_result = analyze_logs(logs, error_patterns)
        
        # Generate alerts
        alerts = self._generate_alerts(cost_result, log_result)
        
        # Build comprehensive result
        return {
            'cost': cost_result,
            'logs': log_result,
            'alerts': alerts,
            'summary': {
                'total_cost': cost_result['total_cost'],
                'total_services': len(cost_result['service_totals']),
                'total_log_entries': log_result['total_entries'],
                'error_count': log_result['error_count'],
                'warning_count': log_result['warning_count'],
                'alert_count': len(alerts)
            }
        }
    
    def run_cost_only(self, cost_data: List[Dict[str, Any]]) -> Dict[str, Any]:
        """Analyze only cost data"""
        return analyze_cost(cost_data)
    
    def run_logs_only(self, logs: List[str]) -> Dict[str, Any]:
        """Analyze only log data"""
        error_patterns = self.config.get('error_patterns')
        return analyze_logs(logs, error_patterns)
    
    def _generate_alerts(self, cost_result: Dict, log_result: Dict) -> List[Dict[str, str]]:
        """Generate alerts based on thresholds"""
        alerts = []
        
        # Cost alerts
        cost_thresholds = self.config.get('cost_thresholds', {})
        high_cost_percent = cost_thresholds.get('high_cost_service_percent', 30.0)
        
        total_cost = cost_result['total_cost']
        if total_cost > 0:
            for service, cost in cost_result['service_totals'].items():
                percent = (cost / total_cost) * 100
                if percent > high_cost_percent:
                    alerts.append({
                        'severity': 'high',
                        'category': 'cost',
                        'message': f'{service} accounts for {percent:.1f}% of total costs (${cost:.2f})'
                    })
        
        # Log alerts
        log_thresholds = self.config.get('log_thresholds', {})
        max_errors = log_thresholds.get('max_error_count', 15)
        max_warnings = log_thresholds.get('max_warning_count', 25)
        
        if log_result['error_count'] > max_errors:
            alerts.append({
                'severity': 'critical',
                'category': 'logs',
                'message': f'High error count: {log_result["error_count"]} errors (threshold: {max_errors})'
            })
        
        if log_result['warning_count'] > max_warnings:
            alerts.append({
                'severity': 'medium',
                'category': 'logs',
                'message': f'High warning count: {log_result["warning_count"]} warnings (threshold: {max_warnings})'
            })
        
        return alerts
