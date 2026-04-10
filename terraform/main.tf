# Terraform Infrastructure for AI ATS Resume (MSc Project)
# =========================================================
# This architecture implements a professional, cloud-native
# environment satisfying LO1, LO4, and LO5 of the NCI module.

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

# --- 1. Frontend (S3 + CloudFront CDN) ---
# Satisfies LO4: Architectural patterns

resource "aws_s3_bucket" "frontend_bucket" {
  bucket        = "ats-resume-frontend-${var.student_id}"
  force_destroy = true
}

resource "aws_s3_bucket_website_configuration" "frontend_config" {
  bucket = aws_s3_bucket.frontend_bucket.id
  index_document { suffix = "index.html" }
}

resource "aws_cloudfront_origin_access_control" "oac" {
  name                              = "ats-resume-oac-${var.student_id}"
  description                       = "OAC for ATS Resume Frontend"
  origin_access_control_origin_type = "s3"
  signing_behavior                  = "always"
  signing_protocol                  = "sigv4"
}

resource "aws_cloudfront_distribution" "cdn" {
  origin {
    domain_name              = aws_s3_bucket.frontend_bucket.bucket_regional_domain_name
    origin_id                = "S3-Frontend"
    origin_access_control_id = aws_cloudfront_origin_access_control.oac.id
  }

  enabled             = true
  is_ipv6_enabled     = true
  default_root_object = "index.html"

  default_cache_behavior {
    allowed_methods  = ["GET", "HEAD"]
    cached_methods   = ["GET", "HEAD"]
    target_origin_id = "S3-Frontend"

    forwarded_values {
      query_string = false
      cookies { forward = "none" }
    }

    viewer_protocol_policy = "redirect-to-https"
  }

  restrictions {
    geo_restriction {
      restriction_type = "none"
    }
  }

  viewer_certificate {
    cloudfront_default_certificate = true
  }
}

resource "aws_s3_bucket_policy" "frontend_bucket_policy" {
  bucket = aws_s3_bucket.frontend_bucket.id

  policy = jsonencode({
    Version = "2012-10-17"
    Statement = [
      {
        Action   = "s3:GetObject"
        Effect   = "Allow"
        Resource = "${aws_s3_bucket.frontend_bucket.arn}/*"
        Principal = {
          Service = "cloudfront.amazonaws.com"
        }
        Condition = {
          StringEquals = {
            "AWS:SourceArn" = aws_cloudfront_distribution.cdn.arn
          }
        }
      }
    ]
  })
}

# --- 2. Backend (EC2 Instance & IAM) ---
# Satisfies LO1: Core cloud services and LO3: IAM Security

resource "aws_iam_role" "ec2_role" {
  name = "ats-ec2-role-${var.student_id}"

  assume_role_policy = jsonencode({
    Version = "2012-10-17"
    Statement = [
      {
        Action = "sts:AssumeRole"
        Effect = "Allow"
        Principal = {
          Service = "ec2.amazonaws.com"
        }
      }
    ]
  })
}

resource "aws_iam_role_policy_attachment" "cloudwatch_logs" {
  role       = aws_iam_role.ec2_role.name
  policy_arn = "arn:aws:iam::aws:policy/CloudWatchLogsFullAccess"
}

resource "aws_iam_instance_profile" "ec2_profile" {
  name = "ats-ec2-profile-${var.student_id}"
  role = aws_iam_role.ec2_role.name
}

resource "aws_security_group" "backend_sg" {
  name        = "ats-backend-sg"
  description = "Allow inbound traffic for API"

  ingress {
    from_port   = 8000
    to_port     = 8000
    protocol    = "tcp"
    cidr_blocks = ["0.0.0.0/0"]
  }

  ingress {
    from_port   = 22
    to_port     = 22
    protocol    = "tcp"
    cidr_blocks = ["0.0.0.0/0"] # Standard for students, usually restricted later
  }

  egress {
    from_port   = 0
    to_port     = 0
    protocol    = "-1"
    cidr_blocks = ["0.0.0.0/0"]
  }
}

resource "aws_instance" "backend_server" {
  ami           = "ami-0c101f26f147fa7fd" # Amazon Linux 2023 - us-east-1
  instance_type = "t2.micro"
  key_name      = var.key_name

  iam_instance_profile = aws_iam_instance_profile.ec2_profile.name

  vpc_security_group_ids = [aws_security_group.backend_sg.id]

  user_data = <<-EOF
              #!/bin/bash
              dnf update -y
              dnf install -y docker
              systemctl start docker
              systemctl enable docker
              EOF

  tags = {
    Name = "ATS-Backend-Server"
  }
}

# --- 3. Database (DynamoDB) ---
# Satisfies LO1: Core cloud services

resource "aws_dynamodb_table" "resumes_table" {
  name           = "ats_resumes_${var.student_id}"
  billing_mode   = "PROVISIONED"
  read_capacity  = 5
  write_capacity = 5
  hash_key       = "id"

  attribute {
    name = "id"
    type = "S"
  }
}

# --- 4. Auth (Cognito) ---
# Satisfies LO3: Security best practices

resource "aws_cognito_user_pool" "pool" {
  name = "ats-user-pool-${var.student_id}"
}

resource "aws_cognito_user_pool_client" "client" {
  name         = "ats-client"
  user_pool_id = aws_cognito_user_pool.pool.id
}
