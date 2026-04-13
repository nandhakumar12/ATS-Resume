import logging
import os

import boto3

logger = logging.getLogger(__name__)


def get_dynamodb_resource():
    """
    Returns a boto3 DynamoDB resource.
    
    IMPORTANT: Do NOT cache this resource with lru_cache.
    On EC2 with LabInstanceProfile, boto3 automatically refreshes credentials
    from the instance metadata service (IMDS). Caching the resource would hold
    onto expired session tokens and cause 500 errors every ~4 hours.
    
    Uses env vars so you can point to DynamoDB Local in dev and AWS in prod.
    """
    region = os.getenv("AWS_REGION", "us-east-1")
    endpoint_url = os.getenv("DYNAMODB_ENDPOINT_URL")

    params = {"region_name": region}
    if endpoint_url:
        params["endpoint_url"] = endpoint_url
        logger.info(f"DynamoDB using local endpoint: {endpoint_url}")
    else:
        logger.debug(f"DynamoDB connecting to AWS region: {region}")

    return boto3.resource("dynamodb", **params)


def users_table():
    return get_dynamodb_resource().Table(os.getenv("DDB_USERS_TABLE", "ats_users"))


def resumes_table():
    return get_dynamodb_resource().Table(os.getenv("DDB_RESUMES_TABLE", "ats_resumes"))


def jobs_table():
    return get_dynamodb_resource().Table(os.getenv("DDB_JOBS_TABLE", "ats_jobs"))

