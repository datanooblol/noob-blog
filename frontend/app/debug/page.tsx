"use client";

import "@blocknote/core/fonts/inter.css";
import { useCreateBlockNote } from "@blocknote/react";
import { BlockNoteView } from "@blocknote/mantine";
import "@blocknote/mantine/style.css";
import { ChangeEvent, useCallback, useEffect, useState } from "react";

// import "./styles.css";

const initialMarkdown = "Hello, **world!**";

export default function App() {
  // Creates a new editor instance.
  const editor = useCreateBlockNote();
  const [markdownValue, setMarkdownValue] = useState(initialMarkdown);
  const [articleId, setArticleId] = useState('');

  const handleSubmit = useCallback(async () => {
    const blocks = await editor.tryParseMarkdownToBlocks(markdownValue);
    editor.replaceBlocks(editor.document, blocks);
  }, [editor, markdownValue]);

  const handleLoad = useCallback(async () => {
    if (!articleId.trim()) return;
    
    const token = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJzdWIiOiIyZjkwOTA3Yi0zYTdhLTRiYTgtYTg1Mi1mOGMwOTUwM2U1N2MiLCJleHAiOjE3NjA5MzM2NjR9.Wj6Ode0rxdl_xhS235turd44ncmvvHVwjwIThZaKDVU';
    
    try {
      const response = await fetch(`http://localhost:8001/articles/${articleId}`, {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });
      
      if (response.ok) {
        const article = await response.json();
        editor.replaceBlocks(editor.document, article.content);
        alert('Article loaded!');
      } else {
        alert('Load failed');
      }
    } catch (error) {
      console.error('Load error:', error);
      alert('Load failed');
    }
  }, [editor, articleId]);

  const handleSave = useCallback(async () => {
    const content = editor.document;
    const html_content = await editor.blocksToHTMLLossy(content);
    
    const token = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJzdWIiOiIyZjkwOTA3Yi0zYTdhLTRiYTgtYTg1Mi1mOGMwOTUwM2U1N2MiLCJleHAiOjE3NjA5MzM2NjR9.Wj6Ode0rxdl_xhS235turd44ncmvvHVwjwIThZaKDVU';
    
    try {
      const isUpdate = articleId.trim() !== '';
      const url = isUpdate ? `http://localhost:8001/articles/${articleId}` : 'http://localhost:8001/articles';
      const method = isUpdate ? 'PUT' : 'POST';
      
      const response = await fetch(url, {
        method,
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({
          title: 'Debug Article',
          slug: 'debug-article',
          content,
          html_content,
          cover_image: '',
          tags: [],
          seo_description: '',
          status: 'draft'
        })
      });
      
      if (response.ok) {
        const result = await response.json();
        if (!isUpdate && result.article_id) {
          setArticleId(result.article_id);
        }
        alert(isUpdate ? 'Updated successfully!' : 'Created successfully!');
      } else {
        alert('Save failed');
      }
    } catch (error) {
      console.error('Save error:', error);
      alert('Save failed');
    }
  }, [editor, articleId]);

  // For initialization; on mount, convert the initial Markdown to blocks and replace the default editor's content
  useEffect(() => {
    async function loadInitialHTML() {
      const blocks = await editor.tryParseMarkdownToBlocks(initialMarkdown);
      editor.replaceBlocks(editor.document, blocks);
    }
    loadInitialHTML();
  }, [editor]);

  // Renders the Markdown input and editor instance.
  return (
    <div className="views">
      <div className="view-wrapper">
        <div className="view-label">Markdown Input</div>
        <div className="view">
          <input
            type="text"
            placeholder="Article ID (leave empty for new)"
            value={articleId}
            onChange={(e) => setArticleId(e.target.value)}
            style={{ width: '100%', marginBottom: '8px', padding: '4px' }}
          />
          <code>
            <textarea
              value={markdownValue}
              onChange={(e) => setMarkdownValue(e.target.value)}
            />
          </code>
          <button onClick={handleSubmit} style={{ marginTop: "8px" }}>
            Update Editor
          </button>
          <button onClick={handleLoad} style={{ marginTop: "8px", marginLeft: "8px" }}>
            Load Article
          </button>
        </div>
      </div>
      <div className="view-wrapper">
        <div className="view-label">Editor Output</div>
        <div className="view">
          {editor && <BlockNoteView editor={editor} editable={true} />}
          <button onClick={handleSave} style={{ marginTop: "8px" }}>
            Save to Backend
          </button>
        </div>
      </div>
    </div>
  );
}
