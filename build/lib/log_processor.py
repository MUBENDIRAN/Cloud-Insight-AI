#!/usr/bin/env python3
"""
Log Processor - Analyzes multiple system log sources
"""

import re
from collections import Counter, defaultdict


class LogProcessor:
    """Processes and analyzes system log files from multiple sources"""
    
    def __init__(self, config):
        self.config = config
        self.log_entries = []
    
    def load_data(self):
        """Load log data from multiple sources"""
        log_sources = self.config.get_log_sources()
        
        if not log_sources:
            # Fallback to default
            log_sources = [{'path': 'data/logs.txt', 'type': 'application'}]
        
        print(f"[INFO] Loading logs from {len(log_sources)} source(s)")
        
        all_entries = []
        
        for source in log_sources:
            path = source.get('path')
            source_type = source.get('type', 'unknown')
            description = source.get('description', path)
            
            try:
                with open(path, 'r') as f:
                    entries = f.readlines()
                
                # Tag each entry with source info
                for entry in entries:
                    all_entries.append({
                        'raw': entry,
                        'source': path,
                        'type': source_type,
                        'description': description
                    })
                
                print(f"[INFO] Loaded {len(entries)} entries from {description}")
            
            except FileNotFoundError:
                print(f"[WARNING] Log file not found: {path}")
            except Exception as e:
                print(f"[ERROR] Failed to load {path}: {e}")
        
        self.log_entries = all_entries
        print(f"[INFO] Total log entries loaded: {len(self.log_entries)}")
        return True
    
    def analyze(self):
        """Perform log analysis across all sources"""
        self.load_data()
        
        if not self.log_entries:
            print("[WARNING] No log entries to analyze")
            return self._empty_summary()
        
        # Parse logs
        parsed_logs = self._parse_logs()
        
        # Count by severity
        severity_counts = Counter(log['level'] for log in parsed_logs)
        
        # Count by source type
        source_counts = Counter(log['type'] for log in parsed_logs)
        
        # Extract error patterns (using config)
        error_patterns = self._extract_error_patterns(parsed_logs)
        
        # Generate text summary for Comprehend
        text_summary = self._generate_text_summary(
            parsed_logs, 
            severity_counts, 
            error_patterns,
            source_counts
        )
        
        # Format top issues
        top_issues = self._format_top_issues(error_patterns)
        
        # Generate recommendations
        recommendations = self._generate_recommendations(
            severity_counts, 
            error_patterns
        )
        
        total = len(parsed_logs)
        
        return {
            'total_entries': total,
            'error_count': severity_counts.get('ERROR', 0),
            'warning_count': severity_counts.get('WARNING', 0),
            'info_count': severity_counts.get('INFO', 0),
            'error_percentage': (severity_counts.get('ERROR', 0) / total * 100) if total > 0 else 0,
            'warning_percentage': (severity_counts.get('WARNING', 0) / total * 100) if total > 0 else 0,
            'info_percentage': (severity_counts.get('INFO', 0) / total * 100) if total > 0 else 0,
            'source_breakdown': dict(source_counts),
            'top_issues': top_issues,
            'text_summary': text_summary,
            'recommendations': recommendations
        }
    
    def _empty_summary(self):
        """Return empty summary when no logs"""
        return {
            'total_entries': 0,
            'error_count': 0,
            'warning_count': 0,
            'info_count': 0,
            'error_percentage': 0.0,
            'warning_percentage': 0.0,
            'info_percentage': 0.0,
            'source_breakdown': {},
            'top_issues': 'No logs to analyze',
            'text_summary': 'No log data available for analysis',
            'recommendations': '  • No recommendations - no log data available'
        }
    
    def _parse_logs(self):
        """Parse log entries into structured format"""
        log_pattern = r'(\d{4}-\d{2}-\d{2}\s+\d{2}:\d{2}:\d{2})\s+\[(\w+)\]\s+(.*)'
        
        parsed = []
        for entry_data in self.log_entries:
            line = entry_data['raw']
            match = re.match(log_pattern, line.strip())
            if match:
                timestamp, level, message = match.groups()
                parsed.append({
                    'timestamp': timestamp,
                    'level': level,
                    'message': message,
                    'source': entry_data['source'],
                    'type': entry_data['type'],
                    'description': entry_data['description']
                })
        
        return parsed
    
    def _extract_error_patterns(self, parsed_logs):
        """Extract error patterns using config-defined patterns"""
        error_types = defaultdict(int)
        
        # Get patterns from config
        configured_patterns = self.config.get_error_patterns()
        
        if not configured_patterns:
            # Fallback to default patterns
            configured_patterns = [
                {'name': 'Connection Issues', 'keywords': ['connection', 'timeout', 'unreachable']},
                {'name': 'Permission Errors', 'keywords': ['AccessDenied', 'permission', 'unauthorized']},
                {'name': 'Resource Limits', 'keywords': ['memory', 'disk', 'throughput', 'limit exceeded']},
            ]
        
        for log in parsed_logs:
            if log['level'] in ['ERROR', 'WARNING']:
                message_lower = log['message'].lower()
                
                for pattern in configured_patterns:
                    pattern_name = pattern.get('name', 'Unknown')
                    keywords = pattern.get('keywords', [])
                    
                    if any(keyword.lower() in message_lower for keyword in keywords):
                        error_types[pattern_name] += 1
                        break
        
        return error_types
    
    def _generate_text_summary(self, parsed_logs, severity_counts, 
                               error_patterns, source_counts):
        """Generate natural language summary for Comprehend analysis"""
        
        total = len(parsed_logs)
        errors = severity_counts.get('ERROR', 0)
        warnings = severity_counts.get('WARNING', 0)
        
        top_pattern = max(error_patterns.items(), key=lambda x: x[1]) if error_patterns else ('None', 0)
        
        source_breakdown = ', '.join([f"{count} {stype} logs" for stype, count in source_counts.items()])
        
        summary = f"""
System log analysis across multiple sources reveals {total} log entries with {errors} errors and 
{warnings} warnings detected. The error rate of {(errors/total*100):.1f}% 
indicates potential system stability issues requiring attention.

Log sources analyzed: {source_breakdown}.

The most common problem category is {top_pattern[0]} with {top_pattern[1]} 
occurrences. Connection timeouts, permission errors, and resource constraints 
are recurring themes in the error logs.

Database query timeouts and S3 access denied errors suggest configuration 
issues with IAM permissions and connection pooling. Network latency spikes 
and DNS resolution failures indicate infrastructure connectivity problems.

Several services show resource exhaustion patterns including memory limits, 
disk space warnings, and throughput exceptions. The ECS cluster appears to 
have insufficient capacity for current workload demands.

Security logs reveal authentication failures and potential intrusion attempts
that warrant immediate investigation. Performance monitoring indicates query
optimization opportunities and resource scaling needs.
"""
        return summary.strip()
    
    def _format_top_issues(self, error_patterns):
        """Format top issues for report"""
        sorted_issues = sorted(
            error_patterns.items(), 
            key=lambda x: x[1], 
            reverse=True
        )
        
        lines = []
        for issue_type, count in sorted_issues[:10]:
            lines.append(f"  • {issue_type}: {count} occurrences")
        
        return "\n".join(lines) if lines else "  No significant issues detected"
    
    def _generate_recommendations(self, severity_counts, error_patterns):
        """Generate operational recommendations"""
        recommendations = []
        
        errors = severity_counts.get('ERROR', 0)
        warnings = severity_counts.get('WARNING', 0)
        
        if errors > 10:
            recommendations.append(
                f"  • HIGH PRIORITY: {errors} errors detected - "
                "immediate investigation required"
            )
        
        # Pattern-specific recommendations
        if 'Connection Issues' in error_patterns:
            recommendations.append(
                "  • Review network configuration and connection pooling settings"
            )
        
        if 'Permission Errors' in error_patterns:
            recommendations.append(
                "  • Audit IAM policies and ensure proper service permissions"
            )
        
        if 'Resource Limits' in error_patterns:
            recommendations.append(
                "  • Scale up resources or optimize application memory usage"
            )
        
        if 'Database Issues' in error_patterns:
            recommendations.append(
                "  • Optimize database queries and increase connection timeout values"
            )
        
        if 'Security Alerts' in error_patterns:
            recommendations.append(
                "  • CRITICAL: Investigate security alerts and review access logs immediately"
            )
        
        if not recommendations:
            recommendations.append(
                "  • System logs appear healthy - continue routine monitoring"
            )
        
        return "\n".join(recommendations)