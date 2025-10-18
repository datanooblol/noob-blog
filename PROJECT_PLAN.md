# Personal Blog Project Plan

## Project Overview
A personal blog website where I am the sole content creator and publisher. The goal is to build a Medium-like blogging platform with a clean editor interface and SEO-optimized public pages.

## Tech Stack

### Frontend
- **Next.js** with TypeScript
- **BlockNote** - Notion-like rich text editor
- **AWS Amplify** - Hosting and deployment

### Backend
- **FastAPI** - Python API server
- **DynamoDB** - NoSQL database for content storage
- **AWS Lambda** - Serverless API hosting

### Development Tools
- **DynamoDB Local** - Local development database
- **Docker** - For running DynamoDB locally

## Architecture

```
Frontend (Next.js) → FastAPI API → DynamoDB
        ↓
AWS Amplify → API Gateway → Lambda (FastAPI)
```

## Development Phases

### Phase 0: MVP (Day 1 Goal)
- [x] **Planned Features:**
  - Creator UI with CRUD operations
  - BlockNote rich text editor
  - Publish/Draft capability
  - Public viewer interface
  - DynamoDB storage via FastAPI

### Phase 1: Authentication
- [ ] **Planned Features:**
  - Login system for Creator only
  - Protected admin routes

## Data Model

### Blog Post Schema (DynamoDB)
```typescript
{
  id: string,              // Primary key
  title: string,           // Post title
  slug: string,            // URL-friendly version of title
  content: object,         // BlockNote JSON format
  metaDescription: string, // SEO description
  keywords: string[],      // SEO keywords
  publishedAt: string,     // ISO date string
  updatedAt: string,       // ISO date string
  published: boolean       // Draft vs Published status
}
```

## Key Features

### Content Management
- **Rich Text Editor**: BlockNote for Medium-like editing experience
- **CRUD Operations**: Create, Read, Update, Delete posts
- **Draft System**: Save drafts before publishing
- **Slug Generation**: Auto-generate SEO-friendly URLs from titles

### SEO Optimization
- **Server-Side Rendering (SSR)**: Next.js ISR for SEO-friendly pages
- **Meta Tags**: Title, description, Open Graph tags
- **Structured Data**: JSON-LD markup for rich snippets
- **Sitemap Generation**: Auto-generated sitemap.xml
- **Clean URLs**: `/posts/my-blog-post-title` format

### Technical Features
- **Incremental Static Regeneration (ISR)**: New posts appear without redeployment
- **Rich Text to HTML Conversion**: BlockNote JSON → HTML for public display
- **Responsive Design**: Mobile-friendly interface

## Application Structure

### Routes
```
/                    # Public homepage
/posts/[slug]        # Public blog post pages (SEO-optimized)
/admin              # Creator dashboard
/admin/posts        # Post management interface
/admin/posts/new    # Create new post
/admin/posts/[id]   # Edit existing post
/admin/login        # Creator authentication
```

### User Experiences

#### Creator Experience (Admin)
- Login required
- Rich text editor with BlockNote
- Post management dashboard
- Preview functionality
- Publish/unpublish controls

#### Viewer Experience (Public)
- No authentication needed
- Clean, readable blog layout
- SEO-optimized pages
- Fast loading with ISR

## Deployment Strategy

### AWS Amplify Configuration
- **Frontend**: Next.js app with ISR support
- **API**: FastAPI deployed as Lambda functions
- **Database**: DynamoDB for content storage
- **CDN**: CloudFront for global content delivery

### ISR Configuration
```javascript
// next.config.js
module.exports = {
  experimental: {
    isrMemoryCacheSize: 0, // Disable in-memory cache for Amplify
  }
}
```

### On-Demand Revalidation
- Trigger page regeneration immediately after publishing
- FastAPI calls Next.js revalidation API after saving posts

## Development Workflow

### Local Development
1. Run DynamoDB Local via Docker
2. Start FastAPI development server
3. Start Next.js development server
4. Use local endpoints for API calls

### Production Deployment
1. Deploy FastAPI to AWS Lambda
2. Deploy Next.js to AWS Amplify
3. Configure API Gateway for FastAPI endpoints
4. Set up DynamoDB tables in AWS

## Key Technical Concepts

### Slug Generation
Convert post titles to URL-friendly strings:
- "My First Blog Post!" → "my-first-blog-post"

### Rich Text Conversion
- Editor: BlockNote JSON format
- Storage: JSON in DynamoDB
- Display: Convert JSON to HTML for public pages

### ISR (Incremental Static Regeneration)
- Pages generated on-demand
- Cached for performance
- Regenerated when content changes
- No redeployment needed for new posts

## Success Criteria

### Day 1 MVP Goals
- [ ] Creator can write and publish posts
- [ ] Public can view published posts
- [ ] Basic SEO optimization
- [ ] Local development environment working
- [ ] Ready for AWS Amplify deployment

### Future Enhancements
- [ ] Advanced authentication
- [ ] Comment system
- [ ] Analytics integration
- [ ] Newsletter signup
- [ ] Search functionality
- [ ] Categories and tags

## Notes
- Focus on minimal viable product first
- Prioritize SEO from the beginning
- Keep architecture simple and scalable
- Use AWS services for easy deployment and scaling