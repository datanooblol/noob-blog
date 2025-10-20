# S3 Presigned URL CORS Issues and Solutions

## Problem Description

When using S3 presigned URLs for direct file uploads from a web browser, you may encounter CORS (Cross-Origin Resource Sharing) errors, particularly with newly created S3 buckets in regions other than `us-east-1`.

### Common Error Messages
```
Access to fetch at 'https://bucket-name.s3.amazonaws.com/...' from origin 'http://localhost:3000' 
has been blocked by CORS policy: Response to preflight request doesn't pass access control check: 
No 'Access-Control-Allow-Origin' header is present on the requested resource.
```

## Root Cause

The issue stems from AWS S3's distributed architecture and how boto3 generates presigned URLs:

1. **S3 Bucket DNS Propagation**: When buckets are created outside `us-east-1`, DNS entries take time to propagate
2. **Generic Endpoint Usage**: boto3 by default uses the generic S3 endpoint (`s3.amazonaws.com`) instead of regional endpoints
3. **Temporary Redirects**: Requests to new buckets get redirected (HTTP 302) to the correct regional endpoint
4. **Signature Invalidation**: The redirect changes the hostname, invalidating the Signature Version 4 authentication

## Solutions

### 1. Use Regional S3 Endpoints (Recommended)

Force boto3 to use the regional endpoint directly:

```python
import boto3

def get_s3_client():
    region = 'ap-southeast-1'  # Your bucket region
    return boto3.client(
        's3',
        region_name=region,
        endpoint_url=f'https://s3.{region}.amazonaws.com'
    )

# Generate presigned URL
s3_client = get_s3_client()
presigned_url = s3_client.generate_presigned_url(
    'put_object',
    Params={
        'Bucket': 'your-bucket-name',
        'Key': 'path/to/file.jpg',
        'ContentType': 'image/jpeg'
    },
    ExpiresIn=900
)
```

### 2. Configure S3 CORS Policy

Ensure your S3 bucket has proper CORS configuration:

```json
[
    {
        "AllowedHeaders": ["*"],
        "AllowedMethods": ["GET", "PUT", "POST", "DELETE", "HEAD"],
        "AllowedOrigins": ["*"],
        "ExposeHeaders": ["ETag", "x-amz-version-id"],
        "MaxAgeSeconds": 3000
    }
]
```

#### Terraform Configuration
```hcl
resource "aws_s3_bucket_cors_configuration" "bucket_cors" {
  bucket = aws_s3_bucket.bucket.id

  cors_rule {
    allowed_headers = ["*"]
    allowed_methods = ["GET", "PUT", "POST", "DELETE", "HEAD"]
    allowed_origins = ["*"]
    expose_headers  = ["ETag", "x-amz-version-id"]
    max_age_seconds = 3000
  }
}
```

### 3. Frontend Implementation

Remove unnecessary headers that trigger CORS preflight:

```javascript
// ❌ This triggers CORS preflight
const uploadResponse = await fetch(upload_url, {
    method: "PUT",
    body: file,
    headers: {
        "Content-Type": file.type,  // This causes preflight
    },
});

// ✅ This avoids CORS preflight
const uploadResponse = await fetch(upload_url, {
    method: "PUT",
    body: file,
});
```

## Testing the Fix

Test presigned URLs in a development environment:

```python
import boto3
import requests

# Test with regional endpoint
region = 'ap-southeast-1'
s3_client = boto3.client(
    's3',
    region_name=region,
    endpoint_url=f'https://s3.{region}.amazonaws.com'
)

# Generate and test presigned URL
presigned_url = s3_client.generate_presigned_url(
    'put_object',
    Params={
        'Bucket': 'your-bucket-name',
        'Key': 'test/sample.jpg',
        'ContentType': 'image/jpeg'
    },
    ExpiresIn=900
)

# Test upload
test_data = b"fake image data"
response = requests.put(presigned_url, data=test_data)
print("Status:", response.status_code)  # Should be 200
```

## Best Practices

1. **Always use regional endpoints** for S3 operations
2. **Configure CORS properly** during infrastructure setup
3. **Minimize custom headers** in frontend requests
4. **Test uploads** in development before production deployment
5. **Monitor CORS errors** in browser console during development

## Alternative Solutions

If presigned URLs continue to cause issues:

1. **Server-side upload**: Upload files through your backend API
2. **Multipart uploads**: For large files, use multipart upload with presigned URLs
3. **CloudFront**: Use CloudFront distribution with custom CORS headers

## References

- [AWS S3 CORS Documentation](https://docs.aws.amazon.com/AmazonS3/latest/userguide/cors.html)
- [AWS S3 Redirects Documentation](https://docs.aws.amazon.com/AmazonS3/latest/dev/Redirects.html)
- [Boto3 S3 Client Documentation](https://boto3.amazonaws.com/v1/documentation/api/latest/reference/services/s3.html)