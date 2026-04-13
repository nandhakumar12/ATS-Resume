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
  iam_instance_profile = "LabInstanceProfile"

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

# --- 4. Auth (Existing Cognito Setup) ---

# Fetching the existing User Pool
data "aws_cognito_user_pool" "selected" {
  user_pool_id = "us-east-1_5rSehoZbr"
}

# Fetching the existing App Client
data "aws_cognito_user_pool_client" "selected" {
  client_id    = "4td5k9rcuoph3fs5q67gjji93p"
  user_pool_id = data.aws_cognito_user_pool.selected.id
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
    COGNITO_USER_POOL_ID    = data.aws_cognito_user_pool.selected.id
    COGNITO_APP_CLIENT_ID   = data.aws_cognito_user_pool_client.selected.id
    COGNITO_REGION          = var.aws_region
    COGNITO_DOMAIN          = "https://us-east-15rsehozbr.auth.us-east-1.amazoncognito.com"
    COGNITO_REDIRECT_URI    = "https://nandhakumar.works/api/auth/callback"
    COGNITO_LOGOUT_URI      = "https://nandhakumar.works"
    DDB_RESUMES_TABLE       = aws_dynamodb_table.resumes_table.name
    DDB_JOBS_TABLE          = aws_dynamodb_table.jobs_table.name
    DDB_USERS_TABLE         = aws_dynamodb_table.users_table.name
    ECR_REGISTRY            = "857238695432.dkr.ecr.us-east-1.amazonaws.com/ats"
    VITE_API_BASE           = "https://nandhakumar.works/api"
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
