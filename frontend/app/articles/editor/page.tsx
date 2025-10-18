"use client";

import React, { useState, useEffect, useCallback } from "react";
import { useSearchParams } from "next/navigation";
import { useCreateBlockNote } from "@blocknote/react";
import { BlockNoteSchema, defaultBlockSpecs } from "@blocknote/core";
import { BlockNoteView } from "@blocknote/mantine";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { articlesAPI } from "@/lib/api";
import "@blocknote/core/fonts/inter.css";
import "@blocknote/mantine/style.css";
import { useRouter } from "next/navigation";
import "../../article-content.css";
import "../../blocknote-editor.css";

export default function ArticleEditor() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const articleId = searchParams.get("id");
  const isEditMode = !!articleId;

  const [title, setTitle] = useState("");
  const [slug, setSlug] = useState("");
  const [loading, setLoading] = useState(false);
  const [status, setStatus] = useState("draft");
  const [isPreview, setIsPreview] = useState(false);
  const [previewHtml, setPreviewHtml] = useState("");
  const [showMarkdownImport, setShowMarkdownImport] = useState(false);
  const [markdownText, setMarkdownText] = useState("");
  const [forceRender, setForceRender] = useState(0);
  const [editorKey, setEditorKey] = useState(0);

  const editor = useCreateBlockNote({
    tables: {
      splitCells: true,
      cellBackgroundColor: true,
      cellTextColor: true,
      headers: true,
    },
  });

  const generateSlug = (title: string) => {
    return title
      .toLowerCase()
      .replace(/[^\w\s-]/g, "")
      .replace(/[-\s]+/g, "-")
      .trim();
  };

  useEffect(() => {
    if (!isEditMode && title && !slug) {
      setSlug(generateSlug(title));
    }
  }, [title, isEditMode, slug]);

  const generatePreview = async () => {
    const content = editor.document;
    const html = await editor.blocksToHTMLLossy(content);
    setPreviewHtml(html);
  };

  const togglePreview = async () => {
    if (!isPreview) {
      await generatePreview();
    }
    setIsPreview(!isPreview);
  };

  const loadArticle = useCallback(
    async (id: string) => {
      if (!editor) return;

      try {
        const article = await articlesAPI.getById(id);
        setTitle(article.title || "");
        setSlug(article.slug || generateSlug(article.title || ""));
        setStatus(article.status || "draft");

        if (
          article.content &&
          Array.isArray(article.content) &&
          article.content.length > 0
        ) {
          try {
            editor.replaceBlocks(editor.document, article.content);
          } catch {
            if (article.html_content) {
              try {
                const blocks = editor.tryParseHTMLToBlocks(
                  article.html_content
                );
                editor.replaceBlocks(editor.document, blocks);
              } catch {
                console.error("Failed to load both JSON and HTML content");
              }
            }
          }
        }
      } catch (error) {
        console.error("Failed to load article:", error);
      }
    },
    [editor, generateSlug]
  );

  useEffect(() => {
    if (isEditMode && articleId && editor) {
      loadArticle(articleId);
    }
  }, [articleId, isEditMode, editor, loadArticle]);

  const handleSave = async (shouldPublish = false) => {
    setLoading(true);
    try {
      const content = editor.document;
      const html_content = await editor.blocksToHTMLLossy(content);
      const payload = { title, slug, content, html_content };

      if (isEditMode && articleId) {
        await articlesAPI.update(articleId, payload);
        alert("Article updated!");
      } else {
        const newArticle = await articlesAPI.create(payload);
        if (shouldPublish) {
          await articlesAPI.publish(newArticle.article_id);
          alert("Article created and published!");
        } else {
          alert("Article created!");
        }
      }
    } catch (error) {
      console.error("Failed to save article:", error);
      alert("Failed to save article");
    } finally {
      setLoading(false);
    }
  };

  const handlePublish = async () => {
    if (!isEditMode || !articleId) return;
    setLoading(true);
    try {
      await articlesAPI.publish(articleId);
      setStatus("published");
      alert("Article published!");
    } catch (error) {
      console.error("Failed to publish article:", error);
      alert("Failed to publish article");
    } finally {
      setLoading(false);
    }
  };

  const handleStatusChange = async (newStatus: string) => {
    if (!isEditMode || !articleId) return;
    setLoading(true);
    try {
      const content = editor.document;
      await articlesAPI.update(articleId, {
        title,
        slug,
        content,
        status: newStatus,
      });
      setStatus(newStatus);
      alert(`Article ${newStatus}!`);
    } catch (error) {
      console.error(`Failed to change status to ${newStatus}:`, error);
      alert(`Failed to change status to ${newStatus}`);
    } finally {
      setLoading(false);
    }
  };

  const handleMarkdownImport = useCallback(
    async () => {
      try {
        console.log("Importing markdown:", markdownText);
        
        const blocks = await editor.tryParseMarkdownToBlocks(markdownText);
        console.log("Parsed blocks:", blocks);
        
        // Replace all blocks with markdown content
        editor.replaceBlocks(editor.document, blocks);
        
        // Force complete editor recreation for existing articles
        if (isEditMode) {
          setEditorKey(prev => prev + 1);
        }
        
        // Force React re-render
        setForceRender(prev => prev + 1);
        
        console.log("Blocks imported successfully");
        
        setMarkdownText("");
        setShowMarkdownImport(false);
        alert("Markdown imported successfully!");
      } catch (error) {
        console.error("Failed to parse markdown:", error);
        alert(`Failed to parse markdown: ${error.message}`);
      }
    },
    [editor, markdownText]
  );

  const handleDelete = async () => {
    if (!isEditMode || !articleId) return;
    if (
      !confirm(
        "Are you sure you want to delete this article? This action cannot be undone."
      )
    )
      return;

    setLoading(true);
    try {
      await articlesAPI.delete(articleId);
      alert("Article deleted!");
      router.push("/dashboard");
    } catch (error) {
      console.error("Failed to delete article:", error);
      alert("Failed to delete article");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="bg-white border-b px-6 py-4">
        <div className="max-w-4xl mx-auto flex justify-between items-center">
          <div className="flex items-center gap-4">
            <Button
              variant="ghost"
              onClick={() => router.push("/dashboard")}
              size="sm"
            >
              ← Back
            </Button>
            {isEditMode && (
              <span className="text-sm text-gray-600">
                Status:{" "}
                <span
                  className={`capitalize font-medium px-2 py-1 rounded text-xs ${
                    status === "published"
                      ? "bg-green-100 text-green-700"
                      : status === "draft"
                      ? "bg-yellow-100 text-yellow-700"
                      : "bg-gray-100 text-gray-700"
                  }`}
                >
                  {status}
                </span>
              </span>
            )}
          </div>

          <div className="flex gap-2">
            <Button
              onClick={() => setShowMarkdownImport(true)}
              variant="outline"
              size="sm"
            >
              Import MD
            </Button>
            
            <Button
              onClick={togglePreview}
              variant={isPreview ? "default" : "outline"}
              size="sm"
            >
              {isPreview ? "Edit" : "Preview"}
            </Button>

            <Button
              onClick={() => handleSave(false)}
              disabled={loading}
              variant="outline"
              size="sm"
            >
              {loading ? "Saving..." : "Save Draft"}
            </Button>

            {!isEditMode && (
              <Button
                onClick={() => handleSave(true)}
                disabled={loading}
                size="sm"
              >
                Create & Publish
              </Button>
            )}

            {isEditMode && status === "draft" && (
              <Button onClick={handlePublish} disabled={loading} size="sm">
                Publish
              </Button>
            )}

            {isEditMode && status === "published" && (
              <>
                <Button
                  onClick={() => handleStatusChange("draft")}
                  disabled={loading}
                  variant="secondary"
                  size="sm"
                >
                  Unpublish
                </Button>
                <Button
                  onClick={() => handleStatusChange("archived")}
                  disabled={loading}
                  variant="destructive"
                  size="sm"
                >
                  Archive
                </Button>
              </>
            )}

            {isEditMode && status === "archived" && (
              <Button
                onClick={() => handleStatusChange("draft")}
                disabled={loading}
                variant="secondary"
                size="sm"
              >
                Restore to Draft
              </Button>
            )}

            {isEditMode && (
              <Button
                onClick={handleDelete}
                disabled={loading}
                variant="destructive"
                size="sm"
              >
                Delete
              </Button>
            )}
          </div>
        </div>
      </div>

      <div className="max-w-4xl mx-auto p-8">
        <div className="bg-white rounded-lg shadow-sm p-8">
          <div className="mb-8">
            {isPreview ? (
              <h1 className="text-5xl font-bold mb-6 text-gray-900 leading-tight">
                {title || "Untitled Article"}
              </h1>
            ) : (
              <>
                <Input
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                  placeholder="Enter your article title..."
                  className="text-4xl font-bold border-none p-0 focus-visible:ring-0 placeholder:text-gray-400 mb-4"
                  style={{ fontSize: "2.25rem", lineHeight: "2.5rem" }}
                />
                <div className="flex items-center gap-2 text-sm text-gray-600">
                  <span>URL:</span>
                  <span className="text-gray-400">/blog/</span>
                  <Input
                    value={slug}
                    onChange={(e) => setSlug(e.target.value)}
                    placeholder="article-slug"
                    disabled={status === "published"}
                    className="text-sm border-none p-0 focus-visible:ring-0 bg-transparent disabled:opacity-50"
                  />
                  {status === "published" && (
                    <span className="text-xs text-amber-600 ml-2">
                      🔒 Locked after publish
                    </span>
                  )}
                </div>
              </>
            )}
          </div>

          <div className="prose max-w-none">
            {isPreview ? (
              <div
                className="article-content"
                dangerouslySetInnerHTML={{ __html: previewHtml }}
              />
            ) : (
              <BlockNoteView key={`${forceRender}-${editorKey}`} editor={editor} />
            )}
          </div>
        </div>
      </div>
      
      {/* Markdown Import Modal */}
      {showMarkdownImport && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6 w-full max-w-2xl mx-4">
            <h3 className="text-lg font-semibold mb-4">Import Markdown</h3>
            <textarea
              value={markdownText}
              onChange={(e) => setMarkdownText(e.target.value)}
              placeholder="Paste your markdown content here..."
              className="w-full h-64 p-3 border border-gray-300 rounded-md resize-none font-mono text-sm"
            />
            <div className="flex gap-2 mt-4">
              <Button onClick={handleMarkdownImport} disabled={!markdownText.trim()}>
                Import
              </Button>
              <Button 
                variant="outline" 
                onClick={() => {
                  setShowMarkdownImport(false);
                  setMarkdownText("");
                }}
              >
                Cancel
              </Button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
