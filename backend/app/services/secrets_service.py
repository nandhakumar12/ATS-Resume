import json
import logging
import os
from typing import Optional

import boto3
from botocore.exceptions import ClientError

logger = logging.getLogger(__name__)


class SecretsManager:
    """
    Fetches secrets from AWS Secrets Manager using the EC2 IAM Role (LabInstanceProfile).
    No hardcoded credentials needed — boto3 uses instance metadata automatically.
    
    Secret name is set via the AWS_SECRET_NAME environment variable.
    For this project: ats/backend/secrets-25126067
    """
    _cached_secrets: Optional[dict] = None

    @classmethod
    def get_secrets(cls) -> Optional[dict]:
        """Fetch secrets from AWS Secrets Manager (cached after first call)."""
        if cls._cached_secrets is not None:
            return cls._cached_secrets

        secret_name = os.getenv("AWS_SECRET_NAME")
        region_name = os.getenv("AWS_REGION", "us-east-1")

        if not secret_name:
            logger.warning(
                "AWS_SECRET_NAME is not set. "
                "Running in local dev mode — using environment variables only."
            )
            cls._cached_secrets = {}
            return cls._cached_secrets

        logger.info(f"Fetching secrets from AWS Secrets Manager: {secret_name} (region: {region_name})")

        client = boto3.session.Session().client(
            service_name="secretsmanager",
            region_name=region_name,
        )

        try:
            response = client.get_secret_value(SecretId=secret_name)
        except ClientError as e:
            error_code = e.response["Error"]["Code"]
            logger.error(
                f"Failed to fetch secrets from Secrets Manager. "
                f"Error: {error_code} — {e}. "
                f"The container will start but config may be missing."
            )
            cls._cached_secrets = {}
            return cls._cached_secrets

        if "SecretString" not in response:
            logger.error("Secrets Manager returned a binary secret — expected JSON string.")
            cls._cached_secrets = {}
            return cls._cached_secrets

        cls._cached_secrets = json.loads(response["SecretString"])
        logger.info(f"Successfully loaded {len(cls._cached_secrets)} secrets from Secrets Manager.")
        return cls._cached_secrets


def inject_secrets() -> None:
    """
    Load all secrets from AWS Secrets Manager and inject them into
    os.environ so the rest of the app can use os.getenv() as normal.

    Called once at startup in main.py before any routes are loaded.
    Secrets already set in the environment are NOT overwritten
    (allows local .env overrides to take precedence in dev).
    """
    secrets = SecretsManager.get_secrets()
    injected = 0
    for key, value in secrets.items():
        if value and key not in os.environ:
            os.environ[key] = str(value)
            injected += 1
            logger.info(f"  ✓ Injected secret: {key}")
        elif key in os.environ:
            logger.debug(f"  ~ Skipped (already set in env): {key}")

    if injected:
        logger.info(f"Secrets Manager: injected {injected} secrets into environment.")
    else:
        logger.info("Secrets Manager: no new secrets injected (all already in env or empty).")
