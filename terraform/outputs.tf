output "frontend_url" {
  description = "The URL of the static frontend website."
  value       = aws_s3_bucket_website_configuration.frontend_config.website_endpoint
}

output "cloudfront_url" {
  description = "The CloudFront CDN URL for global delivery."
  value       = "https://${aws_cloudfront_distribution.cdn.domain_name}"
}

output "backend_public_ip" {
  description = "The public IP address of the EC2 backend server."
  value       = aws_instance.backend_server.public_ip
}

output "dynamodb_table_name" {
  description = "The name of the DynamoDB table."
  value       = aws_dynamodb_table.resumes_table.name
}

output "cognito_user_pool_id" {
  description = "The ID of the Cognito User Pool."
  value       = aws_cognito_user_pool.pool.id
}
