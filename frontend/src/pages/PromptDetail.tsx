import { useEffect, useState, useCallback, useRef } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { api, ApiError } from '../lib/api';
import type { Prompt } from '../types/prompt';
import { RichTextEditor } from '../components/RichTextEditor';
import TurndownService from 'turndown';

interface TagsResponse {
  tags: string[];
}

interface Toast {
  id: number;
  type: 'success' | 'error';
  message: string;
}

export function PromptDetail() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();

  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [deleting, setDeleting] = useState(false);
  const [showDeleteDialog, setShowDeleteDialog] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Form state
  const [title, setTitle] = useState('');
  const [content, setContent] = useState('');
  const [category, setCategory] = useState('');
  const [tags, setTags] = useState<string[]>([]);

  // Tags autocomplete state
  const [tagInput, setTagInput] = useState('');
  const [availableTags, setAvailableTags] = useState<string[]>([]);
  const [filteredTags, setFilteredTags] = useState<string[]>([]);
  const [showTagSuggestions, setShowTagSuggestions] = useState(false);
  const tagInputRef = useRef<HTMLInputElement>(null);

  // Toast notifications
  const [toasts, setToasts] = useState<Toast[]>([]);
  const toastIdRef = useRef(0);

  const addToast = useCallback((type: 'success' | 'error', message: string) => {
    const id = ++toastIdRef.current;
    setToasts((prev) => [...prev, { id, type, message }]);
    // Auto-remove after 4 seconds
    setTimeout(() => {
      setToasts((prev) => prev.filter((t) => t.id !== id));
    }, 4000);
  }, []);

  const removeToast = useCallback((id: number) => {
    setToasts((prev) => prev.filter((t) => t.id !== id));
  }, []);

  // Copy to clipboard functionality - Optimized for Rich Text & LLMs
  const handleCopy = useCallback(async () => {
    try {
      // Create a markdown version for plain-text pasting (perfect for LLMs)
      const turndownService = new TurndownService({
        headingStyle: 'atx',
        codeBlockStyle: 'fenced',
      });
      const markdownContent = turndownService.turndown(content);

      // Use Clipboard API for multi-format copy
      const htmlBlob = new Blob([content], { type: 'text/html' });
      const textBlob = new Blob([markdownContent], { type: 'text/plain' });

      const clipboardItem = new ClipboardItem({
        'text/html': htmlBlob,
        'text/plain': textBlob,
      });

      await navigator.clipboard.write([clipboardItem]);
      addToast('success', 'Copied! Formatted for Word/Notes and Markdown for LLMs.');
    } catch (err) {
      console.error('Copy failed', err);
      // Fallback
      try {
        await navigator.clipboard.writeText(content.replace(/<[^>]*>?/gm, ''));
        addToast('success', 'Copied as plain text');
      } catch {
        addToast('error', 'Failed to copy to clipboard');
      }
    }
  }, [content, addToast]);

  // Delete prompt handler
  const handleDelete = async () => {
    if (!id) return;

    setDeleting(true);
    try {
      await api.delete(`/prompts/${id}`);
      // Navigate to home list with success message via state
      navigate('/', { state: { toast: { type: 'success', message: 'Prompt deleted successfully' } } });
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Failed to delete prompt';
      addToast('error', message);
      // Keep dialog open on error so user can retry or cancel
    } finally {
      setDeleting(false);
    }
  };

  // Fetch prompt data
  useEffect(() => {
    const fetchPrompt = async () => {
      if (!id) return;

      setLoading(true);
      setError(null);
      try {
        const prompt = await api.get<Prompt>(`/prompts/${id}`);
        setTitle(prompt.title);
        setContent(prompt.content);
        setCategory(prompt.category || '');
        setTags(prompt.tags || []);
      } catch (err) {
        if (err instanceof ApiError && err.status === 404) {
          setError('Prompt not found');
        } else {
          setError(err instanceof Error ? err.message : 'Failed to load prompt');
        }
      } finally {
        setLoading(false);
      }
    };

    fetchPrompt();
  }, [id]);

  // Fetch available tags for autocomplete
  useEffect(() => {
    const fetchTags = async () => {
      try {
        const response = await api.get<TagsResponse>('/tags');
        setAvailableTags(response.tags);
      } catch {
        // Silently fail - autocomplete is optional
      }
    };
    fetchTags();
  }, []);

  // Filter tags based on input
  useEffect(() => {
    if (tagInput.trim()) {
      const filtered = availableTags.filter(
        (tag) =>
          tag.toLowerCase().includes(tagInput.toLowerCase()) &&
          !tags.includes(tag)
      );
      setFilteredTags(filtered);
    } else {
      setFilteredTags([]);
    }
  }, [tagInput, availableTags, tags]);

  const handleSave = async () => {
    if (!id) return;

    setSaving(true);
    try {
      await api.put(`/prompts/${id}`, {
        title,
        content,
        category: category || null,
        tags: tags.length > 0 ? tags : null,
      });
      addToast('success', 'Prompt saved successfully');
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Failed to save prompt';
      addToast('error', message);
    } finally {
      setSaving(false);
    }
  };

  const handleAddTag = (tag: string) => {
    const trimmedTag = tag.trim();
    if (trimmedTag && !tags.includes(trimmedTag)) {
      setTags([...tags, trimmedTag]);
    }
    setTagInput('');
    setShowTagSuggestions(false);
    tagInputRef.current?.focus();
  };

  const handleRemoveTag = (tagToRemove: string) => {
    setTags(tags.filter((t) => t !== tagToRemove));
  };

  const handleTagInputKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter') {
      e.preventDefault();
      if (filteredTags.length > 0) {
        handleAddTag(filteredTags[0]);
      } else if (tagInput.trim()) {
        handleAddTag(tagInput);
      }
    } else if (e.key === 'Backspace' && !tagInput && tags.length > 0) {
      handleRemoveTag(tags[tags.length - 1]);
    } else if (e.key === 'Escape') {
      setShowTagSuggestions(false);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-gray-500">Loading prompt...</div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex flex-col items-center justify-center h-64">
        <div className="text-red-600 mb-4">{error}</div>
        <button
          onClick={() => navigate('/')}
          className="text-indigo-600 hover:text-indigo-500"
        >
          Back to library
        </button>
      </div>
    );
  }

  return (
    <div className="h-full flex flex-col pb-6">
      {/* Toast Notifications */}
      <div className="fixed top-4 right-4 z-50 space-y-2">
        {toasts.map((toast) => (
          <div
            key={toast.id}
            className={`flex items-center gap-2 px-4 py-3 rounded-lg shadow-lg ${toast.type === 'success'
              ? 'bg-green-50 text-green-800 border border-green-200'
              : 'bg-red-50 text-red-800 border border-red-200'
              }`}
          >
            {toast.type === 'success' ? (
              <svg className="w-5 h-5 text-green-400" viewBox="0 0 20 20" fill="currentColor">
                <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.857-9.809a.75.75 0 00-1.214-.882l-3.483 4.79-1.88-1.88a.75.75 0 10-1.06 1.061l2.5 2.5a.75.75 0 001.137-.089l4-5.5z" clipRule="evenodd" />
              </svg>
            ) : (
              <svg className="w-5 h-5 text-red-400" viewBox="0 0 20 20" fill="currentColor">
                <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.28 7.22a.75.75 0 00-1.06 1.06L8.94 10l-1.72 1.72a.75.75 0 101.06 1.06L10 11.06l1.72 1.72a.75.75 0 101.06-1.06L11.06 10l1.72-1.72a.75.75 0 00-1.06-1.06L10 8.94 8.28 7.22z" clipRule="evenodd" />
              </svg>
            )}
            <span className="text-sm font-medium">{toast.message}</span>
            <button
              onClick={() => removeToast(toast.id)}
              className="ml-2 text-gray-400 hover:text-gray-600"
            >
              <svg className="w-4 h-4" viewBox="0 0 20 20" fill="currentColor">
                <path d="M6.28 5.22a.75.75 0 00-1.06 1.06L8.94 10l-3.72 3.72a.75.75 0 101.06 1.06L10 11.06l3.72 3.72a.75.75 0 101.06-1.06L11.06 10l3.72-3.72a.75.75 0 00-1.06-1.06L10 8.94 6.28 5.22z" />
              </svg>
            </button>
          </div>
        ))}
      </div>

      {/* Header with back button and actions */}
      <div className="flex items-center justify-between mb-6">
        <button
          onClick={() => navigate('/')}
          className="inline-flex items-center text-sm text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white transition-colors"
        >
          <svg className="w-5 h-5 mr-1" viewBox="0 0 20 20" fill="currentColor">
            <path fillRule="evenodd" d="M17 10a.75.75 0 01-.75.75H5.612l4.158 3.96a.75.75 0 11-1.04 1.08l-5.5-5.25a.75.75 0 010-1.08l5.5-5.25a.75.75 0 111.04 1.08L5.612 9.25H16.25A.75.75 0 0117 10z" clipRule="evenodd" />
          </svg>
          Back to deck
        </button>
        <div className="flex items-center gap-3">
          {/* Copy Button */}
          <button
            onClick={handleCopy}
            className="inline-flex items-center rounded-md bg-white dark:bg-gray-800 px-3 py-2 text-sm font-semibold text-gray-900 dark:text-gray-100 shadow-sm ring-1 ring-inset ring-gray-300 dark:ring-gray-700 hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors"
            title="Copy to clipboard"
          >
            <svg className="h-5 w-5 mr-2 text-gray-400 dark:text-gray-500" viewBox="0 0 20 20" fill="currentColor">
              <path d="M7 3.5A1.5 1.5 0 018.5 2h3.879a1.5 1.5 0 011.06.44l3.122 3.12a1.5 1.5 0 01.439 1.061V14.5A1.5 1.5 0 0115.5 16H14v-5.5a2.5 2.5 0 00-2.5-2.5H7V3.5z" />
              <path d="M4.5 6A1.5 1.5 0 003 7.5v9A1.5 1.5 0 004.5 18h7a1.5 1.5 0 001.5-1.5v-5a1.5 1.5 0 00-1.5-1.5h-7z" />
            </svg>
            Copy Prompt
          </button>

          <div className="w-px h-6 bg-gray-300 mx-1" />

          {/* Save Button */}
          <button
            onClick={handleSave}
            disabled={saving}
            className="inline-flex items-center rounded-md bg-indigo-600 px-4 py-2 text-sm font-semibold text-white shadow-sm hover:bg-indigo-500 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-indigo-600 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {saving ? (
              <>
                <svg className="animate-spin -ml-0.5 mr-2 h-4 w-4 text-white" fill="none" viewBox="0 0 24 24">
                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
                </svg>
                Saving...
              </>
            ) : (
              'Save'
            )}
          </button>
          {/* Delete Button */}
          <button
            onClick={() => setShowDeleteDialog(true)}
            className="inline-flex items-center rounded-md bg-red-600 px-4 py-2 text-sm font-semibold text-white shadow-sm hover:bg-red-500 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-red-600"
          >
            Delete
          </button>
        </div>
      </div>

      {/* Delete Confirmation Dialog */}
      {showDeleteDialog && (
        <div className="fixed inset-0 z-50 overflow-y-auto">
          <div className="flex min-h-full items-end justify-center p-4 text-center sm:items-center sm:p-0">
            {/* Backdrop */}
            <div
              className="fixed inset-0 bg-gray-500 bg-opacity-75 transition-opacity"
              onClick={() => !deleting && setShowDeleteDialog(false)}
            />
            {/* Dialog */}
            <div className="relative transform overflow-hidden rounded-lg bg-white text-left shadow-xl transition-all sm:my-8 sm:w-full sm:max-w-lg">
              <div className="bg-white px-4 pb-4 pt-5 sm:p-6 sm:pb-4">
                <div className="sm:flex sm:items-start">
                  <div className="mx-auto flex h-12 w-12 flex-shrink-0 items-center justify-center rounded-full bg-red-100 sm:mx-0 sm:h-10 sm:w-10">
                    <svg className="h-6 w-6 text-red-600" fill="none" viewBox="0 0 24 24" strokeWidth="1.5" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" d="M12 9v3.75m-9.303 3.376c-.866 1.5.217 3.374 1.948 3.374h14.71c1.73 0 2.813-1.874 1.948-3.374L13.949 3.378c-.866-1.5-3.032-1.5-3.898 0L2.697 16.126ZM12 15.75h.007v.008H12v-.008Z" />
                    </svg>
                  </div>
                  <div className="mt-3 text-center sm:ml-4 sm:mt-0 sm:text-left">
                    <h3 className="text-base font-semibold leading-6 text-gray-900">
                      Delete Prompt
                    </h3>
                    <div className="mt-2">
                      <p className="text-sm text-gray-500">
                        Are you sure you want to delete <span className="font-medium text-gray-700">{title}</span>? This action cannot be undone.
                      </p>
                    </div>
                  </div>
                </div>
              </div>
              <div className="bg-gray-50 px-4 py-3 sm:flex sm:flex-row-reverse sm:px-6">
                <button
                  type="button"
                  onClick={handleDelete}
                  disabled={deleting}
                  className="inline-flex w-full justify-center rounded-md bg-red-600 px-3 py-2 text-sm font-semibold text-white shadow-sm hover:bg-red-500 sm:ml-3 sm:w-auto disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {deleting ? (
                    <>
                      <svg className="animate-spin -ml-0.5 mr-2 h-4 w-4 text-white" fill="none" viewBox="0 0 24 24">
                        <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                        <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
                      </svg>
                      Deleting...
                    </>
                  ) : (
                    'Delete'
                  )}
                </button>
                <button
                  type="button"
                  onClick={() => setShowDeleteDialog(false)}
                  disabled={deleting}
                  className="mt-3 inline-flex w-full justify-center rounded-md bg-white px-3 py-2 text-sm font-semibold text-gray-900 shadow-sm ring-1 ring-inset ring-gray-300 hover:bg-gray-50 sm:mt-0 sm:w-auto disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  Cancel
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Title Input */}
      <div className="mb-4">
        <label htmlFor="title" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1 transition-colors">
          Title
        </label>
        <input
          type="text"
          id="title"
          value={title}
          onChange={(e) => setTitle(e.target.value)}
          className="block w-full rounded-md border-0 py-2.5 px-3 text-gray-900 dark:text-white bg-white dark:bg-gray-800 ring-1 ring-inset ring-gray-300 dark:ring-gray-700 placeholder:text-gray-400 focus:ring-2 focus:ring-inset focus:ring-indigo-600 dark:focus:ring-indigo-500 sm:text-sm sm:leading-6 transition-colors font-semibold"
          placeholder="Enter prompt title..."
        />
      </div>

      {/* Category and Tags Row */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
        {/* Category Input */}
        <div>
          <label htmlFor="category" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1 transition-colors">
            Category
          </label>
          <input
            type="text"
            id="category"
            value={category}
            onChange={(e) => setCategory(e.target.value)}
            className="block w-full rounded-md border-0 py-2 px-3 text-gray-900 dark:text-white bg-white dark:bg-gray-800 ring-1 ring-inset ring-gray-300 dark:ring-gray-700 placeholder:text-gray-400 focus:ring-2 focus:ring-inset focus:ring-indigo-600 dark:focus:ring-indigo-500 sm:text-sm transition-colors"
            placeholder="Enter category..."
          />
        </div>

        {/* Tags Input with Autocomplete */}
        <div className="relative">
          <label htmlFor="tags" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1 transition-colors">
            Tags
          </label>
          <div className="flex flex-wrap gap-1 p-2 min-h-[42px] rounded-md border-0 ring-1 ring-inset ring-gray-300 dark:ring-gray-700 focus-within:ring-2 focus-within:ring-inset focus-within:ring-indigo-600 dark:focus-within:ring-indigo-500 bg-white dark:bg-gray-800 transition-colors">
            {tags.map((tag) => (
              <span
                key={tag}
                className="inline-flex items-center gap-x-1 rounded-full bg-indigo-50 dark:bg-indigo-900/40 px-2 py-0.5 text-xs font-medium text-indigo-700 dark:text-indigo-300"
              >
                {tag}
                <button
                  type="button"
                  onClick={() => handleRemoveTag(tag)}
                  className="group relative -mr-1 h-3.5 w-3.5 rounded-sm hover:bg-indigo-200/80"
                >
                  <span className="sr-only">Remove</span>
                  <svg viewBox="0 0 14 14" className="h-3.5 w-3.5 stroke-indigo-700/50 group-hover:stroke-indigo-700/75" fill="none" stroke="currentColor">
                    <path d="M4 4l6 6m0-6l-6 6" />
                  </svg>
                </button>
              </span>
            ))}
            <input
              ref={tagInputRef}
              type="text"
              id="tags"
              value={tagInput}
              onChange={(e) => {
                setTagInput(e.target.value);
                setShowTagSuggestions(true);
              }}
              onFocus={() => setShowTagSuggestions(true)}
              onBlur={() => {
                // Delay to allow click on suggestion
                setTimeout(() => setShowTagSuggestions(false), 150);
              }}
              onKeyDown={handleTagInputKeyDown}
              className="flex-1 min-w-[120px] border-0 bg-transparent py-0.5 text-gray-900 dark:text-white placeholder:text-gray-400 focus:ring-0 sm:text-sm outline-none"
              placeholder={tags.length === 0 ? 'Add tags...' : ''}
            />
          </div>
          {/* Tags Autocomplete Dropdown */}
          {showTagSuggestions && filteredTags.length > 0 && (
            <div className="absolute z-10 mt-1 max-h-48 w-full overflow-auto rounded-md bg-white dark:bg-gray-800 py-1 text-base shadow-lg ring-1 ring-black ring-opacity-5 dark:ring-gray-700 focus:outline-none sm:text-sm transition-all">
              {filteredTags.slice(0, 10).map((tag) => (
                <button
                  key={tag}
                  type="button"
                  onMouseDown={(e) => e.preventDefault()}
                  onClick={() => handleAddTag(tag)}
                  className="w-full cursor-pointer px-3 py-2 text-left hover:bg-gray-100 dark:hover:bg-gray-700 text-gray-900 dark:text-gray-100 transition-colors"
                >
                  {tag}
                </button>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* Editor Area */}
      <div className="flex-1 min-h-[400px]">
        <label htmlFor="content" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1 transition-colors">
          Content
        </label>
        <RichTextEditor
          content={content}
          onChange={setContent}
          placeholder="View or edit your prompt with full formatting support."
        />
      </div>
    </div>
  );
}
