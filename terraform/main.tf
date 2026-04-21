# Terraform Infrastructure for AI ATS Resume

terraform {
  required_providers {
    aws = {
      source  = "hashicorp/aws"
      version = "~> 5.0"
    }
  }
}

provider "aws" {
  region = var.aws_region
}

# --- 1. Edge Security (Existing ACM Certificate) ---
# Fetching the existing validated certificate for the custom domain
data "aws_acm_certificate" "issued" {
  domain   = var.domain_name
  statuses = ["ISSUED"]
}

data "aws_caller_identity" "current" {}

# --- 2. Load Balancing (ALB) ---

resource "aws_lb" "ats_alb" {
  name               = "EbookALB"
  internal           = false
  load_balancer_type = "application"
  security_groups    = [aws_security_group.alb_sg.id]
  subnets            = var.public_subnet_ids

  enable_deletion_protection = false

  tags = {
    Name = "EbookALB"
  }
}

resource "aws_lb_target_group" "frontend_tg" {
  name     = "EbookFrontend-TG"
  port     = 80
  protocol = "HTTP"
  vpc_id   = var.vpc_id
  target_type = "instance"

  health_check {
    path                = "/"
    interval            = 30
    timeout             = 5
    healthy_threshold   = 5
    unhealthy_threshold = 2
    matcher             = "200"
  }
}

resource "aws_lb_listener" "http" {
  load_balancer_arn = aws_lb.ats_alb.arn
  port              = "80"
  protocol          = "HTTP"

  default_action {
    type = "redirect"

    redirect {
      port        = "443"
      protocol    = "HTTPS"
      status_code = "HTTP_301"
    }
  }
}

resource "aws_lb_listener" "https" {
  load_balancer_arn = aws_lb.ats_alb.arn
  port              = "443"
  protocol          = "HTTPS"
  ssl_policy        = "ELBSecurityPolicy-2016-08"
  certificate_arn   = data.aws_acm_certificate.issued.arn

  default_action {
    type             = "forward"
    target_group_arn = aws_lb_target_group.frontend_tg.arn
  }
}

resource "aws_lb_target_group_attachment" "nginx_attachment" {
  target_group_arn = aws_lb_target_group.frontend_tg.arn
  target_id        = aws_instance.backend_server.id
  port             = 80
}

# --- 2. Backend (EC2 Instance) ---
# Note: Using pre-existing 'LabRole' and 'LabInstanceProfile' from AWS Academy Learner Lab.

resource "aws_security_group" "alb_sg" {
  name        = "ats-alb-sg"
  description = "Allow HTTPS and HTTP redirect for ALB"
  vpc_id      = var.vpc_id

  ingress {
    from_port   = 80
    to_port     = 80
    protocol    = "tcp"
    cidr_blocks = ["0.0.0.0/0"]
  }

  ingress {
    from_port   = 443
    to_port     = 443
    protocol    = "tcp"
    cidr_blocks = ["0.0.0.0/0"]
  }

  egress {
    from_port   = 0
    to_port     = 0
    protocol    = "-1"
    cidr_blocks = ["0.0.0.0/0"]
  }
}

resource "aws_security_group" "instance_sg" {
  name        = "ats-backend-sg"
  description = "Security group for internal backend services"
  vpc_id      = var.vpc_id

  # Inbound Rule: HTTP Traffic for Nginx Reverse Proxy
  ingress {
    from_port   = 80
    to_port     = 80
    protocol    = "tcp"
    cidr_blocks = ["0.0.0.0/0"]
  }

  # Inbound Rule: Load Balancer specific traffic
  ingress {
    from_port       = 80
    to_port         = 80
    protocol        = "tcp"
    security_groups = [aws_security_group.alb_sg.id]
  }

  # Inbound Rule: Application-layer API mapping
  ingress {
    from_port       = 3000
    to_port         = 3006
    protocol        = "tcp"
    security_groups = [aws_security_group.alb_sg.id]
  }

  # Inbound Rule: Secure Shell (SSH) management access
  ingress {
    from_port   = 22
    to_port     = 22
    protocol    = "tcp"
    cidr_blocks = ["0.0.0.0/0"]
  }

  egress {
    from_port   = 0
    to_port     = 0
    protocol    = "-1"
    cidr_blocks = ["0.0.0.0/0"]
  }
}

resource "aws_instance" "backend_server" {
  ami           = "ami-0b6c6ebed2801a5cb" # Ubuntu 24.04 LTS
  instance_type = "t3.micro"
  key_name      = var.key_name

  # Using standard LabInstanceProfile in AWS Academy
  iam_instance_profile = var.iam_instance_profile

  vpc_security_group_ids = [aws_security_group.instance_sg.id]
  subnet_id              = var.public_subnet_ids[0]

  user_data = <<-EOF
              #!/bin/bash
              apt-get update -y
              apt-get install -y docker.io docker-compose
              systemctl start docker
              systemctl enable docker
              usermod -aG docker ubuntu
              EOF

  tags = {
    Name = "ATS Resume"
  }
}

# --- 3. Database (DynamoDB - Multi-Table Schema) ---

resource "aws_dynamodb_table" "resumes_table" {
  name         = "ats_resumes"
  billing_mode = "PAY_PER_REQUEST"
  hash_key     = "resume_id"

  attribute {
    name = "resume_id"
    type = "S"
  }
}

resource "aws_dynamodb_table" "jobs_table" {
  name         = "ats_jobs"
  billing_mode = "PAY_PER_REQUEST"
  hash_key     = "job_id"

  attribute {
    name = "job_id"
    type = "S"
  }
}

