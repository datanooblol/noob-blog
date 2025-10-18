# Content Access Control for Headless CMS

## 🎯 The Problem

When building a headless CMS that distributes content to multiple websites, you need to **control which websites can access your content**. Without proper access control, anyone could fetch and use your content without permission.

## 🔐 Security Requirements

### **Core Needs**
- ✅ Only authorized websites can fetch content
- ✅ Rate limiting to prevent abuse
- ✅ Audit trail of content access
- ✅ Ability to revoke access instantly
- ✅ Different permission levels per website

### **Business Requirements**
- 🏢 **Paid Content Partnerships** - Charge websites for content access
- 🏢 **Brand Control** - Ensure content appears on approved sites only
- 🏢 **Usage Analytics** - Track which content is most popular
- 🏢 **Compliance** - Meet legal requirements for content distribution

## 🛠️ Implementation Strategies

### **1. API Key Authentication**

**Most Common Approach** - Simple and effective for B2B content distribution.

#### **Backend Implementation**
```python
from fastapi import HTTPException, Header, Depends

# DynamoDB table structure for API keys
class APIKeyRecord:
    api_key: str              # "ak_website_a_abc123"
    website_name: str         # "TechNews Daily"
    website_domain: str       # "https://technews.com"
    contact_email: str        # "admin@technews.com"
    permissions: List[str]    # ["read_articles", "webhook_access"]
    rate_limit_per_hour: int  # 1000
    created_at: str
    expires_at: str           # Optional expiration
    is_active: bool
    usage_count: int          # Track API calls

# Validation middleware
async def validate_api_key(api_key: str = Header(None, alias="X-API-Key")):
    if not api_key:
        raise HTTPException(status_code=401, detail="API key required")
    
    # Check in DynamoDB
    key_record = get_api_key_record(api_key)
    if not key_record or not key_record.is_active:
        raise HTTPException(status_code=401, detail="Invalid API key")
    
    # Check expiration
    if key_record.expires_at and datetime.now() > key_record.expires_at:
        raise HTTPException(status_code=401, detail="API key expired")
    
    # Check rate limit
    if check_rate_limit_exceeded(api_key):
        raise HTTPException(status_code=429, detail="Rate limit exceeded")
    
    return key_record

# Protected endpoint
@app.get("/api/articles/{id}/distribute")
async def get_article_for_distribution(
    id: str,
    api_key_record: APIKeyRecord = Depends(validate_api_key)
):
    # Log access
    log_content_access(api_key_record.api_key, id)
    
    # Increment usage counter
    increment_api_usage(api_key_record.api_key)
    
    # Return content
    article = get_article(id)
    return {
        "metadata": {
            "title": article.title,
            "published_at": article.published_at,
            "tags": article.tags
        },
        "content": {
            "html": article.html_content
        }
    }
```

#### **Consumer Website Integration**
```typescript
// Website A implementation
class ContentClient {
  private apiKey: string;
  private baseUrl: string;

  constructor(apiKey: string) {
    this.apiKey = apiKey;
    this.baseUrl = 'https://your-api.execute-api.region.amazonaws.com/prod';
  }

  async fetchArticle(articleId: string) {
    const response = await fetch(`${this.baseUrl}/articles/${articleId}/distribute`, {
      headers: {
        'X-API-Key': this.apiKey,
        'Content-Type': 'application/json'
      }
    });

    if (!response.ok) {
      if (response.status === 401) {
        throw new Error('Invalid API key');
      }
      if (response.status === 429) {
        throw new Error('Rate limit exceeded');
      }
      throw new Error('Failed to fetch content');
    }

    return response.json();
  }
}

// Usage
const contentClient = new ContentClient('ak_website_a_abc123');
const article = await contentClient.fetchArticle('article-123');
```

### **2. Domain Whitelist + Referer Validation**

**Additional Security Layer** - Validate the requesting domain.

