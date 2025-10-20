variable "aws_region" {
  description = "AWS region for resources"
  type        = string
  default     = "ap-southeast-1"
}

variable "environment" {
  description = "Environment name"
  type        = string
  default     = "dev"
}