resource "aws_dynamodb_table" "users_table" {
  name         = "ats_users"
  billing_mode = "PAY_PER_REQUEST"
  hash_key     = "user_id"

  attribute {
    name = "user_id"
    type = "S"
  }
}

# --- 4. Auth (Cognito Setup) ---

resource "aws_cognito_user_pool" "ats_pool" {
  name = "ats-user-pool-${var.student_id}"

  password_policy {
    minimum_length    = 12
    require_lowercase = true
    require_numbers   = true
    require_symbols   = true
    require_uppercase = true
  }

  admin_create_user_config {
    allow_admin_create_user_only = false
  }

  auto_verified_attributes = ["email"]

  tags = {
    Name = "ATS User Pool"
  }
}

resource "aws_cognito_user_pool_client" "ats_client" {
  name         = "ats-app-client"
  user_pool_id = aws_cognito_user_pool.ats_pool.id

  generate_secret     = false
  explicit_auth_flows = ["ADMIN_NO_SRP_AUTH", "USER_PASSWORD_AUTH"]

  allowed_oauth_flows_user_pool_client = true
  allowed_oauth_flows                  = ["code", "implicit"]
  allowed_oauth_scopes                 = ["email", "openid", "profile"]
  callback_urls                        = ["https://${var.domain_name}/api/auth/callback"]
  logout_urls                          = ["https://${var.domain_name}"]
}

# --- 4. ECR Repositories (New Account) ---
# Creating repositories to store our Docker images
resource "aws_ecr_repository" "backend" {
  name                 = "ats-backend"
  image_tag_mutability = "MUTABLE"
  force_delete         = true
}

resource "aws_ecr_repository" "frontend" {
  name                 = "ats-frontend"
  image_tag_mutability = "MUTABLE"
  force_delete         = true
}

resource "aws_ecr_repository" "nginx" {
  name                 = "ats-nginx"
  image_tag_mutability = "MUTABLE"
  force_delete         = true
}

resource "aws_cognito_user_pool_domain" "ats_domain" {
  domain       = "ats-resume-${var.student_id}"
  user_pool_id = aws_cognito_user_pool.ats_pool.id
}


# --- 5. Secrets Manager (Security) ---

resource "aws_secretsmanager_secret" "ats_secrets" {
  name                    = "ats/backend/secrets-${var.student_id}"
  recovery_window_in_days = 0 # Force delete for student lab cost saving
}

resource "aws_secretsmanager_secret_version" "ats_secrets_v1" {
  secret_id     = aws_secretsmanager_secret.ats_secrets.id
  secret_string = jsonencode({
    GEMINI_API_KEY          = "${var.gemini_api_key}"
    COGNITO_USER_POOL_ID    = aws_cognito_user_pool.ats_pool.id
    COGNITO_APP_CLIENT_ID   = aws_cognito_user_pool_client.ats_client.id
    COGNITO_REGION          = var.aws_region
    COGNITO_DOMAIN          = "https://${aws_cognito_user_pool_domain.ats_domain.domain}.auth.${var.aws_region}.amazoncognito.com"
    COGNITO_REDIRECT_URI    = "https://${var.domain_name}/api/auth/callback"
    COGNITO_LOGOUT_URI      = "https://${var.domain_name}"
    DDB_RESUMES_TABLE       = aws_dynamodb_table.resumes_table.name
    DDB_JOBS_TABLE          = aws_dynamodb_table.jobs_table.name
    DDB_USERS_TABLE         = aws_dynamodb_table.users_table.name
    ECR_REGISTRY            = "${data.aws_caller_identity.current.account_id}.dkr.ecr.${var.aws_region}.amazonaws.com"
    VITE_API_BASE           = "https://${var.domain_name}/api"
  })
}

# --- 6. CloudWatch Logs (Observability) ---

resource "aws_cloudwatch_log_group" "docker_logs" {
  name              = "/ats-resume/docker"
  retention_in_days = 7
}

# --- 7. CloudWatch Operational Dashboard (Observability) ---
resource "aws_cloudwatch_dashboard" "main" {
  dashboard_name = "ATS-Resume-Operational-Dashboard"

  dashboard_body = jsonencode({
    widgets = [
      {
        type   = "metric"
        x      = 0
        y      = 0
        width  = 12
        height = 6
        properties = {
          metrics = [
            ["AWS/EC2", "CPUUtilization", "InstanceId", "${aws_instance.backend_server.id}"]
          ]
          period = 300
          stat   = "Average"
          region = "${var.aws_region}"
          title  = "Backend CPU Utilization"
        }
      },
      {
        type   = "text"
        x      = 12
        y      = 0
        width  = 12
        height = 6
        properties = {
          markdown = "# ATS Resume Ops\nStatus: Online\nEnvironment: Production"
        }
      }
    ]
  })
}

# --- 8. Proactive Monitoring (Fault Tolerance) ---
resource "aws_cloudwatch_metric_alarm" "cpu_alarm" {
  alarm_name          = "ATS-Backend-High-CPU-Alarm"
  comparison_operator = "GreaterThanOrEqualToThreshold"
  evaluation_periods  = "2"
  metric_name         = "CPUUtilization"
  namespace           = "AWS/EC2"
  period              = "120"
  statistic           = "Average"
  threshold           = "80"
  alarm_description   = "This metric monitors ec2 cpu utilization"

  dimensions = {
    InstanceId = aws_instance.backend_server.id
  }
}