```python
@app.get("/api/articles/{id}/distribute")
async def get_article_for_distribution(
    id: str,
    request: Request,
    api_key_record: APIKeyRecord = Depends(validate_api_key)
):
    # Validate domain matches API key registration
    origin = request.headers.get("origin")
    referer = request.headers.get("referer")
    user_agent = request.headers.get("user-agent")
    
    # Check if request comes from registered domain
    if not validate_request_domain(origin, referer, api_key_record.website_domain):
        raise HTTPException(
            status_code=403, 
            detail="Request not from registered domain"
        )
    
    # Additional bot detection
    if is_suspicious_request(user_agent, origin):
        raise HTTPException(status_code=403, detail="Suspicious request detected")
    
    return get_article_content(id)

def validate_request_domain(origin: str, referer: str, registered_domain: str) -> bool:
    """Validate request comes from registered domain"""
    request_domain = origin or extract_domain_from_referer(referer)
    
    if not request_domain:
        return False
    
    # Allow subdomains
    return (
        request_domain == registered_domain or 
        request_domain.endswith(f".{registered_domain.replace('https://', '')}")
    )
```

### **3. JWT Token-Based Authentication**

**Enterprise Approach** - More secure with expiring tokens.

```python
from jose import JWTError, jwt
from datetime import datetime, timedelta

# Token generation endpoint
@app.post("/api/auth/token")
async def generate_access_token(credentials: WebsiteCredentials):
    # Validate website credentials
    website = validate_website_credentials(credentials)
    if not website:
        raise HTTPException(status_code=401, detail="Invalid credentials")
    
    # Create JWT token
    token_data = {
        "website_id": website.id,
        "website_name": website.name,
        "permissions": website.permissions,
        "exp": datetime.utcnow() + timedelta(hours=24)
    }
    
    token = jwt.encode(token_data, SECRET_KEY, algorithm="HS256")
    
    return {
        "access_token": token,
        "token_type": "bearer",
        "expires_in": 86400  # 24 hours
    }

# Token validation
async def validate_jwt_token(authorization: str = Header(None)):
    if not authorization or not authorization.startswith("Bearer "):
        raise HTTPException(status_code=401, detail="Bearer token required")
    
    token = authorization.split(" ")[1]
    
    try:
        payload = jwt.decode(token, SECRET_KEY, algorithms=["HS256"])
        website_id = payload.get("website_id")
        
        # Verify website still exists and is active
        website = get_website_by_id(website_id)
        if not website or not website.is_active:
            raise HTTPException(status_code=401, detail="Website access revoked")
        
        return payload
    except JWTError:
        raise HTTPException(status_code=401, detail="Invalid token")

# Protected endpoint with JWT
@app.get("/api/articles/{id}/distribute")
async def get_article_for_distribution(
    id: str,
    token_data: dict = Depends(validate_jwt_token)
):
    return get_article_content(id)
```

### **4. AWS API Gateway Integration**

**Production Setup** - Leverage AWS managed services.

```yaml
# API Gateway configuration
Resources:
  ContentDistributionAPI:
    Type: AWS::ApiGateway::RestApi
    Properties:
      Name: ContentDistributionAPI
      Description: Secure content distribution API

  # API Key for each website
  WebsiteAApiKey:
    Type: AWS::ApiGateway::ApiKey
    Properties:
      Name: WebsiteA-ContentAccess
      Description: API key for Website A content access
      Enabled: true

  # Usage plan with rate limiting
  ContentAccessUsagePlan:
    Type: AWS::ApiGateway::UsagePlan
    Properties:
      UsagePlanName: ContentAccess
      Description: Usage plan for content distribution
      Throttle:
        RateLimit: 100    # requests per second
        BurstLimit: 200   # burst capacity
      Quota:
        Limit: 10000      # requests per month
        Period: MONTH

  # Link API key to usage plan
  UsagePlanKey:
    Type: AWS::ApiGateway::UsagePlanKey
    Properties:
      KeyId: !Ref WebsiteAApiKey
      KeyType: API_KEY
      UsagePlanId: !Ref ContentAccessUsagePlan

  # Method with API key requirement
  ArticleDistributionMethod:
    Type: AWS::ApiGateway::Method
    Properties:
      RestApiId: !Ref ContentDistributionAPI
      ResourceId: !Ref ArticleResource
      HttpMethod: GET
      ApiKeyRequired: true
      AuthorizationType: NONE
```

