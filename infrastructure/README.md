# Noob Blog Infrastructure

This Terraform configuration creates the AWS resources needed for the noob-blog application.

## Resources Created

- **S3 Bucket**: `datanooblol-blog-dev-YYYYMMDD` for image storage
- **DynamoDB Tables**: 
  - `Articles` - Blog articles with GSI for slug and status
  - `Users` - User authentication with GSI for username and email

## Prerequisites

1. Install Terraform: https://terraform.io/downloads
2. Configure AWS credentials:
   ```bash
   aws configure
   ```

## Usage

```bash
# Initialize Terraform
terraform init

# Plan the deployment
terraform plan

# Apply the configuration
terraform apply

# Destroy resources (when needed)
terraform destroy
```

## Outputs

After deployment, you'll get:
- S3 bucket name
- DynamoDB table names
- AWS region

## Cost Estimate

- **DynamoDB**: Pay-per-request (very low for development)
- **S3**: ~$0.023/GB/month + requests
- **Total**: < $1/month for development usage