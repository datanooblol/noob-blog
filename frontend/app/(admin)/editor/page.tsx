"use client";

import "@blocknote/core/fonts/inter.css";
import { useCreateBlockNote } from "@blocknote/react";
import { BlockNoteView } from "@blocknote/mantine";
import "@blocknote/mantine/style.css";
import "../../shared-blocknote.css";
import { useCallback, useEffect, useState } from "react";
import { useSearchParams, useRouter } from "next/navigation";
import { blogAPI, uploadAPI } from "@/lib/api";
import "./editor-styles.css";

// Use presigned URL for S3 upload
async function uploadFile(file: File, blogId?: string) {
  console.log("step0");
  if (!blogId) {
    throw new Error("Blog ID is required for upload");
  }
  console.log("step1");
  // Step 1: Get presigned URL
  const { upload_url, public_url } = await uploadAPI.getPresignedUrl(
    file.name,
    file.type,
    blogId
  );
  console.log("step2");
  // Step 2: Upload directly to S3
  const uploadResponse = await fetch(upload_url, {
    method: "PUT",
    body: file,
  });

  if (!uploadResponse.ok) {
    throw new Error("S3 upload failed");
  }
  console.log("step3");
  // Step 3: Return public URL
  return public_url;
}

export default function BlogEditor() {
  const searchParams = useSearchParams();
  const router = useRouter();
  const blogId = searchParams.get("id");
  const isEditMode = !!blogId;

  const editor = useCreateBlockNote({
    tables: {
      splitCells: true,
      cellBackgroundColor: true,
      cellTextColor: true,
      headers: true,
    },
    uploadFile: (file: File) => uploadFile(file, blogId || undefined),
  });
  const [markdownValue, setMarkdownValue] = useState("");
  const [showMarkdownModal, setShowMarkdownModal] = useState(false);
  const [title, setTitle] = useState("");
  const [slug, setSlug] = useState("");
  const [status, setStatus] = useState("draft");
  const [redirectUrl, setRedirectUrl] = useState("");
  const [tags, setTags] = useState<string[]>([]);
  const [tagInput, setTagInput] = useState("");
  const [seoDescription, setSeoDescription] = useState("");
  const [hasUnsavedChanges, setHasUnsavedChanges] = useState(false);
  // const [lastSavedContent, setLastSavedContent] = useState<string | null>(null);

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

  const loadBlog = useCallback(async () => {
    if (!blogId || !editor) return;

    try {
      const blog = await blogAPI.getById(blogId);
      setTitle(blog.title || "");
      setSlug(blog.slug || generateSlug(blog.title || ""));
      setStatus(blog.status || "draft");
      setRedirectUrl(blog.redirect_url || "");
      setTags(blog.tags || []);
      setSeoDescription(blog.seo_description || "");

      if (
        blog.content &&
        Array.isArray(blog.content) &&
        blog.content.length > 0
      ) {
        try {
          console.log("Loading JSON blocks:", blog.content);
          editor.replaceBlocks(editor.document, blog.content);
          // setLastSavedContent(JSON.stringify(article.content));
          console.log("JSON blocks loaded successfully");
        } catch (error) {
          console.log("JSON blocks failed, trying HTML fallback:", error);
          if (blog.html_content) {
            try {
              console.log("HTML content:", blog.html_content);
              const blocks = editor.tryParseHTMLToBlocks(blog.html_content);
              console.log("Parsed HTML to blocks:", blocks);
              editor.replaceBlocks(editor.document, blocks);
              // setLastSavedContent(JSON.stringify(blocks));
              console.log("Using HTML fallback");
            } catch (htmlError) {
              console.error(
                "Failed to load both JSON and HTML content:",
                htmlError
              );
            }
          }
        }
        setHasUnsavedChanges(false);
      }
    } catch (error) {
      console.error("Failed to load blog:", error);
    }
  }, [editor, blogId, generateSlug]);

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

        await blogAPI.update(blogId!, {
          title,
          slug,
          content,
          html_content,
          status: newStatus,
          redirect_url: redirectUrl,
          tags,
          seo_description: seoDescription,
        });

        setStatus(newStatus);
        alert(`Status changed to ${newStatus}!`);
      } catch (error) {
        console.error("Status change error:", error);
        alert("Status change failed");
      }
    },
    [editor, blogId, title, slug, status, redirectUrl, tags, seoDescription]
  );

  const handleSave = useCallback(async () => {
    if (!editor) return;

    try {
      const content = editor.document;
      const html_content = await editor.blocksToHTMLLossy(content);
      const payload = {
        title,
        slug,
        content,
        html_content,
        status,
        redirect_url: redirectUrl,
        tags,
        seo_description: seoDescription,
      };

      if (isEditMode && blogId) {
        await blogAPI.update(blogId, payload);
        alert("Updated successfully!");
      } else {
        const newBlog = await blogAPI.create(payload);
        alert("Created successfully!");
        router.push(`/editor?id=${newBlog.blog_id}`);
      }

      // setLastSavedContent(JSON.stringify(content));
      setHasUnsavedChanges(false);
    } catch (error) {
      console.error("Save error:", error);
      alert("Save failed");
    }
  }, [
    editor,
    blogId,
    isEditMode,
    title,
    slug,
    status,
    redirectUrl,
    tags,
    seoDescription,
    router,
  ]);

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

  const addTag = useCallback(() => {
    const trimmedTag = tagInput.trim();
    if (trimmedTag && !tags.includes(trimmedTag)) {
      setTags([...tags, trimmedTag]);
      setTagInput("");
    }
  }, [tagInput, tags]);

  const removeTag = useCallback(
    (tagToRemove: string) => {
      setTags(tags.filter((tag) => tag !== tagToRemove));
    },
    [tags]
  );

  const handleTagKeyPress = useCallback(
    (e: React.KeyboardEvent) => {
      if (e.key === "Enter") {
        e.preventDefault();
        addTag();
      }
    },
    [addTag]
  );

  // Track title/slug/redirect/tags/seo changes
  useEffect(() => {
    if (title || slug || redirectUrl || tags.length > 0 || seoDescription) {
      setHasUnsavedChanges(true);
    }
  }, [title, slug, redirectUrl, tags, seoDescription]);

  // Auto-create draft for new articles or load existing
  useEffect(() => {
    const initializeEditor = async () => {
      if (!editor) return;

      if (blogId) {
        // Load existing blog
        loadBlog();
      } else {
        // Create draft blog for new posts
        try {
          const newBlog = await blogAPI.create({
            title: "Untitled Blog",
            content: [],
            status: "draft",
          });
          // Update URL with new blog ID
          router.replace(`/editor?id=${newBlog.blog_id}`);
        } catch (error) {
          console.error("Failed to create draft blog:", error);
        }
      }
    };

    initializeEditor();
  }, [blogId, editor, loadBlog, router]);

  // Warn before leaving page with unsaved changes
  useEffect(() => {
    // Expose unsaved changes state to window for admin layout
    (window as unknown as { hasUnsavedChanges: boolean }).hasUnsavedChanges =
      hasUnsavedChanges;

    const handleBeforeUnload = (e: BeforeUnloadEvent) => {
      if (hasUnsavedChanges) {
        e.preventDefault();
        e.returnValue =
          "You have unsaved changes. Are you sure you want to leave?";
        return "You have unsaved changes. Are you sure you want to leave?";
      }
    };

    window.addEventListener("beforeunload", handleBeforeUnload);
    return () => {
      window.removeEventListener("beforeunload", handleBeforeUnload);
      (window as unknown as { hasUnsavedChanges: boolean }).hasUnsavedChanges =
        false;
    };
  }, [hasUnsavedChanges]);

  return (
    <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
      <div className="bg-white rounded-lg shadow-sm p-8">
        <div className="flex justify-between items-center mb-6">
          <div className="flex items-center gap-4">
            <h1 className="text-2xl font-bold">Blog Editor</h1>
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
            placeholder="Enter your blog title..."
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
                placeholder="blog-slug"
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
                ℹ️ Visitors to this blog will be redirected to the URL above
                (301 redirect)
              </div>
            )}
          </div>
        </div>

        {/* SEO Description Section */}
        <div className="mb-6">
          <label className="block text-sm font-medium text-gray-700 mb-2">
            SEO Description
          </label>
          <textarea
            value={seoDescription}
            onChange={(e) => setSeoDescription(e.target.value)}
            placeholder="Brief description for search engines and social media (150-160 characters recommended)..."
            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:border-blue-500 resize-none"
            rows={3}
            maxLength={200}
          />
          <div className="flex justify-between text-xs text-gray-500 mt-1">
            <span>Used for search results and social media previews</span>
            <span
              className={seoDescription.length > 160 ? "text-orange-600" : ""}
            >
              {seoDescription.length}/160 characters
            </span>
          </div>
        </div>

        {/* Tags Section */}
        <div className="mb-6 p-4 border border-gray-200 rounded-lg bg-gray-50">
          <h3 className="text-sm font-medium text-gray-700 mb-3">Tags</h3>
          <div className="flex flex-wrap gap-2 mb-3">
            {tags.map((tag) => (
              <span
                key={tag}
                className="bg-blue-100 text-blue-800 px-3 py-1 rounded-full text-sm flex items-center gap-2"
              >
                {tag}
                <button
                  onClick={() => removeTag(tag)}
                  className="text-blue-600 hover:text-blue-800 font-bold"
                >
                  ×
                </button>
              </span>
            ))}
          </div>
          <div className="flex gap-2">
            <input
              type="text"
              value={tagInput}
              onChange={(e) => setTagInput(e.target.value)}
              onKeyPress={handleTagKeyPress}
              placeholder="Add a tag (press Enter)"
              className="flex-1 px-3 py-2 border border-gray-300 rounded focus:outline-none focus:border-blue-500"
            />
            <button
              onClick={addTag}
              disabled={!tagInput.trim()}
              className="px-4 py-2 bg-blue-500 text-white rounded hover:bg-blue-600 disabled:opacity-50"
            >
              Add Tag
            </button>
          </div>
        </div>

        <div className="prose max-w-none">
          {editor && <BlockNoteView editor={editor} editable={true} />}
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