## 📊 Access Control Dashboard

### **Admin Interface for Managing Access**

```typescript
// Admin dashboard for managing API keys
interface APIKeyManagement {
  // View all API keys
  listAPIKeys(): Promise<APIKeyRecord[]>;
  
  // Create new API key for website
  createAPIKey(websiteInfo: {
    name: string;
    domain: string;
    contactEmail: string;
    permissions: string[];
    rateLimit: number;
  }): Promise<string>;
  
  // Revoke access immediately
  revokeAPIKey(apiKey: string): Promise<void>;
  
  // Update permissions
  updatePermissions(apiKey: string, permissions: string[]): Promise<void>;
  
  // View usage analytics
  getUsageStats(apiKey: string, timeRange: string): Promise<UsageStats>;
}

// Usage analytics
interface UsageStats {
  totalRequests: number;
  requestsThisMonth: number;
  mostAccessedArticles: Array<{
    articleId: string;
    title: string;
    accessCount: number;
  }>;
  dailyUsage: Array<{
    date: string;
    requests: number;
  }>;
}
```

## 🔍 Monitoring & Analytics

### **Track Content Access**

```python
# Log every content access
def log_content_access(api_key: str, article_id: str, request_info: dict):
    access_log = {
        "timestamp": datetime.utcnow().isoformat(),
        "api_key": api_key,
        "article_id": article_id,
        "ip_address": request_info.get("ip"),
        "user_agent": request_info.get("user_agent"),
        "referer": request_info.get("referer")
    }
    
    # Store in DynamoDB or CloudWatch
    dynamodb.put_item(
        TableName="ContentAccessLogs",
        Item=access_log
    )

# Rate limiting with Redis/DynamoDB
def check_rate_limit_exceeded(api_key: str) -> bool:
    current_hour = datetime.utcnow().strftime("%Y-%m-%d-%H")
    key = f"rate_limit:{api_key}:{current_hour}"
    
    current_count = redis.get(key) or 0
    api_key_record = get_api_key_record(api_key)
    
    if int(current_count) >= api_key_record.rate_limit_per_hour:
        return True
    
    # Increment counter
    redis.incr(key)
    redis.expire(key, 3600)  # Expire after 1 hour
    
    return False
```

## 🚨 Security Best Practices

### **1. API Key Security**
```python
# Generate secure API keys
import secrets
import string

def generate_api_key(website_name: str) -> str:
    """Generate cryptographically secure API key"""
    prefix = "ak"
    website_code = website_name.lower().replace(" ", "")[:10]
    random_part = ''.join(secrets.choice(string.ascii_letters + string.digits) for _ in range(20))
    
    return f"{prefix}_{website_code}_{random_part}"

# Hash API keys in database (optional extra security)
import hashlib

def hash_api_key(api_key: str) -> str:
    return hashlib.sha256(api_key.encode()).hexdigest()
```

### **2. Request Validation**
```python
def validate_request_integrity(request: Request) -> bool:
    """Additional security checks"""
    
    # Check for suspicious patterns
    user_agent = request.headers.get("user-agent", "")
    if any(bot in user_agent.lower() for bot in ["bot", "crawler", "spider"]):
        return False
    
    # Validate request frequency from same IP
    ip_address = request.client.host
    if is_ip_making_too_many_requests(ip_address):
        return False
    
    # Check for required headers
    required_headers = ["user-agent", "accept"]
    for header in required_headers:
        if header not in request.headers:
            return False
    
    return True
```

### **3. Content Watermarking**
```python
def add_content_watermark(html_content: str, api_key: str) -> str:
    """Add invisible watermark to track content usage"""
    website_info = get_api_key_record(api_key)
    
    watermark = f"""
    <!-- Content provided by YourCMS to {website_info.website_name} -->
    <!-- Usage tracked under API key: {api_key[:10]}... -->
    """
    
    return watermark + html_content
```

## 💰 Monetization Strategies

