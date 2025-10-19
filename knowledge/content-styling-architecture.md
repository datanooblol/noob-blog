# Content Styling Architecture

## Overview
This document outlines our approach to separating content creation from content presentation in the blog system.

## Architecture Decision
We maintain separate CSS concerns for the editor and display:

### Editor (`/editor`)
- **Minimal CSS**: Only essential BlockNote functionality
- **No positioning overrides**: Prevents click detection issues
- **Clean editing experience**: Focus on content creation, not styling

### Blog Display (`/blog/[slug]`)
- **Full styling**: Complete visual presentation
- **Image alignment**: Proper BlockNote data-attribute handling
- **Reader-optimized**: Typography and spacing for consumption

## Benefits

### 1. Functional Editor
- No CSS conflicts that block clicks or break UI
- Reliable content creation experience
- Easy to maintain and debug

### 2. Portable Content
- Clean HTML output without presentation coupling
- Content can be consumed by any system
- API consumers can apply their own styling

### 3. Separation of Concerns
- Content creation vs content presentation
- Editor focused on functionality
- Display focused on user experience

### 4. Flexibility
- Multiple display contexts possible
- Easy to create new styled views
- Third parties can style content as needed

## Implementation

### Files
- `shared-blocknote.css`: Minimal editor styles only
- `article-content.css`: Full blog display styles
- Editor imports minimal CSS
- Blog pages import both minimal + display CSS

### CSS Strategy
```
Editor: BlockNote base + minimal shared
Blog:   BlockNote base + minimal shared + article-content
```

## Future Considerations
- Multiple display themes
- API-only content delivery
- Third-party content syndication
- Mobile app consumption