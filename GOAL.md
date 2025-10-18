# Personal Portfolio Website with Blog - Project Goals

## 🎯 Main Objective
Create a personal portfolio website that showcases skills and experiences, with an integrated blog system for documenting learning journey and reflections.

## 👥 Target Users

### Creator (Website Owner)
- **Authentication**: Register, login, manage profile
- **Content Management**: CRUD articles with rich text editor (BlockNote)
- **Media Management**: Upload images for covers and content
- **SEO Optimization**: Custom slugs, tags, metadata, descriptions
- **Publishing Control**: Draft → Publish → Archive workflow
- **Analytics**: View article statistics and engagement
- **Organization**: Search, filter, and categorize personal articles

### Viewers (Public Audience)
- **Content Discovery**: Browse published articles
- **Search & Filter**: Find content by keywords, tags, categories
- **Portfolio Exploration**: Learn about the creator through dedicated pages
- **Contact**: Reach out through contact forms

## 🏗️ Website Structure

### Core Pages
1. **Home** - Introduction and featured content
2. **About** - Personal background and skills showcase
3. **Blog** - Article listing and individual posts
4. **Contact** - Contact form and information

### Blog Features
- Rich text editing with BlockNote editor
- Image uploads and management
- SEO-friendly URLs and metadata
- Tag-based categorization
- Draft/publish/archive states
- Search and filtering capabilities

## 🛠️ Technical Stack

### Backend
- **Framework**: FastAPI with Python
- **Database**: DynamoDB (local development)
- **Storage**: S3 (LocalStack for development)
- **Authentication**: Custom JWT-based auth
- **Architecture**: Clean separation with routers, services, and models

### Frontend (Future)
- Modern React/Next.js application
- BlockNote rich text editor
- Responsive design for all devices

## 📊 Data Models

### Users
- Authentication and profile information
- Creator permissions and settings

### Articles
- Rich content with BlockNote JSON structure
- SEO metadata (title, slug, description, tags)
- Publishing workflow (draft → published → archived)
- Media attachments and cover images

### Pages
- Static content for portfolio sections
- Customizable layouts and media

## 🚀 Development Phases

### Phase 1: Core Blog System ✅
- [x] User authentication (register, login, profile)
- [x] Basic article CRUD operations
- [x] BlockNote content structure support
- [x] Database and S3 integration

### Phase 2: Content Management (Current)
- [ ] Complete article management (update, delete, search)
- [ ] Image upload system
- [ ] SEO optimization features
- [ ] Publishing workflow

### Phase 3: Portfolio Features
- [ ] Static page management (home, about, contact)
- [ ] Contact form functionality
- [ ] Media gallery management

### Phase 4: Enhancement
- [ ] Search and filtering system
- [ ] Analytics and view tracking
- [ ] Performance optimization
- [ ] Frontend development

## 🎨 Design Principles
- **User-Centric**: Intuitive interface for both creator and viewers
- **SEO-Optimized**: Search engine friendly structure and metadata
- **Performance-First**: Fast loading and responsive design
- **Scalable**: Architecture that grows with content and traffic
- **Maintainable**: Clean code structure for easy updates

## 📈 Success Metrics
- Smooth content creation and publishing workflow
- Fast page load times and good SEO rankings
- Positive user engagement with blog content
- Professional portfolio presentation
- Easy maintenance and content updates

---

*This document serves as the north star for development decisions and feature prioritization.*