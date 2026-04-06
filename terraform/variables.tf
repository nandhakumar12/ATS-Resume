variable "aws_region" {
  description = "The AWS region to deploy to."
  type        = string
  default     = "us-east-1"
}

variable "student_id" {
  description = "Your student ID to keep S3 buckets unique."
  type        = string
  default     = "msccloud2026"
}

variable "key_name" {
  description = "The name of your AWS Key Pair."
  type        = string
}
