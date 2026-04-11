variable "aws_region" {
  description = "The AWS region to deploy to."
  type        = string
  default     = "us-east-1"
}

variable "student_id" {
  description = "Your student ID to keep S3 buckets unique."
  type        = string
  default     = ""
}

variable "key_name" {
  description = "The name of your AWS Key Pair."
  type        = string
}

variable "gemini_api_key" {
  description = "The API key for Google Gemini AI."
  type        = string
  sensitive   = true
}
