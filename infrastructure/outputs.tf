output "s3_bucket_name" {
  description = "Name of the S3 bucket"
  value       = aws_s3_bucket.blog_images.bucket
}

output "s3_bucket_arn" {
  description = "ARN of the S3 bucket"
  value       = aws_s3_bucket.blog_images.arn
}

output "dynamodb_blogs_table_name" {
  description = "Name of the Blogs DynamoDB table"
  value       = aws_dynamodb_table.blogs.name
}

output "dynamodb_users_table_name" {
  description = "Name of the Users DynamoDB table"
  value       = aws_dynamodb_table.users.name
}

output "aws_region" {
  description = "AWS region"
  value       = var.aws_region
}
