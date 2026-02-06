import { useEffect, useState, useCallback, useRef, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { api } from '../lib/api';
import type { Prompt } from '../types/prompt';
import { RichTextEditor } from '../components/RichTextEditor';

interface TagsResponse {
  tags: string[];
}

interface Toast {
  id: number;
  type: 'success' | 'error';
  message: string;
}

export function PromptNew() {
  const navigate = useNavigate();

  const [saving, setSaving] = useState(false);

  // Form state - all fields empty initially
  const [title, setTitle] = useState('');
  const [content, setContent] = useState('');
  const [category, setCategory] = useState('');
  const [tags, setTags] = useState<string[]>([]);

  // Tags autocomplete state
  const [tagInput, setTagInput] = useState('');
  const [availableTags, setAvailableTags] = useState<string[]>([]);
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

  // Filter tags based on input (derived state using useMemo)
  const filteredTags = useMemo(() => {
    if (tagInput.trim()) {
      return availableTags.filter(
        (tag) =>
          tag.toLowerCase().includes(tagInput.toLowerCase()) &&
          !tags.includes(tag)
      );
    }
    return [];
  }, [tagInput, availableTags, tags]);

  const handleSave = async () => {
    if (!title.trim()) {
      addToast('error', 'Title is required');
      return;
    }

    setSaving(true);
    try {
      const newPrompt = await api.post<Prompt>('/prompts', {
        title: title.trim(),
        content,
        category: category.trim() || null,
        tags: tags.length > 0 ? tags : null,
      });
      addToast('success', 'Prompt created successfully');
      // Redirect to the new prompt's detail page
      navigate(`/${newPrompt.id}`);
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Failed to create prompt';
      addToast('error', message);
      setSaving(false);
    }
  };

  const handleCancel = () => {
    navigate('/');
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

      {/* Header with cancel button and save */}
      <div className="flex items-center justify-between mb-6">
        <button
          onClick={handleCancel}
          className="text-sigil-teal hover:text-white font-michroma text-[10px] tracking-widest uppercase transition-colors"
        >
          Cancel
        </button>
        <button
          onClick={handleSave}
          disabled={saving}
          className="inline-flex items-center rounded-lg bg-gray-900 dark:bg-sigil-teal px-4 py-2 text-xs font-michroma tracking-widest uppercase text-white dark:text-sigil-obsidian shadow-sm hover:bg-gray-800 dark:hover:bg-white transition-all sigil-glow disabled:opacity-50"
        >
          {saving ? 'Saving...' : 'Save'}
        </button>
      </div>

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
          className="block w-full rounded-md border-0 py-2.5 px-3 text-gray-900 dark:text-white bg-white dark:bg-gray-800 ring-1 ring-inset ring-gray-300 dark:ring-gray-700 placeholder:text-gray-400 focus:ring-2 focus:ring-inset focus:ring-sigil-teal dark:focus:ring-sigil-teal sm:text-sm sm:leading-6 transition-colors font-semibold"
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
            className="block w-full rounded-md border-0 py-2 px-3 text-gray-900 dark:text-white bg-white dark:bg-gray-800 ring-1 ring-inset ring-gray-300 dark:ring-gray-700 placeholder:text-gray-400 focus:ring-2 focus:ring-inset focus:ring-sigil-teal dark:focus:ring-sigil-teal sm:text-sm transition-colors"
            placeholder="Enter category..."
          />
        </div>

        {/* Tags Input with Autocomplete */}
        <div className="relative">
          <label htmlFor="tags" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1 transition-colors">
            Tags
          </label>
          <div className="flex flex-wrap gap-1 p-2 min-h-[42px] rounded-md border-0 ring-1 ring-inset ring-gray-300 dark:ring-gray-700 focus-within:ring-2 focus-within:ring-inset focus-within:ring-sigil-teal dark:focus-within:ring-sigil-teal transition-colors">
            {tags.map((tag) => (
              <span
                key={tag}
                className="inline-flex items-center gap-x-1 rounded-full bg-sigil-teal/10 dark:bg-sigil-teal/20 text-sigil-teal dark:text-sigil-teal border-sigil-teal/30 tracking-tight transition-colors"
              >
                {tag}
                <button
                  type="button"
                  onClick={() => handleRemoveTag(tag)}
                  className="group relative -mr-1 h-3.5 w-3.5 rounded-sm bg-sigil-teal/20 dark:bg-sigil-teal/40 stroke-sigil-teal/50 group-hover:stroke-sigil-teal/75 transition-colors transition-all transition-opacity transition-all group-hover:bg-sigil-teal/20"
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
          placeholder="Write your prompt here... Formatter is compatible with ChatGPT, Word, and Apple Notes."
        />
      </div>
    </div>
  );
}
