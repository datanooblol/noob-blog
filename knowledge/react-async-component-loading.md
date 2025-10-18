# React Async Component Loading: Timing & Dependencies

## The Problem: Race Conditions with Async Components

When working with React components that initialize asynchronously (like BlockNote editor), you often encounter timing issues where your code tries to use a component before it's ready.

### Common Scenario
```tsx
// ❌ BROKEN: Editor might be undefined
const editor = useCreateBlockNote();

useEffect(() => {
  if (articleId) {
    loadArticle(articleId); // editor could be undefined!
  }
}, [articleId]);

const loadArticle = async (id) => {
  editor.replaceBlocks(editor.document, content); // CRASH!
};
```

## The Solution: Dependency-Driven Effects

### 1. Include Async Dependencies in useEffect
```tsx
// ✅ CORRECT: Wait for editor to exist
useEffect(() => {
  if (articleId && editor) { // Check editor exists
    loadArticle(articleId);
  }
}, [articleId, editor]); // Include editor in dependencies
```

### 2. Add Guard Clauses
```tsx
// ✅ CORRECT: Early return if not ready
const loadArticle = useCallback(async (id) => {
  if (!editor) return; // Exit early if editor not ready
  
  // Safe to use editor here
  editor.replaceBlocks(editor.document, content);
}, [editor]);
```

### 3. The Complete Pattern
```tsx
const MyComponent = () => {
  const editor = useCreateBlockNote(); // Async initialization
  
  const loadData = useCallback(async (id) => {
    if (!editor) return; // Guard clause
    
    // Use editor safely
    const data = await fetchData(id);
    editor.replaceBlocks(editor.document, data.content);
  }, [editor]);
  
  useEffect(() => {
    if (dataId && editor) { // Wait for both conditions
      loadData(dataId);
    }
  }, [dataId, editor, loadData]); // All dependencies
};
```

## Why This Works

### The Flow
1. **Component mounts** → `editor` is `undefined`
2. **Async library initializes** → `editor` becomes available
3. **useEffect re-runs** → Sees `editor` exists, calls function
4. **Function executes** → Editor is ready, operations succeed

### Key Principles
- **Dependency arrays**: Include ALL values used inside useEffect
- **Guard clauses**: Check readiness before operations
- **useCallback**: Prevent infinite re-renders when functions are dependencies

## Common Mistakes

### Missing Dependencies
```tsx
// ❌ Missing editor dependency
useEffect(() => {
  if (editor) doSomething();
}, []); // Should be [editor]
```

### No Guard Clauses
```tsx
// ❌ No safety check
const doSomething = () => {
  editor.method(); // Could crash
};

// ✅ With guard
const doSomething = () => {
  if (!editor) return;
  editor.method();
};
```

### setTimeout Workarounds
```tsx
// ❌ Fragile timing hack
setTimeout(() => {
  editor.method(); // Still might fail
}, 100);

// ✅ Proper dependency waiting
useEffect(() => {
  if (editor) editor.method();
}, [editor]);
```

## Real-World Example: BlockNote Editor

```tsx
export default function ArticleEditor() {
  const editor = useCreateBlockNote();
  const [articleId, setArticleId] = useState(null);
  
  const loadArticle = useCallback(async (id) => {
    if (!editor) return; // Wait for editor
    
    const article = await api.getArticle(id);
    
    try {
      // Primary: Load JSON blocks
      editor.replaceBlocks(editor.document, article.content);
    } catch {
      // Fallback: Convert HTML to blocks
      if (article.html_content) {
        const blocks = editor.tryParseHTMLToBlocks(article.html_content);
        editor.replaceBlocks(editor.document, blocks);
      }
    }
  }, [editor]);
  
  useEffect(() => {
    if (articleId && editor) { // Both conditions required
      loadArticle(articleId);
    }
  }, [articleId, editor, loadArticle]);
}
```

## Best Practices

1. **Always include async dependencies** in useEffect arrays
2. **Add guard clauses** in functions that use async components
3. **Use useCallback** for functions in dependency arrays
4. **Avoid setTimeout hacks** - use proper dependency waiting
5. **Test edge cases** where components might not be ready

This pattern applies to any async React component: editors, maps, charts, media players, etc.