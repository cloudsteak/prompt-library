import { useEffect, useState, useCallback, useMemo, useRef } from 'react';
import { useNavigate, useSearchParams, useLocation } from 'react-router-dom';
import { api } from '../lib/api';
import type { Prompt, PromptsListResponse } from '../types/prompt';
import TurndownService from 'turndown';

const PAGE_SIZE = 20;
const DEBOUNCE_MS = 300;

interface TagsResponse {
  tags: string[];
}

interface CategoriesResponse {
  categories: string[];
}

interface Toast {
  id: number;
  type: 'success' | 'error';
  message: string;
}

interface LocationState {
  toast?: {
    type: 'success' | 'error';
    message: string;
  };
}

export function Prompts() {
  const navigate = useNavigate();
  const location = useLocation();
  const [searchParams, setSearchParams] = useSearchParams();

  // Extract filter values from URL
  const searchQuery = searchParams.get('q') || '';
  const selectedCategory = searchParams.get('category') || '';
  const selectedTags = useMemo(() => {
    const tagsParam = searchParams.get('tags');
    return tagsParam ? tagsParam.split(',').filter(Boolean) : [];
  }, [searchParams]);

  const [prompts, setPrompts] = useState<Prompt[]>([]);
  const [total, setTotal] = useState(0);
  const [offset, setOffset] = useState(0);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Filter options
  const [categories, setCategories] = useState<string[]>([]);
  const [availableTags, setAvailableTags] = useState<string[]>([]);
  const [tagsDropdownOpen, setTagsDropdownOpen] = useState(false);

  // Debounced search input
  const [searchInput, setSearchInput] = useState(searchQuery);

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

  // Handle toast from navigation state (e.g., after delete)
  useEffect(() => {
    const state = location.state as LocationState | null;
    if (state?.toast) {
      addToast(state.toast.type, state.toast.message);
      // Clear the state so toast doesn't show again on refresh
      navigate(location.pathname + location.search, { replace: true, state: {} });
    }
  }, [location.state, location.pathname, location.search, navigate, addToast]);

  // Copy to clipboard functionality - Optimized for Rich Text & LLMs
  const handleCopyPrompt = useCallback(
    async (prompt: Prompt, e: React.MouseEvent) => {
      e.stopPropagation(); // Prevent row click navigation
      try {
        const content = prompt.content;

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
          await navigator.clipboard.writeText(prompt.content.replace(/<[^>]*>?/gm, ''));
          addToast('success', 'Copied as plain text');
        } catch {
          addToast('error', 'Failed to copy to clipboard');
        }
      }
    },
    [addToast]
  );

  // Update URL params helper
  const updateSearchParams = useCallback(
    (updates: Record<string, string | null>) => {
      const newParams = new URLSearchParams(searchParams);
      Object.entries(updates).forEach(([key, value]) => {
        if (value === null || value === '') {
          newParams.delete(key);
        } else {
          newParams.set(key, value);
        }
      });
      setSearchParams(newParams, { replace: true });
    },
    [searchParams, setSearchParams]
  );

  // Debounced search effect
  useEffect(() => {
    const handler = setTimeout(() => {
      if (searchInput !== searchQuery) {
        updateSearchParams({ q: searchInput || null });
        setOffset(0);
      }
    }, DEBOUNCE_MS);

    return () => clearTimeout(handler);
  }, [searchInput, searchQuery, updateSearchParams]);

  // Fetch categories and tags on mount
  useEffect(() => {
    const fetchFilterOptions = async () => {
      try {
        const [categoriesRes, tagsRes] = await Promise.all([
          api.get<CategoriesResponse>('/categories'),
          api.get<TagsResponse>('/tags'),
        ]);
        setCategories(categoriesRes.categories);
        setAvailableTags(tagsRes.tags);
      } catch {
        // Silently fail for filter options - they're optional
      }
    };
    fetchFilterOptions();
  }, []);

  const fetchPrompts = useCallback(
    async (currentOffset: number) => {
      setLoading(true);
      setError(null);
      try {
        const params = new URLSearchParams();
        params.set('limit', PAGE_SIZE.toString());
        params.set('offset', currentOffset.toString());
        if (searchQuery) params.set('q', searchQuery);
        if (selectedCategory) params.set('category', selectedCategory);
        if (selectedTags.length > 0) params.set('tags', selectedTags.join(','));

        const response = await api.get<PromptsListResponse>(
          `/prompts?${params.toString()}`
        );
        setPrompts(response.prompts);
        setTotal(response.total);
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Failed to fetch prompts');
      } finally {
        setLoading(false);
      }
    },
    [searchQuery, selectedCategory, selectedTags]
  );

  useEffect(() => {
    fetchPrompts(offset);
  }, [fetchPrompts, offset]);

  // Reset offset when filters change
  useEffect(() => {
    setOffset(0);
  }, [searchQuery, selectedCategory, selectedTags]);

  const handleRowClick = (promptId: string) => {
    navigate(`/${promptId}`);
  };

  const handlePrevious = () => {
    if (offset > 0) {
      setOffset(Math.max(0, offset - PAGE_SIZE));
    }
  };

  const handleNext = () => {
    if (offset + PAGE_SIZE < total) {
      setOffset(offset + PAGE_SIZE);
    }
  };

  const handleCategoryChange = (category: string) => {
    updateSearchParams({ category: category || null });
  };

  const handleTagToggle = (tag: string) => {
    const newTags = selectedTags.includes(tag)
      ? selectedTags.filter((t) => t !== tag)
      : [...selectedTags, tag];
    updateSearchParams({ tags: newTags.length > 0 ? newTags.join(',') : null });
  };

  const clearFilters = () => {
    setSearchInput('');
    setSearchParams(new URLSearchParams(), { replace: true });
  };

  const hasActiveFilters =
    searchQuery !== '' || selectedCategory !== '' || selectedTags.length > 0;

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString(undefined, {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
    });
  };

  const currentPage = Math.floor(offset / PAGE_SIZE) + 1;
  const totalPages = Math.ceil(total / PAGE_SIZE);
  const showingFrom = total === 0 ? 0 : offset + 1;
  const showingTo = Math.min(offset + PAGE_SIZE, total);

  // Determine if we should show the empty state vs no results
  const isInitialLoad = loading && prompts.length === 0 && !hasActiveFilters;
  const hasNoPrompts = !loading && prompts.length === 0 && total === 0 && !hasActiveFilters;
  const hasNoResults = !loading && prompts.length === 0 && total === 0 && hasActiveFilters;

  if (isInitialLoad) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-gray-500">Loading prompts...</div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-red-600">Error: {error}</div>
      </div>
    );
  }

  if (hasNoPrompts) {
    return (
      <div className="text-center py-12">
        <svg
          className="mx-auto h-12 w-12 text-gray-400"
          fill="none"
          viewBox="0 0 24 24"
          stroke="currentColor"
          aria-hidden="true"
        >
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth={1.5}
            d="M19.5 14.25v-2.625a3.375 3.375 0 00-3.375-3.375h-1.5A1.125 1.125 0 0113.5 7.125v-1.5a3.375 3.375 0 00-3.375-3.375H8.25m0 12.75h7.5m-7.5 3H12M10.5 2.25H5.625c-.621 0-1.125.504-1.125 1.125v17.25c0 .621.504 1.125 1.125 1.125h12.75c.621 0 1.125-.504 1.125-1.125V11.25a9 9 0 00-9-9z"
          />
        </svg>
        <h3 className="mt-2 text-sm font-semibold text-gray-900">No prompts</h3>
        <p className="mt-1 text-sm text-gray-500">
          Get started by creating your first prompt.
        </p>
        <div className="mt-6">
          <button
            type="button"
            onClick={() => navigate('/new')}
            className="inline-flex items-center rounded-md bg-indigo-600 px-3 py-2 text-sm font-semibold text-white shadow-sm hover:bg-indigo-500 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-indigo-600"
          >
            <svg
              className="-ml-0.5 mr-1.5 h-5 w-5"
              viewBox="0 0 20 20"
              fill="currentColor"
              aria-hidden="true"
            >
              <path d="M10.75 4.75a.75.75 0 00-1.5 0v4.5h-4.5a.75.75 0 000 1.5h4.5v4.5a.75.75 0 001.5 0v-4.5h4.5a.75.75 0 000-1.5h-4.5v-4.5z" />
            </svg>
            Create your first prompt
          </button>
        </div>
      </div>
    );
  }

  return (
    <div>
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

      <div className="sm:flex sm:items-center sm:justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Library</h1>
          <p className="mt-1 text-sm text-gray-500">
            Manage your prompt collection
          </p>
        </div>
        <div className="mt-4 sm:mt-0">
          <button
            type="button"
            onClick={() => navigate('/new')}
            className="inline-flex items-center rounded-md bg-indigo-600 px-3 py-2 text-sm font-semibold text-white shadow-sm hover:bg-indigo-500 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-indigo-600"
          >
            <svg
              className="-ml-0.5 mr-1.5 h-5 w-5"
              viewBox="0 0 20 20"
              fill="currentColor"
              aria-hidden="true"
            >
              <path d="M10.75 4.75a.75.75 0 00-1.5 0v4.5h-4.5a.75.75 0 000 1.5h4.5v4.5a.75.75 0 001.5 0v-4.5h4.5a.75.75 0 000-1.5h-4.5v-4.5z" />
            </svg>
            New Prompt
          </button>
        </div>
      </div>

      {/* Search and Filter Controls */}
      <div className="mb-6 space-y-4">
        <div className="flex flex-col sm:flex-row gap-4">
          {/* Search Input */}
          <div className="flex-1">
            <div className="relative">
              <div className="pointer-events-none absolute inset-y-0 left-0 flex items-center pl-3">
                <svg
                  className="h-5 w-5 text-gray-400"
                  viewBox="0 0 20 20"
                  fill="currentColor"
                  aria-hidden="true"
                >
                  <path
                    fillRule="evenodd"
                    d="M9 3.5a5.5 5.5 0 100 11 5.5 5.5 0 000-11zM2 9a7 7 0 1112.452 4.391l3.328 3.329a.75.75 0 11-1.06 1.06l-3.329-3.328A7 7 0 012 9z"
                    clipRule="evenodd"
                  />
                </svg>
              </div>
              <input
                type="text"
                value={searchInput}
                onChange={(e) => setSearchInput(e.target.value)}
                placeholder="Search prompts..."
                className="block w-full rounded-md border-0 py-2 pl-10 pr-3 text-gray-900 ring-1 ring-inset ring-gray-300 placeholder:text-gray-400 focus:ring-2 focus:ring-inset focus:ring-indigo-600 sm:text-sm sm:leading-6"
              />
            </div>
          </div>

          {/* Category Filter */}
          <div className="sm:w-48">
            <select
              value={selectedCategory}
              onChange={(e) => handleCategoryChange(e.target.value)}
              className="block w-full rounded-md border-0 py-2 pl-3 pr-10 text-gray-900 ring-1 ring-inset ring-gray-300 focus:ring-2 focus:ring-inset focus:ring-indigo-600 sm:text-sm sm:leading-6"
            >
              <option value="">All Categories</option>
              {categories.map((category) => (
                <option key={category} value={category}>
                  {category}
                </option>
              ))}
            </select>
          </div>

          {/* Tags Filter */}
          <div className="relative sm:w-48">
            <button
              type="button"
              onClick={() => setTagsDropdownOpen(!tagsDropdownOpen)}
              className="relative w-full cursor-pointer rounded-md bg-white py-2 pl-3 pr-10 text-left text-gray-900 ring-1 ring-inset ring-gray-300 focus:outline-none focus:ring-2 focus:ring-indigo-600 sm:text-sm sm:leading-6"
            >
              <span className="block truncate">
                {selectedTags.length > 0
                  ? `${selectedTags.length} tag${selectedTags.length > 1 ? 's' : ''} selected`
                  : 'All Tags'}
              </span>
              <span className="pointer-events-none absolute inset-y-0 right-0 flex items-center pr-2">
                <svg
                  className="h-5 w-5 text-gray-400"
                  viewBox="0 0 20 20"
                  fill="currentColor"
                  aria-hidden="true"
                >
                  <path
                    fillRule="evenodd"
                    d="M10 3a.75.75 0 01.55.24l3.25 3.5a.75.75 0 11-1.1 1.02L10 4.852 7.3 7.76a.75.75 0 01-1.1-1.02l3.25-3.5A.75.75 0 0110 3zm-3.76 9.2a.75.75 0 011.06.04l2.7 2.908 2.7-2.908a.75.75 0 111.1 1.02l-3.25 3.5a.75.75 0 01-1.1 0l-3.25-3.5a.75.75 0 01.04-1.06z"
                    clipRule="evenodd"
                  />
                </svg>
              </span>
            </button>
            {tagsDropdownOpen && (
              <>
                <div
                  className="fixed inset-0 z-10"
                  onClick={() => setTagsDropdownOpen(false)}
                />
                <div className="absolute z-20 mt-1 max-h-60 w-full overflow-auto rounded-md bg-white py-1 text-base shadow-lg ring-1 ring-black ring-opacity-5 focus:outline-none sm:text-sm">
                  {availableTags.length === 0 ? (
                    <div className="px-3 py-2 text-gray-500">No tags available</div>
                  ) : (
                    availableTags.map((tag) => (
                      <label
                        key={tag}
                        className="flex cursor-pointer items-center px-3 py-2 hover:bg-gray-100"
                      >
                        <input
                          type="checkbox"
                          checked={selectedTags.includes(tag)}
                          onChange={() => handleTagToggle(tag)}
                          className="h-4 w-4 rounded border-gray-300 text-indigo-600 focus:ring-indigo-600"
                        />
                        <span className="ml-2 text-gray-700">{tag}</span>
                      </label>
                    ))
                  )}
                </div>
              </>
            )}
          </div>

          {/* Clear Filters Button */}
          {hasActiveFilters && (
            <button
              type="button"
              onClick={clearFilters}
              className="inline-flex items-center rounded-md bg-white px-3 py-2 text-sm font-medium text-gray-700 ring-1 ring-inset ring-gray-300 hover:bg-gray-50"
            >
              <svg
                className="-ml-0.5 mr-1.5 h-4 w-4"
                viewBox="0 0 20 20"
                fill="currentColor"
                aria-hidden="true"
              >
                <path d="M6.28 5.22a.75.75 0 00-1.06 1.06L8.94 10l-3.72 3.72a.75.75 0 101.06 1.06L10 11.06l3.72 3.72a.75.75 0 101.06-1.06L11.06 10l3.72-3.72a.75.75 0 00-1.06-1.06L10 8.94 6.28 5.22z" />
              </svg>
              Clear filters
            </button>
          )}
        </div>

        {/* Active Filters Display */}
        {hasActiveFilters && (
          <div className="flex flex-wrap gap-2">
            {searchQuery && (
              <span className="inline-flex items-center gap-x-1 rounded-full bg-indigo-50 px-2 py-1 text-xs font-medium text-indigo-700">
                Search: {searchQuery}
                <button
                  type="button"
                  onClick={() => {
                    setSearchInput('');
                    updateSearchParams({ q: null });
                  }}
                  className="group relative -mr-1 h-3.5 w-3.5 rounded-sm hover:bg-indigo-200/80"
                >
                  <span className="sr-only">Remove</span>
                  <svg
                    viewBox="0 0 14 14"
                    className="h-3.5 w-3.5 stroke-indigo-700/50 group-hover:stroke-indigo-700/75"
                  >
                    <path d="M4 4l6 6m0-6l-6 6" />
                  </svg>
                </button>
              </span>
            )}
            {selectedCategory && (
              <span className="inline-flex items-center gap-x-1 rounded-full bg-indigo-50 px-2 py-1 text-xs font-medium text-indigo-700">
                Category: {selectedCategory}
                <button
                  type="button"
                  onClick={() => updateSearchParams({ category: null })}
                  className="group relative -mr-1 h-3.5 w-3.5 rounded-sm hover:bg-indigo-200/80"
                >
                  <span className="sr-only">Remove</span>
                  <svg
                    viewBox="0 0 14 14"
                    className="h-3.5 w-3.5 stroke-indigo-700/50 group-hover:stroke-indigo-700/75"
                  >
                    <path d="M4 4l6 6m0-6l-6 6" />
                  </svg>
                </button>
              </span>
            )}
            {selectedTags.map((tag) => (
              <span
                key={tag}
                className="inline-flex items-center gap-x-1 rounded-full bg-indigo-50 px-2 py-1 text-xs font-medium text-indigo-700"
              >
                Tag: {tag}
                <button
                  type="button"
                  onClick={() => handleTagToggle(tag)}
                  className="group relative -mr-1 h-3.5 w-3.5 rounded-sm hover:bg-indigo-200/80"
                >
                  <span className="sr-only">Remove</span>
                  <svg
                    viewBox="0 0 14 14"
                    className="h-3.5 w-3.5 stroke-indigo-700/50 group-hover:stroke-indigo-700/75"
                  >
                    <path d="M4 4l6 6m0-6l-6 6" />
                  </svg>
                </button>
              </span>
            ))}
          </div>
        )}
      </div>

      {/* No Results State */}
      {hasNoResults && (
        <div className="text-center py-12">
          <svg
            className="mx-auto h-12 w-12 text-gray-400"
            fill="none"
            viewBox="0 0 24 24"
            stroke="currentColor"
            aria-hidden="true"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={1.5}
              d="M21 21l-5.197-5.197m0 0A7.5 7.5 0 105.196 5.196a7.5 7.5 0 0010.607 10.607z"
            />
          </svg>
          <h3 className="mt-2 text-sm font-semibold text-gray-900">No results found</h3>
          <p className="mt-1 text-sm text-gray-500">
            No prompts match your current filters. Try adjusting your search or filters.
          </p>
          <div className="mt-6">
            <button
              type="button"
              onClick={clearFilters}
              className="inline-flex items-center rounded-md bg-indigo-600 px-3 py-2 text-sm font-semibold text-white shadow-sm hover:bg-indigo-500 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-indigo-600"
            >
              Clear filters
            </button>
          </div>
        </div>
      )}

      {/* Prompts Table */}
      {!hasNoResults && (
        <>
          <div className="overflow-hidden shadow ring-1 ring-black ring-opacity-5 sm:rounded-lg">
            <table className="min-w-full divide-y divide-gray-300">
              <thead className="bg-gray-50">
                <tr>
                  <th
                    scope="col"
                    className="py-3.5 pl-4 pr-3 text-left text-sm font-semibold text-gray-900 sm:pl-6"
                  >
                    Title
                  </th>
                  <th
                    scope="col"
                    className="px-3 py-3.5 text-left text-sm font-semibold text-gray-900"
                  >
                    Category
                  </th>
                  <th
                    scope="col"
                    className="px-3 py-3.5 text-left text-sm font-semibold text-gray-900"
                  >
                    Tags
                  </th>
                  <th
                    scope="col"
                    className="px-3 py-3.5 text-left text-sm font-semibold text-gray-900"
                  >
                    Updated
                  </th>
                  <th scope="col" className="relative py-3.5 pl-3 pr-4 sm:pr-6">
                    <span className="sr-only">Actions</span>
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-200 bg-white">
                {prompts.map((prompt) => (
                  <tr
                    key={prompt.id}
                    onClick={() => handleRowClick(prompt.id)}
                    className="cursor-pointer hover:bg-gray-50"
                  >
                    <td className="whitespace-nowrap py-4 pl-4 pr-3 text-sm font-medium text-gray-900 sm:pl-6">
                      {prompt.title}
                    </td>
                    <td className="whitespace-nowrap px-3 py-4 text-sm text-gray-500">
                      {prompt.category || '—'}
                    </td>
                    <td className="px-3 py-4 text-sm text-gray-500">
                      {prompt.tags && prompt.tags.length > 0 ? (
                        <div className="flex flex-wrap gap-1">
                          {prompt.tags.map((tag, index) => (
                            <span
                              key={index}
                              className="inline-flex items-center rounded-full bg-gray-100 px-2 py-0.5 text-xs font-medium text-gray-600"
                            >
                              {tag}
                            </span>
                          ))}
                        </div>
                      ) : (
                        '—'
                      )}
                    </td>
                    <td className="whitespace-nowrap px-3 py-4 text-sm text-gray-500">
                      {formatDate(prompt.updated_at)}
                    </td>
                    <td className="relative whitespace-nowrap py-4 pl-3 pr-4 text-right text-sm font-medium sm:pr-6">
                      <button
                        type="button"
                        onClick={(e) => handleCopyPrompt(prompt, e)}
                        className="text-gray-400 hover:text-gray-600"
                        title="Copy to clipboard"
                      >
                        <svg className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
                          <path d="M7 3.5A1.5 1.5 0 018.5 2h3.879a1.5 1.5 0 011.06.44l3.122 3.12a1.5 1.5 0 01.439 1.061V14.5A1.5 1.5 0 0115.5 16H14v-5.5a2.5 2.5 0 00-2.5-2.5H7V3.5z" />
                          <path d="M4.5 6A1.5 1.5 0 003 7.5v9A1.5 1.5 0 004.5 18h7a1.5 1.5 0 001.5-1.5v-5a1.5 1.5 0 00-1.5-1.5h-7z" />
                        </svg>
                        <span className="sr-only">Copy prompt</span>
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {total > PAGE_SIZE && (
            <nav
              className="flex items-center justify-between border-t border-gray-200 bg-white px-4 py-3 sm:px-6 mt-4 rounded-lg shadow ring-1 ring-black ring-opacity-5"
              aria-label="Pagination"
            >
              <div className="hidden sm:block">
                <p className="text-sm text-gray-700">
                  Showing <span className="font-medium">{showingFrom}</span> to{' '}
                  <span className="font-medium">{showingTo}</span> of{' '}
                  <span className="font-medium">{total}</span> results
                </p>
              </div>
              <div className="flex flex-1 justify-between sm:justify-end gap-3">
                <button
                  onClick={handlePrevious}
                  disabled={offset === 0}
                  className="relative inline-flex items-center rounded-md bg-white px-3 py-2 text-sm font-semibold text-gray-900 ring-1 ring-inset ring-gray-300 hover:bg-gray-50 focus-visible:outline-offset-0 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  Previous
                </button>
                <span className="text-sm text-gray-700 self-center">
                  Page {currentPage} of {totalPages}
                </span>
                <button
                  onClick={handleNext}
                  disabled={offset + PAGE_SIZE >= total}
                  className="relative inline-flex items-center rounded-md bg-white px-3 py-2 text-sm font-semibold text-gray-900 ring-1 ring-inset ring-gray-300 hover:bg-gray-50 focus-visible:outline-offset-0 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  Next
                </button>
              </div>
            </nav>
          )}
        </>
      )}
    </div>
  );
}
