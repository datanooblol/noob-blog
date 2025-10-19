"use client";

import "@blocknote/core/fonts/inter.css";
import { useCreateBlockNote } from "@blocknote/react";
import { BlockNoteView } from "@blocknote/mantine";
import "@blocknote/mantine/style.css";
import { useCallback, useEffect, useState } from "react";
import { useSearchParams } from "next/navigation";
import { articlesAPI } from "@/lib/api";
import "../../article-content.css";

export default function DevEditor() {
  const searchParams = useSearchParams();
  const articleId = searchParams.get("id");

  const editor = useCreateBlockNote();
  const [markdownValue, setMarkdownValue] = useState("");
  const [showMarkdownModal, setShowMarkdownModal] = useState(false);

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

  const loadArticle = useCallback(async () => {
    if (!articleId || !editor) return;

    try {
      const article = await articlesAPI.getById(articleId);
      if (article.content && Array.isArray(article.content)) {
        editor.replaceBlocks(editor.document, article.content);
      }
    } catch (error) {
      console.error("Load error:", error);
    }
  }, [editor, articleId]);

  const handleSave = useCallback(async () => {
    if (!articleId || !editor) return;

    try {
      const content = editor.document;
      const html_content = await editor.blocksToHTMLLossy(content);

      await articlesAPI.update(articleId, {
        content,
        html_content,
      });

      alert("Updated successfully!");
    } catch (error) {
      console.error("Save error:", error);
      alert("Save failed");
    }
  }, [editor, articleId]);

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
            <h1 className="text-2xl font-bold">Article Editor</h1>
            <div className="flex gap-2">
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
