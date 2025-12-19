#!/usr/bin/env python3
"""
Cloud Insight AI - Main Orchestrator (Updated for JSON output)
Coordinates cost analysis, log analysis, report generation, and notifications
"""

import json
import os
import sys
from datetime import datetime
import boto3
from cost_processor import CostProcessor
from log_processor import LogProcessor
from comprehend_client import ComprehendClient
from config_loader import ConfigLoader
from notification_handler import NotificationHandler
from json_report_generator import JSONReportGenerator


class CloudInsightAnalyzer:
    """Main orchestrator for Cloud Insight AI analysis"""
    
    def __init__(self):
        self.s3_bucket = os.environ.get('S3_BUCKET')
        self.region = os.environ.get('AWS_DEFAULT_REGION', 'us-east-1')
        
        if not self.s3_bucket:
            raise ValueError("S3_BUCKET environment variable is required")
        
        # Load configuration
        self.config = ConfigLoader()
        
        # Initialize components
        self.cost_processor = CostProcessor()
        self.log_processor = LogProcessor(self.config)
        self.comprehend_client = ComprehendClient(region=self.region)
        self.s3_client = boto3.client('s3', region_name=self.region)
        self.notification_handler = NotificationHandler(self.config, region=self.region)
        self.json_generator = JSONReportGenerator(self.config)
        
        print(f"[INFO] Cloud Insight AI initialized")
        print(f"[INFO] S3 Bucket: {self.s3_bucket}")
        print(f"[INFO] Region: {self.region}")
    
    def run_analysis(self):
        """Execute the complete analysis workflow"""
        try:
            print("\n" + "="*60)
            print("CLOUD INSIGHT AI - ANALYSIS STARTING")
            print("="*60 + "\n")
            
            alerts = []  # Track alerts for notifications
            
            # Step 1: Process cost data
            print("[STEP 1] Analyzing cost data...")
            cost_summary = self.cost_processor.analyze()
            cost_alerts = self._check_cost_alerts(cost_summary)
            alerts.extend(cost_alerts)
            print(f"[SUCCESS] Cost analysis complete ({len(cost_alerts)} alerts)")
            
            # Step 2: Process log data (multiple sources)
            print("\n[STEP 2] Analyzing log data...")
            log_summary = self.log_processor.analyze()
            log_alerts = self._check_log_alerts(log_summary)
            alerts.extend(log_alerts)
            print(f"[SUCCESS] Log analysis complete ({len(log_alerts)} alerts)")
            
            # Step 3: Enhance with AWS Comprehend (if enabled)
            if self.config.is_comprehend_enabled():
                print("\n[STEP 3] Enhancing insights with AWS Comprehend...")
                enhanced_cost_insights = self.comprehend_client.analyze_text(
                    cost_summary['text_summary']
                )
                enhanced_log_insights = self.comprehend_client.analyze_text(
                    log_summary['text_summary']
                )
                print(f"[SUCCESS] AI enhancement complete")
            else:
                print("\n[STEP 3] Comprehend disabled - skipping AI enhancement")
                enhanced_cost_insights = {'key_phrases': [], 'sentiment': {}, 'entities': []}
                enhanced_log_insights = {'key_phrases': [], 'sentiment': {}, 'entities': []}
            
            # Step 4: Generate TXT report (traditional)
            print("\n[STEP 4] Generating text report...")
            report_content = self.generate_report(
                cost_summary,
                log_summary,
                enhanced_cost_insights,
                enhanced_log_insights,
                alerts
            )
            
            report_filename = 'final_report.txt'
            with open(report_filename, 'w') as f:
                f.write(report_content)
            print(f"[SUCCESS] Text report saved: {report_filename}")
            
            # Step 5: Generate JSON reports for dashboard
            print("\n[STEP 5] Generating JSON reports for dashboard...")
            
            # Generate final_report.json
            report_json = self.json_generator.generate_report_json(
                cost_summary,
                log_summary,
                enhanced_cost_insights,
                enhanced_log_insights,
                alerts
            )
            self.json_generator.save_json(report_json, 'final_report.json')
            
            # Generate config.json
            config_json = self.json_generator.generate_config_json()
            self.json_generator.save_json(config_json, 'config.json')
            
            print(f"[SUCCESS] JSON reports generated")
            
            # Step 6: Upload to S3
            print(f"\n[STEP 6] Uploading reports to S3...")
            self.upload_to_s3(report_filename, report_content, 'text/plain')
            self.upload_json_to_s3('final_report.json')
            self.upload_json_to_s3('config.json')
            print(f"[SUCCESS] All reports uploaded to S3")
            
            # Step 7: Send notifications
            if self.config.is_notifications_enabled():
                print(f"\n[STEP 7] Sending notifications...")
                self.notification_handler.send_notifications(report_content, alerts)
                print(f"[SUCCESS] Notifications sent")
            else:
                print(f"\n[STEP 7] Notifications disabled - skipping")
            
            print("\n" + "="*60)
            print(f"ANALYSIS COMPLETE - {len(alerts)} ALERT(S) DETECTED")
            print("="*60 + "\n")
            
            print(f"📊 Dashboard JSON: s3://{self.s3_bucket}/final_report.json")
            print(f"📄 Text Report: s3://{self.s3_bucket}/final_report.txt")
            print(f"⚙️  Config JSON: s3://{self.s3_bucket}/config.json")
            
            return True
            
        except Exception as e:
            print(f"\n[ERROR] Analysis failed: {str(e)}")
            import traceback
            traceback.print_exc()
            return False
    
    def _check_cost_alerts(self, cost_summary):
        """Check for cost-related alerts"""
        alerts = []
        
        service_totals = cost_summary.get('service_totals', {})
        total_cost = sum(service_totals.values())
        
        threshold = self.config.get_cost_threshold('cost_increase_alert_percent')
        high_cost_threshold = self.config.get_cost_threshold('high_cost_service_percent')
        
        # Check for high-cost services
        for service, cost in service_totals.items():
            percentage = (cost / total_cost * 100) if total_cost > 0 else 0
            if percentage > high_cost_threshold:
                alerts.append({
                    'severity': 'high',
                    'category': 'cost',
                    'message': f"{service} accounts for {percentage:.1f}% of total costs (${cost:.2f})"
                })
        
        return alerts
    
    def _check_log_alerts(self, log_summary):
        """Check for log-related alerts"""
        alerts = []
        
        error_count = log_summary.get('error_count', 0)
        warning_count = log_summary.get('warning_count', 0)
        error_rate = log_summary.get('error_percentage', 0)
        
        max_errors = self.config.get_log_threshold('max_error_count')
        max_warnings = self.config.get_log_threshold('max_warning_count')
        max_error_rate = self.config.get_log_threshold('max_error_rate_percent')
        
        if error_count > max_errors:
            alerts.append({
                'severity': 'critical',
                'category': 'logs',
                'message': f"{error_count} errors detected (threshold: {max_errors})"
            })
        
        if warning_count > max_warnings:
            alerts.append({
                'severity': 'medium',
                'category': 'logs',
                'message': f"{warning_count} warnings detected (threshold: {max_warnings})"
            })
        
        if error_rate > max_error_rate:
            alerts.append({
                'severity': 'high',
                'category': 'logs',
                'message': f"Error rate at {error_rate:.1f}% (threshold: {max_error_rate}%)"
            })
        
        return alerts
    
    def generate_report(self, cost_summary, log_summary, 
                       cost_insights, log_insights, alerts):
        """Generate the final comprehensive text report"""
        
        timestamp = datetime.utcnow().strftime('%Y-%m-%d %H:%M:%S UTC')
        
        # Alert summary section
        alert_section = ""
        if alerts:
            alert_section = f"""
{'='*80}
⚠️  ALERT SUMMARY - {len(alerts)} ALERT(S) DETECTED
{'='*80}

"""
            for alert in alerts:
                alert_section += f"  [{alert['severity'].upper()}] {alert['message']}\n"
            alert_section += "\n"
        
        report = f"""
{'='*80}
CLOUD INSIGHT AI - COMPREHENSIVE ANALYSIS REPORT
{'='*80}

Generated: {timestamp}
Report ID: {datetime.utcnow().strftime('%Y%m%d-%H%M%S')}

{alert_section}
{'='*80}
SECTION 1: COST ANALYSIS
{'='*80}

Total Services Analyzed: {cost_summary['total_services']}
Date Range: {cost_summary['date_range']['start']} to {cost_summary['date_range']['end']}

--- Cost Summary by Service ---
{cost_summary['service_breakdown']}

--- Cost Trends ---
{cost_summary['trends']}

--- AI-Powered Cost Insights (AWS Comprehend) ---

Key Phrases Detected:
{self._format_key_phrases(cost_insights.get('key_phrases', []))}

Sentiment Analysis:
{self._format_sentiment(cost_insights.get('sentiment', {}))}

{'-'*80}

{'='*80}
SECTION 2: LOG ANALYSIS
{'='*80}

Total Log Entries: {log_summary['total_entries']}
Error Count: {log_summary['error_count']}
Warning Count: {log_summary['warning_count']}
Info Count: {log_summary['info_count']}

--- Error Severity Distribution ---
Errors: {log_summary['error_count']} ({log_summary['error_percentage']:.1f}%)
Warnings: {log_summary['warning_count']} ({log_summary['warning_percentage']:.1f}%)
Info: {log_summary['info_count']} ({log_summary['info_percentage']:.1f}%)

--- Top Issues ---
{log_summary['top_issues']}

--- AI-Powered Log Insights (AWS Comprehend) ---

Key Phrases Detected:
{self._format_key_phrases(log_insights.get('key_phrases', []))}

Sentiment Analysis:
{self._format_sentiment(log_insights.get('sentiment', {}))}

Entities Detected:
{self._format_entities(log_insights.get('entities', []))}

{'-'*80}

{'='*80}
SECTION 3: RECOMMENDATIONS
{'='*80}

Based on the analysis, here are the recommended actions:

Cost Optimization:
{cost_summary['recommendations']}

Operational Improvements:
{log_summary['recommendations']}

{'='*80}
END OF REPORT
{'='*80}

This report was generated automatically by Cloud Insight AI.
Dashboard: Available at your S3 static website
JSON Data: final_report.json, config.json
"""
        return report
    
    def _format_key_phrases(self, key_phrases):
        """Format key phrases from Comprehend"""
        if not key_phrases:
            return "  No key phrases detected"
        
        formatted = []
        for phrase in key_phrases[:10]:
            score = phrase.get('Score', 0) * 100
            text = phrase.get('Text', 'Unknown')
            formatted.append(f"  • {text} (confidence: {score:.1f}%)")
        
        return "\n".join(formatted)
    
    def _format_sentiment(self, sentiment):
        """Format sentiment analysis from Comprehend"""
        if not sentiment:
            return "  No sentiment analysis available"
        
        overall = sentiment.get('Sentiment', 'NEUTRAL')
        scores = sentiment.get('SentimentScore', {})
        
        return f"""  Overall: {overall}
  Positive: {scores.get('Positive', 0)*100:.1f}%
  Negative: {scores.get('Negative', 0)*100:.1f}%
  Neutral: {scores.get('Neutral', 0)*100:.1f}%
  Mixed: {scores.get('Mixed', 0)*100:.1f}%"""
    
    def _format_entities(self, entities):
        """Format entities from Comprehend"""
        if not entities:
            return "  No entities detected"
        
        formatted = []
        for entity in entities[:10]:
            score = entity.get('Score', 0) * 100
            text = entity.get('Text', 'Unknown')
            entity_type = entity.get('Type', 'UNKNOWN')
            formatted.append(f"  • {text} ({entity_type}, confidence: {score:.1f}%)")
        
        return "\n".join(formatted)
    
    def upload_to_s3(self, filename, content, content_type):
        """Upload text report to S3 bucket"""
        try:
            self.s3_client.put_object(
                Bucket=self.s3_bucket,
                Key=filename,
                Body=content.encode('utf-8'),
                ContentType=content_type
            )
            print(f"[INFO] Uploaded {filename} to S3")
        except Exception as e:
            print(f"[ERROR] S3 upload failed for {filename}: {str(e)}")
            raise
    
    def upload_json_to_s3(self, filename):
        """Upload JSON file to S3 WITHOUT ACL (bucket doesn't support it)"""
        try:
            with open(filename, 'r') as f:
                content = f.read()
            
            self.s3_client.put_object(
                Bucket=self.s3_bucket,
                Key=filename,
                Body=content,
                ContentType='application/json',
                # REMOVED: ACL='public-read' - bucket doesn't support ACLs
                CacheControl='no-cache, no-store, must-revalidate'
            )
            print(f"[INFO] Uploaded {filename} to S3")
        except Exception as e:
            print(f"[ERROR] S3 upload failed for {filename}: {str(e)}")
            raise


def main():
    """Main entry point"""
    try:
        analyzer = CloudInsightAnalyzer()
        success = analyzer.run_analysis()
        sys.exit(0 if success else 1)
    except Exception as e:
        print(f"[FATAL] Application error: {str(e)}")
        sys.exit(1)


if __name__ == '__main__':
    main()