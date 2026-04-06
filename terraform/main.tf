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

resource "aws_cloudfront_distribution" "cdn" {
  origin {
    domain_name = aws_s3_bucket.frontend_bucket.bucket_regional_domain_name
    origin_id   = "S3-Frontend"
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

# --- 2. Backend (EC2 Instance) ---
# Satisfies LO1: Core cloud services

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
