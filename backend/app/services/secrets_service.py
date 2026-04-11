import boto3
import json
import os
from botocore.exceptions import ClientError

class SecretsManager:
    _cached_secrets = None

    @classmethod
    def get_secrets(cls):
        """Fetch secrets from AWS Secrets Manager or return cached version."""
        if cls._cached_secrets:
            return cls._cached_secrets

        secret_name = os.getenv("AWS_SECRET_NAME")
        region_name = os.getenv("AWS_REGION", "us-east-1")

        if not secret_name:
            # Fallback to empty if name not provided (local dev)
            return {}

        # Create a Secrets Manager client
        session = boto3.session.Session()
        client = session.client(
            service_name='secretsmanager',
            region_name=region_name
        )

        try:
            get_secret_value_response = client.get_secret_value(
                SecretId=secret_name
            )
        except ClientError as e:
            print(f"Error fetching secrets: {e}")
            return {}

        # Decrypts secret using the associated KMS key.
        if 'SecretString' in get_secret_value_response:
            cls._cached_secrets = json.loads(get_secret_value_response['SecretString'])
            return cls._cached_secrets
        
        return {}

def inject_secrets():
    """Inject AWS secrets into environment variables at startup."""
    secrets = SecretsManager.get_secrets()
    for key, value in secrets.items():
        if value:
            os.environ[key] = str(value)
            print(f"Injected secret: {key}")
