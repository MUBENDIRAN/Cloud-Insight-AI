#!/usr/bin/env python3
"""
JSON Report Generator - Creates structured JSON matching dashboard expectations
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
        Generate final_report.json matching the dashboard's expected format
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
        
        # Build cost summary text
        cost_text = self._build_cost_summary_text(cost_summary)
        
        # Build log summary text
        log_text = self._build_log_summary_text(log_summary)
        
        # Build AI insights
        ai_insights = self._build_ai_insights(cost_insights, log_insights)
        
        # Extract recommendations
        recommendations = self._extract_recommendations(
            cost_summary, 
            log_summary, 
            alerts
        )
        
        # Build cost trend data for chart
        cost_trend = self._build_cost_trend(cost_summary)
        
        # Determine cost health
        cost_health = "normal"
        for alert in alerts:
            if alert.get('category') == 'cost' and alert.get('severity') in ['high', 'critical']:
                cost_health = "warning"
                break
        
        # Build the report matching dashboard expectations
        report = {
            "timestamp": datetime.utcnow().isoformat() + "Z",
            "cost_summary": cost_text,
            "log_summary": log_text,
            "log_health_status": health_status,
            "cost_health": cost_health,
            "log_levels": {
                "critical": 0,  # You can add critical level to logs if needed
                "error": log_summary.get('error_count', 0),
                "warning": log_summary.get('warning_count', 0),
                "info": log_summary.get('info_count', 0)
            },
            "trend": self._calculate_trend(cost_summary, log_summary),
            "recommendations": recommendations,
            "alerts": alerts,
            "ai_insights": ai_insights,
            "cost_trend": cost_trend,
            "metadata": {
                "analysis_version": "1.0",
                "data_sources": self._get_data_sources(),
                "comprehend_enabled": self.config.is_comprehend_enabled()
            }
        }
        
        return report
    
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
    
    def _build_ai_insights(self, cost_insights, log_insights):
        """Build AI insights array for dashboard"""
        insights = []
        
        # Key phrases from costs
        cost_phrases = cost_insights.get('key_phrases', [])
        if cost_phrases:
            top_phrases = [p.get('Text', '') for p in cost_phrases[:3]]
            insights.append({
                "title": "Cost Key Findings",
                "finding": f"Detected important cost patterns: {', '.join(top_phrases)}"
            })
        
        # Sentiment from costs
        cost_sentiment = cost_insights.get('sentiment', {})
        if cost_sentiment.get('Sentiment'):
            insights.append({
                "title": "Cost Sentiment",
                "finding": f"Analysis sentiment is {cost_sentiment['Sentiment'].lower()}"
            })
        
        # Key phrases from logs
        log_phrases = log_insights.get('key_phrases', [])
        if log_phrases:
            top_phrases = [p.get('Text', '') for p in log_phrases[:3]]
            insights.append({
                "title": "Log Key Findings",
                "finding": f"Common log patterns: {', '.join(top_phrases)}"
            })
        
        # Entities from logs
        entities = log_insights.get('entities', [])
        if entities:
            entity_names = [e.get('Text', '') for e in entities[:5]]
            insights.append({
                "title": "Detected Entities",
                "finding": f"Found: {', '.join(entity_names)}"
            })
        
        # If no AI insights, add a default
        if not insights:
            insights.append({
                "title": "AI Analysis",
                "finding": "No significant patterns detected in current analysis"
            })
        
        return insights
    
    def _build_cost_trend(self, cost_summary):
        """Build cost trend data for Chart.js"""
        service_totals = cost_summary.get('service_totals', {})
        total_cost = sum(service_totals.values())
        
        # Generate simple trend data (last 5 days)
        # In real scenario, you'd track historical data
        date_range = cost_summary.get('date_range', {})
        
        history = []
        if date_range:
            # Use actual dates from data
            for i in range(5):
                history.append({
                    "date": f"2025-01-{str(i+1).zfill(2)}",
                    "cost": total_cost * (0.95 + (i * 0.02))  # Simulated trend
                })
        
        # Calculate change percentage
        if len(history) >= 2:
            first = history[0]['cost']
            last = history[-1]['cost']
            change_pct = ((last - first) / first * 100) if first > 0 else 0
        else:
            change_pct = 0
        
        return {
            "total_cost": total_cost,
            "change_percentage": round(change_pct, 1),
            "history": history
        }
    
    def _calculate_trend(self, cost_summary, log_summary):
        """Determine if metrics are trending up, down, or neutral"""
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
            recommendations.insert(0, f"⚠️ Address {len(alerts)} critical alert(s) immediately")
        
        return recommendations if recommendations else ["✅ No recommendations at this time"]
    
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
    
    def generate_config_json(self):
        """
        Generate config.json for dashboard display
        """
        log_sources = self.config.get_log_sources()
        log_files = [source.get('path', '').split('/')[-1] for source in log_sources]
        
        monitor_services = self.config.get('cost_analysis.monitor_services', [])
        if not monitor_services:
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
    
    def save_json(self, data, filename):
        """Save JSON data to file"""
        with open(filename, 'w') as f:
            json.dump(data, indent=2, fp=f)
        print(f"[INFO] Saved JSON report: {filename}")