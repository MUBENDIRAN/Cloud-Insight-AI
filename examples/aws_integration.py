#!/usr/bin/env python3
"""
AWS integration example

Requirements:
- boto3
- AWS credentials configured
"""

from cloud_insight_ai.aws_providers import AWSComprehendProvider, S3StorageProvider


def main():
    # Initialize AWS providers
    comprehend = AWSComprehendProvider(region='us-east-1')
    s3 = S3StorageProvider('my-bucket', region='us-east-1')
    
    # Analyze text with AWS Comprehend
    text = "This is a sample AWS cloud log"
    result = comprehend.analyze_text(text)
    print(f"Comprehend analysis: {result}")
    
    # List S3 files
    files = s3.list_files(prefix='logs/')
    print(f"S3 files: {files}")


if __name__ == '__main__':
    main()
