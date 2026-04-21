output "alb_dns_name" {
  description = "The DNS name of the load balancer."
  value       = aws_lb.ats_alb.dns_name
}

output "ec2_public_ip" {
  description = "The public IP of the backend server."
  value       = aws_instance.backend_server.public_ip
}

output "cognito_user_pool_id" {
  description = "The ID of the Cognito User Pool."
  value       = aws_cognito_user_pool.ats_pool.id
}

output "cognito_app_client_id" {
  description = "The ID of the Cognito App Client."
  value       = aws_cognito_user_pool_client.ats_client.id
}

output "dynamodb_tables" {
  description = "The names of the DynamoDB tables."
  value = {
    resumes = aws_dynamodb_table.resumes_table.name
    jobs    = aws_dynamodb_table.jobs_table.name
    users   = aws_dynamodb_table.users_table.name
  }
}
