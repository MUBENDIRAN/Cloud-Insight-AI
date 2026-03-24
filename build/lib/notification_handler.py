#!/usr/bin/env python3
"""
Notification Handler - Sends reports via email (SES) or Slack
"""

import boto3
from botocore.exceptions import ClientError
from datetime import datetime
import json


class NotificationHandler:
    """Handles sending notifications via various channels"""
    
    def __init__(self, config, region='us-east-1'):
        self.config = config
        self.region = region
        self.ses_client = boto3.client('ses', region_name=region)
        
        print(f"[INFO] Notification handler initialized")
    
    def send_notifications(self, report_content: str, alerts: list):
        """Send notifications via configured channels"""
        if not self.config.is_notifications_enabled():
            print("[INFO] Notifications disabled in config")
            return
        
        notify_only_alerts = self.config.get('notifications.notify_only_on_alerts', False)
        
        # Check if we should notify
        if notify_only_alerts and not alerts:
            print("[INFO] No alerts detected - skipping notification")
            return
        
        # Send email notification
        if self.config.get('notifications.email.enabled', False):
            self._send_email(report_content, alerts)
        
        # Send Slack notification  
        if self.config.get('notifications.slack.enabled', False):
            self._send_slack(report_content, alerts)
    
    def _send_email(self, report_content: str, alerts: list):
        """Send email via AWS SES"""
        try:
            sender = self.config.get('notifications.email.sender')
            recipients = self.config.get('notifications.email.recipients', [])
            subject_prefix = self.config.get('notifications.email.subject_prefix', '[Cloud Insight AI]')
            include_full = self.config.get('notifications.email.include_full_report', True)
            
            if not sender or not recipients:
                print("[WARNING] Email sender or recipients not configured")
                return
            
            # Generate email subject
            alert_suffix = f" - {len(alerts)} ALERTS" if alerts else " - All Clear"
            subject = f"{subject_prefix} Daily Report {datetime.utcnow().strftime('%Y-%m-%d')}{alert_suffix}"
            
            # Generate email body
            body_text = self._generate_email_body(report_content, alerts, include_full)
            body_html = self._generate_email_html(report_content, alerts, include_full)
            
            # Send email
            response = self.ses_client.send_email(
                Source=sender,
                Destination={
                    'ToAddresses': recipients
                },
                Message={
                    'Subject': {
                        'Data': subject,
                        'Charset': 'UTF-8'
                    },
                    'Body': {
                        'Text': {
                            'Data': body_text,
                            'Charset': 'UTF-8'
                        },
                        'Html': {
                            'Data': body_html,
                            'Charset': 'UTF-8'
                        }
                    }
                }
            )
            
            print(f"[SUCCESS] Email sent to {len(recipients)} recipient(s)")
            print(f"[INFO] SES Message ID: {response['MessageId']}")
            
        except ClientError as e:
            error_code = e.response['Error']['Code']
            if error_code == 'MessageRejected':
                print(f"[ERROR] Email rejected: {e.response['Error']['Message']}")
                print("[INFO] Ensure sender email is verified in SES")
            else:
                print(f"[ERROR] Failed to send email: {e}")
        except Exception as e:
            print(f"[ERROR] Email notification failed: {e}")
    
    def _generate_email_body(self, report: str, alerts: list, include_full: bool) -> str:
        """Generate plain text email body"""
        body = f"""
Cloud Insight AI - Daily Report
Generated: {datetime.utcnow().strftime('%Y-%m-%d %H:%M:%S UTC')}

{'='*60}
ALERT SUMMARY
{'='*60}

"""
        
        if alerts:
            body += f"⚠️  {len(alerts)} ALERT(S) DETECTED\n\n"
            for alert in alerts:
                body += f"• {alert['severity'].upper()}: {alert['message']}\n"
        else:
            body += "✅ No alerts detected - all systems operating normally\n"
        
        body += "\n"
        
        if include_full:
            body += f"""
{'='*60}
FULL REPORT
{'='*60}

{report}
"""
        else:
            body += "\nFull report available in S3 bucket.\n"
        
        body += f"""

---
This is an automated report from Cloud Insight AI.
To modify notification settings, update config.yaml
"""
        
        return body
    
    def _generate_email_html(self, report: str, alerts: list, include_full: bool) -> str:
        """Generate HTML email body"""
        alert_section = ""
        
        if alerts:
            alert_rows = ""
            for alert in alerts:
                severity_color = {
                    'critical': '#dc2626',
                    'high': '#ea580c',
                    'medium': '#ca8a04',
                    'low': '#65a30d'
                }.get(alert['severity'], '#6b7280')
                
                alert_rows += f"""
                <tr>
                    <td style="padding: 8px; border: 1px solid #e5e7eb;">
                        <span style="color: {severity_color}; font-weight: bold;">
                            {alert['severity'].upper()}
                        </span>
                    </td>
                    <td style="padding: 8px; border: 1px solid #e5e7eb;">
                        {alert['message']}
                    </td>
                </tr>
                """
            
            alert_section = f"""
            <h2 style="color: #dc2626;">⚠️ {len(alerts)} Alert(s) Detected</h2>
            <table style="width: 100%; border-collapse: collapse; margin: 20px 0;">
                <thead>
                    <tr style="background-color: #f3f4f6;">
                        <th style="padding: 8px; border: 1px solid #e5e7eb; text-align: left;">Severity</th>
                        <th style="padding: 8px; border: 1px solid #e5e7eb; text-align: left;">Alert</th>
                    </tr>
                </thead>
                <tbody>
                    {alert_rows}
                </tbody>
            </table>
            """
        else:
            alert_section = """
            <h2 style="color: #16a34a;">✅ All Clear</h2>
            <p>No alerts detected - all systems operating normally.</p>
            """
        
        report_section = ""
        if include_full:
            report_section = f"""
            <h2>Full Report</h2>
            <pre style="background-color: #f9fafb; padding: 15px; border: 1px solid #e5e7eb; overflow-x: auto;">
{report}
            </pre>
            """
        
        html = f"""
<!DOCTYPE html>
<html>
<head>
    <meta charset="UTF-8">
    <title>Cloud Insight AI Report</title>
</head>
<body style="font-family: Arial, sans-serif; line-height: 1.6; color: #374151; max-width: 800px; margin: 0 auto; padding: 20px;">
    <div style="background-color: #1e40af; color: white; padding: 20px; border-radius: 8px; margin-bottom: 20px;">
        <h1 style="margin: 0;">Cloud Insight AI</h1>
        <p style="margin: 5px 0 0 0;">Daily Cloud Health Report</p>
        <p style="margin: 5px 0 0 0; font-size: 14px; opacity: 0.9;">
            Generated: {datetime.utcnow().strftime('%Y-%m-%d %H:%M:%S UTC')}
        </p>
    </div>
    
    {alert_section}
    
    {report_section}
    
    <div style="margin-top: 30px; padding-top: 20px; border-top: 1px solid #e5e7eb; color: #6b7280; font-size: 14px;">
        <p>This is an automated report from Cloud Insight AI.</p>
        <p>To modify notification settings, update config.yaml</p>
    </div>
</body>
</html>
        """
        
        return html
    
    def _send_slack(self, report: str, alerts: list):
        """Send notification to Slack via webhook"""
        try:
            import requests
            
            webhook_url = self.config.get('notifications.slack.webhook_url')
            
            if not webhook_url:
                print("[WARNING] Slack webhook URL not configured")
                return
            
            # Generate Slack message
            alert_text = f"*{len(alerts)} ALERT(S)*" if alerts else "*All Clear* ✅"
            
            blocks = [
                {
                    "type": "header",
                    "text": {
                        "type": "plain_text",
                        "text": f"Cloud Insight AI Report - {datetime.utcnow().strftime('%Y-%m-%d')}"
                    }
                },
                {
                    "type": "section",
                    "text": {
                        "type": "mrkdwn",
                        "text": f"{alert_text}\n\nGenerated: {datetime.utcnow().strftime('%Y-%m-%d %H:%M:%S UTC')}"
                    }
                }
            ]
            
            if alerts:
                alert_text = "\n".join([f"• *{a['severity'].upper()}*: {a['message']}" for a in alerts[:5]])
                blocks.append({
                    "type": "section",
                    "text": {
                        "type": "mrkdwn",
                        "text": f"*Top Alerts:*\n{alert_text}"
                    }
                })
            
            payload = {"blocks": blocks}
            
            response = requests.post(webhook_url, json=payload)
            response.raise_for_status()
            
            print("[SUCCESS] Slack notification sent")
            
        except Exception as e:
            print(f"[ERROR] Slack notification failed: {e}")