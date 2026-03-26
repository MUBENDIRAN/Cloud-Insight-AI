#!/usr/bin/env python3
"""
Cloud Insight AI - AWS Cloud Analytics & Intelligence Platform

Author: MUBENDIRAN
Email: mubiii7722@gmail.com
GitHub: https://github.com/MUBENDIRAN/Cloud-Insight-AI
"""

__version__ = "1.0.0"
__author__ = "MUBENDIRAN"
__email__ = "mubiii7722@gmail.com"

try:
    from .core import CloudAnalyzer
    from .cost_processor import analyze_cost
    from .log_processor import analyze_logs
    from . import providers
    
    __all__ = [
        "CloudAnalyzer",
        "analyze_cost",
        "analyze_logs",
        "providers",
    ]
except ImportError as e:
    # If imports fail, provide basic exports
    print(f"Warning: Some imports failed - {e}")
    __all__ = []
