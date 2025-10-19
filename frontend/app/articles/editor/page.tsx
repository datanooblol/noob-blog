"use client";

import "@blocknote/core/fonts/inter.css";
import { useCreateBlockNote } from "@blocknote/react";
import { BlockNoteView } from "@blocknote/mantine";
import "@blocknote/mantine/style.css";
import { useCallback, useEffect, useState } from "react";
import { useSearchParams, useRouter } from "next/navigation";
import { articlesAPI } from "@/lib/api";

export default function ArticleEditor() {
  const searchParams = useSearchParams();
  const router = useRouter();
  const articleId = searchParams.get("id");
  const isEditMode = !!articleId;

  const editor = useCreateBlockNote({
    tables: {
      splitCells: true,
      cellBackgroundColor: true,
      cellTextColor: true,
      headers: true,
    },
  });
  const [markdownValue, setMarkdownValue] = useState("");
  const [showMarkdownModal, setShowMarkdownModal] = useState(false);
  const [title, setTitle] = useState("");
  const [slug, setSlug] = useState("");
  const [status, setStatus] = useState("draft");
  const [redirectUrl, setRedirectUrl] = useState("");
  const [hasUnsavedChanges, setHasUnsavedChanges] = useState(false);
  const [lastSavedContent, setLastSavedContent] = useState(null);

  const handleMarkdownSave = useCallback(async () => {
    const blocks = await editor.tryParseMarkdownToBlocks(markdownValue);
    editor.replaceBlocks(editor.document, blocks);
    setShowMarkdownModal(false);
    setMarkdownValue("");
  }, [editor, markdownValue]);

  const handleMarkdownCancel = useCallback(() => {
    setShowMarkdownModal(false);
    setMarkdownValue("");
  }, []);

  const generateSlug = useCallback((title: string) => {
    return title
      .toLowerCase()
      .replace(/[^\w\s-]/g, "")
      .replace(/[-\s]+/g, "-")
      .trim();
  }, []);

  const loadArticle = useCallback(async () => {
    if (!articleId || !editor) return;

    try {
      const article = await articlesAPI.getById(articleId);
      setTitle(article.title || "");
      setSlug(article.slug || generateSlug(article.title || ""));
      setStatus(article.status || "draft");
      setRedirectUrl(article.redirect_url || "");

      if (
        article.content &&
        Array.isArray(article.content) &&
        article.content.length > 0
      ) {
        try {
          console.log('Loading JSON blocks:', article.content);
          editor.replaceBlocks(editor.document, article.content);
          setLastSavedContent(JSON.stringify(article.content));
          console.log('JSON blocks loaded successfully');
        } catch (error) {
          console.log('JSON blocks failed, trying HTML fallback:', error);
          if (article.html_content) {
            try {
              console.log('HTML content:', article.html_content);
              const blocks = editor.tryParseHTMLToBlocks(article.html_content);
              console.log('Parsed HTML to blocks:', blocks);
              editor.replaceBlocks(editor.document, blocks);
              setLastSavedContent(JSON.stringify(blocks));
              console.log("Using HTML fallback");
            } catch (htmlError) {
              console.error("Failed to load both JSON and HTML content:", htmlError);
            }
          }
        }
        setHasUnsavedChanges(false);
      }
    } catch (error) {
      console.error("Failed to load article:", error);
    }
  }, [editor, articleId, generateSlug]);

  const handleStatusChange = useCallback(
    async (newStatus: string) => {
      if (newStatus === status) return;

      const confirmed = confirm(
        `Change status from ${status} to ${newStatus}?`
      );
      if (!confirmed) return;

      try {
        const content = editor.document;
        const html_content = await editor.blocksToHTMLLossy(content);

        await articlesAPI.update(articleId, {
          title,
          slug,
          content,
          html_content,
          status: newStatus,
          redirect_url: redirectUrl,
        });

        setStatus(newStatus);
        alert(`Status changed to ${newStatus}!`);
      } catch (error) {
        console.error("Status change error:", error);
        alert("Status change failed");
      }
    },
    [editor, articleId, title, slug, status, redirectUrl]
  );

  const handleSave = useCallback(async () => {
    if (!editor) return;

    try {
      const content = editor.document;
      const html_content = await editor.blocksToHTMLLossy(content);
      const payload = { title, slug, content, html_content, status, redirect_url: redirectUrl };

      if (isEditMode && articleId) {
        await articlesAPI.update(articleId, payload);
        alert("Updated successfully!");
      } else {
        const newArticle = await articlesAPI.create(payload);
        alert("Created successfully!");
        router.push(`/articles/editor?id=${newArticle.article_id}`);
      }

      setLastSavedContent(JSON.stringify(content));
      setHasUnsavedChanges(false);
    } catch (error) {
      console.error("Save error:", error);
      alert("Save failed");
    }
  }, [editor, articleId, isEditMode, title, slug, status, redirectUrl, router]);

  const handleBackToDashboard = useCallback(() => {
    if (hasUnsavedChanges) {
      const shouldSave = confirm(
        "You have unsaved changes. Do you want to save before leaving?"
      );
      if (shouldSave) {
        handleSave().then(() => {
          router.push("/dashboard");
        });
      } else {
        router.push("/dashboard");
      }
    } else {
      router.push("/dashboard");
    }
  }, [hasUnsavedChanges, handleSave, router]);

  // Track title/slug/redirect changes only
  useEffect(() => {
    if (title || slug || redirectUrl) {
      setHasUnsavedChanges(true);
    }
  }, [title, slug, redirectUrl]);

  // Load article content on mount
  useEffect(() => {
    if (articleId && editor) {
      loadArticle();
    }
  }, [articleId, editor, loadArticle]);

  return (
    <div className="min-h-screen bg-gray-50 p-8">
      <div className="max-w-4xl mx-auto">
        <div className="bg-white rounded-lg shadow-sm p-8">
          <div className="flex justify-between items-center mb-6">
            <div className="flex items-center gap-4">
              <button
                onClick={handleBackToDashboard}
                className="px-3 py-1 text-gray-600 hover:text-gray-800"
              >
                ← Back to Dashboard
              </button>
              <h1 className="text-2xl font-bold">Article Editor</h1>
              {hasUnsavedChanges && (
                <span className="text-sm text-orange-600 font-medium">
                  • Unsaved changes
                </span>
              )}
            </div>
            <div className="flex gap-2 items-center">
              <div className="flex items-center gap-2">
                <span className="text-sm text-gray-600">Status:</span>
                <select
                  value={status}
                  onChange={(e) => handleStatusChange(e.target.value)}
                  className="px-3 py-1 border border-gray-300 rounded text-sm capitalize"
                >
                  <option value="draft">Draft</option>
                  <option value="published">Published</option>
                  <option value="archived">Archived</option>
                </select>
              </div>
              <button
                onClick={() => setShowMarkdownModal(true)}
                className="px-4 py-2 bg-blue-500 text-white rounded hover:bg-blue-600"
              >
                Import Markdown
              </button>
              <button
                onClick={handleSave}
                className="px-4 py-2 bg-green-500 text-white rounded hover:bg-green-600"
              >
                Save
              </button>
            </div>
          </div>

          <div className="mb-6">
            <input
              type="text"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="Enter your article title..."
              className="w-full text-4xl font-bold border-none p-0 focus:outline-none placeholder:text-gray-400 mb-4"
            />
            <div className="space-y-2">
              <div className="flex items-center gap-2 text-sm text-gray-600">
                <span>URL:</span>
                <span className="text-gray-400">/blog/</span>
                <input
                  type="text"
                  value={slug}
                  onChange={(e) => setSlug(e.target.value)}
                  placeholder="article-slug"
                  className="text-sm border-none p-0 focus:outline-none bg-transparent"
                />
              </div>
              <div className="flex items-center gap-2 text-sm">
                <span className="text-gray-600">Redirect to:</span>
                <input
                  type="url"
                  value={redirectUrl}
                  onChange={(e) => setRedirectUrl(e.target.value)}
                  placeholder="https://example.com/new-location (optional)"
                  className="flex-1 text-sm border border-gray-300 rounded px-2 py-1 focus:outline-none focus:border-blue-500"
                />
                {redirectUrl && (
                  <button
                    onClick={() => setRedirectUrl("")}
                    className="text-red-500 hover:text-red-700 text-sm"
                  >
                    Clear
                  </button>
                )}
              </div>
              {redirectUrl && (
                <div className="text-xs text-blue-600 bg-blue-50 p-2 rounded">
                  ℹ️ Visitors to this article will be redirected to the URL above (301 redirect)
                </div>
              )}
            </div>
          </div>

          <div className="prose max-w-none">
            {editor && <BlockNoteView editor={editor} editable={true} />}
          </div>
        </div>
      </div>

      {/* Markdown Import Modal */}
      {showMarkdownModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6 w-full max-w-2xl mx-4">
            <h3 className="text-lg font-semibold mb-4">Import Markdown</h3>
            <textarea
              value={markdownValue}
              onChange={(e) => setMarkdownValue(e.target.value)}
              placeholder="Paste your markdown content here..."
              className="w-full h-64 p-3 border border-gray-300 rounded-md resize-none font-mono text-sm"
            />
            <div className="flex gap-2 mt-4">
              <button
                onClick={handleMarkdownSave}
                disabled={!markdownValue.trim()}
                className="px-4 py-2 bg-blue-500 text-white rounded hover:bg-blue-600 disabled:opacity-50"
              >
                Save
              </button>
              <button
                onClick={handleMarkdownCancel}
                className="px-4 py-2 bg-gray-500 text-white rounded hover:bg-gray-600"
              >
                Cancel
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}