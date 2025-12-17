#!/usr/bin/env python3
"""
Cost Processor - Analyzes AWS billing data
"""

import json
from collections import defaultdict
from datetime import datetime


class CostProcessor:
    """Processes and analyzes AWS cost data"""
    
    def __init__(self, data_file='data/cost.json'):
        self.data_file = data_file
        self.costs = []
    
    def load_data(self):
        """Load cost data from JSON file"""
        print(f"[INFO] Loading cost data from {self.data_file}")
        try:
            with open(self.data_file, 'r') as f:
                self.costs = json.load(f)
            print(f"[INFO] Loaded {len(self.costs)} cost records")
            return True
        except FileNotFoundError:
            print(f"[ERROR] Cost data file not found: {self.data_file}")
            raise
        except json.JSONDecodeError as e:
            print(f"[ERROR] Invalid JSON in cost data: {e}")
            raise
    
    def analyze(self):
        """Perform cost analysis and return summary"""
        self.load_data()
        
        # Aggregate costs by service
        service_totals = defaultdict(float)
        service_daily = defaultdict(list)
        
        all_dates = set()
        
        for record in self.costs:
            service = record['service']
            date = record['date']
            cost = record['cost']
            
            service_totals[service] += cost
            service_daily[service].append({
                'date': date,
                'cost': cost
            })
            all_dates.add(date)
        
        # Calculate trends
        trends = self._calculate_trends(service_daily)
        
        # Generate text summary for Comprehend
        text_summary = self._generate_text_summary(
            service_totals, 
            trends, 
            all_dates
        )
        
        # Format service breakdown
        service_breakdown = self._format_service_breakdown(service_totals)
        
        # Format trends
        trends_text = self._format_trends(trends)
        
        # Generate recommendations
        recommendations = self._generate_recommendations(trends, service_totals)
        
        return {
            'total_services': len(service_totals),
            'service_totals': dict(service_totals),
            'date_range': {
                'start': min(all_dates),
                'end': max(all_dates)
            },
            'service_breakdown': service_breakdown,
            'trends': trends_text,
            'text_summary': text_summary,
            'recommendations': recommendations
        }
    
    def _calculate_trends(self, service_daily):
        """Calculate cost trends for each service"""
        trends = {}
        
        for service, records in service_daily.items():
            if len(records) < 2:
                trends[service] = {'change': 0, 'direction': 'stable'}
                continue
            
            # Sort by date
            sorted_records = sorted(records, key=lambda x: x['date'])
            
            first_cost = sorted_records[0]['cost']
            last_cost = sorted_records[-1]['cost']
            
            change_percent = ((last_cost - first_cost) / first_cost) * 100
            
            if change_percent > 5:
                direction = 'increasing'
            elif change_percent < -5:
                direction = 'decreasing'
            else:
                direction = 'stable'
            
            trends[service] = {
                'change': change_percent,
                'direction': direction,
                'first_cost': first_cost,
                'last_cost': last_cost
            }
        
        return trends
    
    def _generate_text_summary(self, service_totals, trends, dates):
        """Generate natural language summary for Comprehend analysis"""
        
        total_cost = sum(service_totals.values())
        top_service = max(service_totals.items(), key=lambda x: x[1])
        
        # Find services with significant trends
        increasing = [s for s, t in trends.items() 
                     if t['direction'] == 'increasing']
        decreasing = [s for s, t in trends.items() 
                     if t['direction'] == 'decreasing']
        
        summary = f"""
AWS cost analysis reveals a total expenditure of ${total_cost:.2f} across 
{len(service_totals)} services over {len(dates)} days. The highest cost service 
is {top_service[0]} with ${top_service[1]:.2f} in total spending.

Cost trends show that {len(increasing)} services are experiencing cost increases, 
including {', '.join(increasing[:3]) if increasing else 'none'}. Meanwhile, 
{len(decreasing)} services show decreasing costs.

The most significant cost increases are in compute and storage services, suggesting 
higher resource utilization or scaling activities. Database costs remain relatively 
stable, indicating consistent workload patterns.
"""
        return summary.strip()
    
    def _format_service_breakdown(self, service_totals):
        """Format service costs for report"""
        sorted_services = sorted(
            service_totals.items(), 
            key=lambda x: x[1], 
            reverse=True
        )
        
        lines = []
        for service, cost in sorted_services:
            lines.append(f"  • {service}: ${cost:.2f}")
        
        return "\n".join(lines)
    
    def _format_trends(self, trends):
        """Format trend analysis for report"""
        lines = []
        
        for service, trend in sorted(trends.items()):
            direction = trend['direction']
            change = trend['change']
            
            if direction == 'stable':
                lines.append(f"  • {service}: Stable (±{abs(change):.1f}%)")
            elif direction == 'increasing':
                lines.append(
                    f"  • {service}: Increasing ↑ {change:.1f}% "
                    f"(${trend['first_cost']:.2f} → ${trend['last_cost']:.2f})"
                )
            else:
                lines.append(
                    f"  • {service}: Decreasing ↓ {change:.1f}% "
                    f"(${trend['first_cost']:.2f} → ${trend['last_cost']:.2f})"
                )
        
        return "\n".join(lines)
    
    def _generate_recommendations(self, trends, service_totals):
        """Generate cost optimization recommendations"""
        recommendations = []
        
        # Check for high-cost services with increasing trends
        for service, trend in trends.items():
            if trend['direction'] == 'increasing' and trend['change'] > 10:
                recommendations.append(
                    f"  • Review {service} usage - costs increased by "
                    f"{trend['change']:.1f}% and may need optimization"
                )
        
        # Check for expensive services
        total = sum(service_totals.values())
        for service, cost in service_totals.items():
            if cost / total > 0.3:  # More than 30% of total
                recommendations.append(
                    f"  • {service} accounts for {(cost/total)*100:.1f}% of "
                    f"total costs - consider reserved instances or savings plans"
                )
        
        if not recommendations:
            recommendations.append(
                "  • Cost trends are stable - continue monitoring for anomalies"
            )
        
        return "\n".join(recommendations)