# Configure Terraform and AWS Provider
terraform {
  required_version = ">= 1.0"
  required_providers {
    aws = {
      source  = "hashicorp/aws"
      version = "~> 5.0"
    }
  }
}

provider "aws" {
  region  = var.aws_region
  profile = "dev"
}

# Local values for naming
locals {
  bucket_name = "datanooblol-blog-images-dev-20251020"
}

# S3 Bucket for blog images
resource "aws_s3_bucket" "blog_images" {
  bucket = local.bucket_name

  tags = {
    Name        = "Blog Images"
    Environment = "dev"
    Project     = "noob-blog"
  }
}

# S3 Bucket Public Access Configuration
resource "aws_s3_bucket_public_access_block" "blog_images" {
  bucket = aws_s3_bucket.blog_images.id

  block_public_acls       = false
  block_public_policy     = false
  ignore_public_acls      = false
  restrict_public_buckets = false
}

# S3 Bucket Policy for Public Read Access
resource "aws_s3_bucket_policy" "blog_images" {
  bucket     = aws_s3_bucket.blog_images.id
  depends_on = [aws_s3_bucket_public_access_block.blog_images]

  policy = jsonencode({
    Version = "2012-10-17"
    Statement = [
      {
        Effect    = "Allow"
        Principal = "*"
        Action    = "s3:GetObject"
        Resource  = "${aws_s3_bucket.blog_images.arn}/*"
      }
    ]
  })
}

# S3 Bucket CORS Configuration
resource "aws_s3_bucket_cors_configuration" "blog_images" {
  bucket = aws_s3_bucket.blog_images.id

  cors_rule {
    allowed_headers = ["*"]
    allowed_methods = ["GET", "PUT", "POST", "DELETE", "HEAD"]
    allowed_origins = ["*"]
    expose_headers  = ["ETag", "x-amz-version-id"]
    max_age_seconds = 3000
  }
}

# DynamoDB Table - Blogs
resource "aws_dynamodb_table" "blogs" {
  name         = "Blogs"
  billing_mode = "PAY_PER_REQUEST"
  hash_key     = "blog_id"
  range_key    = "sk"

  attribute {
    name = "blog_id"
    type = "S"
  }

  attribute {
    name = "sk"
    type = "S"
  }

  attribute {
    name = "slug"
    type = "S"
  }

  attribute {
    name = "status"
    type = "S"
  }

  attribute {
    name = "created_at"
    type = "S"
  }

  global_secondary_index {
    name            = "SlugIndex"
    hash_key        = "slug"
    projection_type = "ALL"
  }

  global_secondary_index {
    name            = "StatusIndex"
    hash_key        = "status"
    range_key       = "created_at"
    projection_type = "ALL"
  }

  tags = {
    Name        = "Blogs"
    Environment = "dev"
    Project     = "noob-blog"
  }
}

# DynamoDB Table - Users
resource "aws_dynamodb_table" "users" {
  name         = "Users"
  billing_mode = "PAY_PER_REQUEST"
  hash_key     = "user_id"
  range_key    = "sk"

  attribute {
    name = "user_id"
    type = "S"
  }

  attribute {
    name = "sk"
    type = "S"
  }

  attribute {
    name = "username"
    type = "S"
  }

  attribute {
    name = "email"
    type = "S"
  }

  global_secondary_index {
    name            = "UsernameIndex"
    hash_key        = "username"
    projection_type = "ALL"
  }

  global_secondary_index {
    name            = "EmailIndex"
    hash_key        = "email"
    projection_type = "ALL"
  }

  tags = {
    Name        = "Users"
    Environment = "dev"
    Project     = "noob-blog"
  }
}
