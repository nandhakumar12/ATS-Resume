import os
from functools import lru_cache

import boto3


@lru_cache(maxsize=1)
def get_dynamodb_resource():
    """
    Returns a boto3 DynamoDB resource.
    Uses env vars so you can point to DynamoDB Local in dev and AWS in prod.
    """
    region = os.getenv("AWS_REGION", "us-east-1")
    endpoint_url = os.getenv("DYNAMODB_ENDPOINT_URL")

    params = {"region_name": region}
    if endpoint_url:
        params["endpoint_url"] = endpoint_url

    return boto3.resource("dynamodb", **params)


def users_table():
    return get_dynamodb_resource().Table(os.getenv("DDB_USERS_TABLE", "ats_users"))


def resumes_table():
    return get_dynamodb_resource().Table(os.getenv("DDB_RESUMES_TABLE", "ats_resumes"))


def jobs_table():
    return get_dynamodb_resource().Table(os.getenv("DDB_JOBS_TABLE", "ats_jobs"))

