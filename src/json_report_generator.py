#!/usr/bin/env python3
"""
JSON Report Generator - Creates structured JSON for dashboard
"""

import json
from datetime import datetime


class JSONReportGenerator:
    """Generates JSON reports for frontend dashboard consumption"""
    
    def __init__(self, config):
        self.config = config
    
    def generate_report_json(self, cost_summary, log_summary, 
                            cost_insights, log_insights, alerts):
        """
        Generate final_report.json for dashboard
        
        Expected format for your frontend:
        {
            "timestamp": "2025-01-15T10:30:00Z",
            "cost_summary": "Total: $500, EC2: $200, RDS: $150...",
            "log_summary": "45 entries, 12 errors, 8 warnings",
            "log_health_status": "Healthy|Degraded",
            "log_levels": {
                "critical": 2,
                "error": 12,
                "warning": 8,
                "info": 23
            },
            "trend": "up|down|neutral",
            "recommendations": ["recommendation 1", "recommendation 2"],
            "alerts": [
                {
                    "severity": "high",
                    "category": "cost",
                    "message": "EC2 costs increased by 22%"
                }
            ],
            "detailed_analysis": {
                "cost_breakdown": [...],
                "log_patterns": [...],
                "ai_insights": {...}
            }
        }
        """
        
        # Calculate log health status
        total_logs = log_summary.get('total_entries', 0)
        error_count = log_summary.get('error_count', 0)
        warning_count = log_summary.get('warning_count', 0)
        
        error_rate = (error_count / total_logs * 100) if total_logs > 0 else 0
        
        if error_rate > 10 or error_count > 15:
            health_status = "Degraded"
        else:
            health_status = "Healthy"
        
        # Determine trend
        trend = self._calculate_trend(cost_summary, log_summary)
        
        # Build cost summary text
        cost_text = self._build_cost_summary_text(cost_summary)
        
        # Build log summary text
        log_text = self._build_log_summary_text(log_summary)
        
        # Extract recommendations
        recommendations = self._extract_recommendations(
            cost_summary, 
            log_summary, 
            alerts
        )
        
        # Build detailed analysis
        detailed = self._build_detailed_analysis(
            cost_summary,
            log_summary,
            cost_insights,
            log_insights
        )
        
        report = {
            "timestamp": datetime.utcnow().isoformat() + "Z",
            "cost_summary": cost_text,
            "log_summary": log_text,
            "log_health_status": health_status,
            "log_levels": {
                "critical": 0,  # Your logs don't have critical, using error as proxy
                "error": log_summary.get('error_count', 0),
                "warning": log_summary.get('warning_count', 0),
                "info": log_summary.get('info_count', 0)
            },
            "trend": trend,
            "recommendations": recommendations[:10],  # Top 10
            "alerts": alerts,
            "detailed_analysis": detailed,
            "metadata": {
                "analysis_version": "1.0",
                "data_sources": self._get_data_sources(),
                "comprehend_enabled": self.config.is_comprehend_enabled()
            }
        }
        
        return report
    
    def generate_config_json(self):
        """
        Generate config.json for dashboard display
        
        Expected format:
        {
            "analysis_config": {
                "log_files_to_analyze": ["logs.txt", "security-logs.txt"],
                "cost_categories_to_watch": ["EC2", "RDS", "S3"],
                "abnormal_thresholds": {
                    "cost_increase_percentage": 15,
                    "critical_log_count": 10
                }
            }
        }
        """
        
        log_sources = self.config.get_log_sources()
        log_files = [source.get('path', '').split('/')[-1] for source in log_sources]
        
        cost_sources = self.config.get('cost_analysis.data_sources', [])
        
        # Get monitored services
        monitor_services = self.config.get('cost_analysis.monitor_services', [])
        if not monitor_services:
            # Default to common services
            monitor_services = ["EC2", "RDS", "S3", "Lambda", "DynamoDB"]
        
        config_json = {
            "analysis_config": {
                "log_files_to_analyze": log_files,
                "cost_categories_to_watch": monitor_services,
                "abnormal_thresholds": {
                    "cost_increase_percentage": int(self.config.get_cost_threshold('cost_increase_alert_percent')),
                    "critical_log_count": int(self.config.get_log_threshold('max_error_count'))
                }
            },
            "project_info": {
                "name": self.config.get('general.project_name', 'Cloud Insight AI'),
                "version": "1.0.0",
                "last_updated": datetime.utcnow().isoformat() + "Z"
            }
        }
        
        return config_json
    
    def _build_cost_summary_text(self, cost_summary):
        """Build human-readable cost summary"""
        service_totals = cost_summary.get('service_totals', {})
        total_cost = sum(service_totals.values())
        
        top_services = sorted(
            service_totals.items(), 
            key=lambda x: x[1], 
            reverse=True
        )[:3]
        
        summary_parts = [f"Total: ${total_cost:.2f}"]
        for service, cost in top_services:
            summary_parts.append(f"{service}: ${cost:.2f}")
        
        return ", ".join(summary_parts)
    
    def _build_log_summary_text(self, log_summary):
        """Build human-readable log summary"""
        total = log_summary.get('total_entries', 0)
        errors = log_summary.get('error_count', 0)
        warnings = log_summary.get('warning_count', 0)
        
        return f"{total} entries, {errors} errors, {warnings} warnings"
    
    def _calculate_trend(self, cost_summary, log_summary):
        """Determine if metrics are trending up, down, or neutral"""
        
        # Check if errors are increasing (simple heuristic)
        error_rate = log_summary.get('error_percentage', 0)
        
        if error_rate > 15:
            return "up"  # Bad trend
        elif error_rate < 5:
            return "down"  # Good trend
        else:
            return "neutral"
    
    def _extract_recommendations(self, cost_summary, log_summary, alerts):
        """Extract actionable recommendations"""
        recommendations = []
        
        # From cost analysis
        cost_recs = cost_summary.get('recommendations', '')
        for line in cost_recs.split('\n'):
            line = line.strip()
            if line and line.startswith('•'):
                recommendations.append(line[1:].strip())
        
        # From log analysis
        log_recs = log_summary.get('recommendations', '')
        for line in log_recs.split('\n'):
            line = line.strip()
            if line and line.startswith('•'):
                recommendations.append(line[1:].strip())
        
        # From alerts
        if alerts:
            recommendations.insert(0, f"Address {len(alerts)} critical alert(s) immediately")
        
        return recommendations if recommendations else ["No recommendations at this time"]
    
    def _build_detailed_analysis(self, cost_summary, log_summary, 
                                 cost_insights, log_insights):
        """Build detailed analysis for advanced view"""
        
        return {
            "cost_breakdown": {
                "by_service": cost_summary.get('service_totals', {}),
                "trends": cost_summary.get('trends', 'Not available'),
                "date_range": cost_summary.get('date_range', {})
            },
            "log_patterns": {
                "top_issues": log_summary.get('top_issues', 'None detected'),
                "error_distribution": {
                    "errors": log_summary.get('error_count', 0),
                    "warnings": log_summary.get('warning_count', 0),
                    "info": log_summary.get('info_count', 0)
                }
            },
            "ai_insights": {
                "cost_key_phrases": [
                    kp.get('Text', '') 
                    for kp in cost_insights.get('key_phrases', [])[:5]
                ],
                "cost_sentiment": cost_insights.get('sentiment', {}).get('Sentiment', 'NEUTRAL'),
                "log_key_phrases": [
                    kp.get('Text', '') 
                    for kp in log_insights.get('key_phrases', [])[:5]
                ],
                "log_sentiment": log_insights.get('sentiment', {}).get('Sentiment', 'NEUTRAL'),
                "entities_detected": [
                    {
                        "text": e.get('Text', ''),
                        "type": e.get('Type', ''),
                        "confidence": round(e.get('Score', 0) * 100, 1)
                    }
                    for e in log_insights.get('entities', [])[:5]
                ]
            }
        }
    
    def _get_data_sources(self):
        """Get list of data sources being analyzed"""
        sources = []
        
        # Cost sources
        cost_sources = self.config.get('cost_analysis.data_sources', [])
        sources.extend([f"Cost: {s}" for s in cost_sources])
        
        # Log sources
        log_sources = self.config.get_log_sources()
        for source in log_sources:
            path = source.get('path', 'unknown')
            source_type = source.get('type', 'log')
            sources.append(f"Log ({source_type}): {path}")
        
        return sources
    
    def save_json(self, data, filename):
        """Save JSON data to file"""
        with open(filename, 'w') as f:
            json.dump(data, indent=2, fp=f)
        print(f"[INFO] Saved JSON report: {filename}")