### **1. Tiered Access Plans**
```python
class AccessTier(Enum):
    FREE = "free"           # 100 requests/month
    BASIC = "basic"         # 1,000 requests/month
    PREMIUM = "premium"     # 10,000 requests/month
    ENTERPRISE = "enterprise"  # Unlimited

def check_usage_limits(api_key: str) -> bool:
    record = get_api_key_record(api_key)
    current_usage = get_monthly_usage(api_key)
    
    limits = {
        AccessTier.FREE: 100,
        AccessTier.BASIC: 1000,
        AccessTier.PREMIUM: 10000,
        AccessTier.ENTERPRISE: float('inf')
    }
    
    return current_usage < limits[record.access_tier]
```

### **2. Usage-Based Billing**
```python
def calculate_monthly_bill(api_key: str) -> float:
    usage = get_monthly_usage(api_key)
    record = get_api_key_record(api_key)
    
    pricing = {
        AccessTier.FREE: 0,
        AccessTier.BASIC: 29.99,
        AccessTier.PREMIUM: 99.99,
        AccessTier.ENTERPRISE: 0.01  # per request
    }
    
    if record.access_tier == AccessTier.ENTERPRISE:
        return usage * pricing[AccessTier.ENTERPRISE]
    else:
        return pricing[record.access_tier]
```

## 🔄 Integration Examples

### **Website Integration Code**
```typescript
// Complete integration example for consumer websites
class SecureContentClient {
  private apiKey: string;
  private baseUrl: string;
  private cache: Map<string, any> = new Map();

  constructor(apiKey: string, baseUrl: string) {
    this.apiKey = apiKey;
    this.baseUrl = baseUrl;
  }

  async fetchArticle(articleId: string, useCache = true): Promise<Article> {
    // Check cache first
    if (useCache && this.cache.has(articleId)) {
      return this.cache.get(articleId);
    }

    try {
      const response = await fetch(`${this.baseUrl}/articles/${articleId}/distribute`, {
        headers: {
          'X-API-Key': this.apiKey,
          'Content-Type': 'application/json',
          'User-Agent': 'WebsiteA-ContentClient/1.0'
        }
      });

      if (!response.ok) {
        throw new Error(`HTTP ${response.status}: ${response.statusText}`);
      }

      const article = await response.json();
      
      // Cache for 1 hour
      if (useCache) {
        this.cache.set(articleId, article);
        setTimeout(() => this.cache.delete(articleId), 3600000);
      }

      return article;
    } catch (error) {
      console.error('Failed to fetch article:', error);
      throw error;
    }
  }

  async fetchMultipleArticles(articleIds: string[]): Promise<Article[]> {
    const promises = articleIds.map(id => this.fetchArticle(id));
    return Promise.all(promises);
  }
}

// Usage in Next.js
export async function getServerSideProps({ params }) {
  const contentClient = new SecureContentClient(
    process.env.CONTENT_API_KEY,
    process.env.CONTENT_API_URL
  );

  try {
    const article = await contentClient.fetchArticle(params.id);
    return { props: { article } };
  } catch (error) {
    return { notFound: true };
  }
}
```

## 📋 Implementation Checklist

### **Backend Setup**
- [ ] Create API key management system
- [ ] Implement rate limiting
- [ ] Add request validation middleware
- [ ] Set up access logging
- [ ] Create admin dashboard for key management
- [ ] Implement usage analytics
- [ ] Add billing integration (if monetizing)

### **AWS Infrastructure**
- [ ] Configure API Gateway with API keys
- [ ] Set up usage plans and rate limits
- [ ] Create DynamoDB tables for keys and logs
- [ ] Set up CloudWatch monitoring
- [ ] Configure Lambda for content distribution
- [ ] Add WAF rules for additional security

### **Consumer Integration**
- [ ] Provide SDK/client libraries
- [ ] Create integration documentation
- [ ] Set up webhook notifications
- [ ] Implement caching strategies
- [ ] Add error handling and retry logic

---

## 💡 Key Takeaway

**Content access control is essential for any headless CMS** that distributes content to external websites. It protects your intellectual property, enables monetization, provides usage analytics, and ensures your content appears only on approved platforms.

The combination of **API keys + domain validation + rate limiting** provides robust security while maintaining ease of integration for authorized consumers.

**Your content, your rules.** 🔐