import React, { useState, useEffect, useRef } from 'react';
import { Tag, Plus } from 'lucide-react';
import { Button } from '../Button';
import { urlApi } from '../../services/api';

interface TagInputProps {
  selectedTags: string[];
  onChange: (tags: string[]) => void;
  availableTags?: string[];
  label?: string;
  placeholder?: string;
  helperText?: string;
}

export const TagInput: React.FC<TagInputProps> = ({
  selectedTags,
  onChange,
  availableTags: propsAvailableTags,
  label = 'Tags & Categorization',
  placeholder = 'Add tag (e.g. work, marketing, social)',
  helperText,
}) => {
  const [inputValue, setInputValue] = useState('');
  const [isOpen, setIsOpen] = useState(false);
  const [highlightedIndex, setHighlightedIndex] = useState(-1);
  const [loadedTags, setLoadedTags] = useState<string[]>([]);
  const containerRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  // If availableTags is not provided via props, fetch from API
  useEffect(() => {
    if (propsAvailableTags && propsAvailableTags.length > 0) {
      setLoadedTags(propsAvailableTags);
    } else {
      urlApi
        .getUserTags()
        .then((data) => {
          setLoadedTags(data.map((t) => t.tag));
        })
        .catch(() => {
          // If error or unauthenticated, fallback to empty
        });
    }
  }, [propsAvailableTags]);

  const allAvailable = propsAvailableTags && propsAvailableTags.length > 0 ? propsAvailableTags : loadedTags;

  // Filter available suggestions (exclude already selected)
  const cleanInput = inputValue.trim().toLowerCase();
  const suggestions = allAvailable
    .filter((t) => !selectedTags.includes(t))
    .filter((t) => (cleanInput ? t.toLowerCase().includes(cleanInput) : true));

  // Close dropdown on outside click
  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (containerRef.current && !containerRef.current.contains(e.target as Node)) {
        setIsOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const handleAddTag = (tagToAdd: string) => {
    const clean = tagToAdd.trim().toLowerCase();
    if (!clean) return;

    if (!selectedTags.includes(clean)) {
      onChange([...selectedTags, clean]);
      // Also add to loadedTags if not already present
      if (!loadedTags.includes(clean)) {
        setLoadedTags((prev) => [...prev, clean]);
      }
    }
    setInputValue('');
    setIsOpen(false);
    setHighlightedIndex(-1);
    inputRef.current?.focus();
  };

  const handleRemoveTag = (tagToRemove: string) => {
    onChange(selectedTags.filter((t) => t !== tagToRemove));
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'ArrowDown') {
      e.preventDefault();
      setIsOpen(true);
      setHighlightedIndex((prev) =>
        prev < suggestions.length - 1 ? prev + 1 : 0
      );
    } else if (e.key === 'ArrowUp') {
      e.preventDefault();
      setIsOpen(true);
      setHighlightedIndex((prev) => (prev > 0 ? prev - 1 : suggestions.length - 1));
    } else if (e.key === 'Enter') {
      e.preventDefault();
      if (isOpen && highlightedIndex >= 0 && highlightedIndex < suggestions.length) {
        handleAddTag(suggestions[highlightedIndex]);
      } else if (cleanInput) {
        handleAddTag(cleanInput);
      }
    } else if (e.key === 'Escape') {
      setIsOpen(false);
      setHighlightedIndex(-1);
    } else if (e.key === 'Backspace' && !inputValue && selectedTags.length > 0) {
      handleRemoveTag(selectedTags[selectedTags.length - 1]);
    }
  };

  return (
    <div className="space-y-2 text-left relative" ref={containerRef}>
      {label && (
        <label className="block text-[11px] font-bold uppercase tracking-wider text-zinc-700 dark:text-zinc-300">
          {label}
        </label>
      )}

      {/* Input row */}
      <div className="flex items-center gap-2">
        <div className="relative flex-1">
          <input
            ref={inputRef}
            type="text"
            placeholder={placeholder}
            value={inputValue}
            onChange={(e) => {
              setInputValue(e.target.value);
              setIsOpen(true);
              setHighlightedIndex(-1);
            }}
            onFocus={() => setIsOpen(true)}
            onKeyDown={handleKeyDown}
            className="w-full rounded-xl text-xs sm:text-sm py-2 px-3 bg-white dark:bg-[#18181b] border border-zinc-200 dark:border-white/[0.1] focus:border-indigo-500 outline-hidden transition-colors"
          />

          {/* Autocomplete / Suggestions Popover */}
          {isOpen && (suggestions.length > 0 || cleanInput) && (
            <div className="absolute left-0 right-0 top-full mt-1.5 z-50 rounded-2xl bg-white dark:bg-[#18181b] border border-zinc-200 dark:border-white/[0.12] shadow-xl overflow-hidden py-1.5 max-h-56 overflow-y-auto animate-in fade-in slide-in-from-top-1 duration-150">
              <div className="px-3 py-1 text-[10px] font-bold uppercase tracking-wider text-zinc-400 dark:text-zinc-500 border-b border-zinc-100 dark:border-white/[0.04]">
                {cleanInput ? 'Matching Suggestions' : 'Popular / Existing Tags'}
              </div>

              {suggestions.map((suggestion, idx) => (
                <button
                  key={suggestion}
                  type="button"
                  onClick={() => handleAddTag(suggestion)}
                  onMouseEnter={() => setHighlightedIndex(idx)}
                  className={`w-full flex items-center justify-between px-3 py-1.5 text-xs text-left transition-colors cursor-pointer ${
                    highlightedIndex === idx
                      ? 'bg-indigo-50 dark:bg-indigo-950/40 text-indigo-600 dark:text-indigo-400 font-semibold'
                      : 'text-zinc-700 dark:text-zinc-300 hover:bg-zinc-100 dark:hover:bg-zinc-800'
                  }`}
                >
                  <div className="flex items-center gap-1.5 truncate">
                    <Tag className="w-3 h-3 text-indigo-500 shrink-0" />
                    <span>{suggestion}</span>
                  </div>
                  <span className="text-[10px] text-zinc-400">add tag</span>
                </button>
              ))}

              {/* If user typed a custom tag that isn't an exact match in suggestions */}
              {cleanInput && !suggestions.some((s) => s.toLowerCase() === cleanInput) && (
                <button
                  type="button"
                  onClick={() => handleAddTag(cleanInput)}
                  className="w-full flex items-center gap-1.5 px-3 py-1.5 text-xs text-left text-indigo-600 dark:text-indigo-400 hover:bg-indigo-50 dark:hover:bg-indigo-950/30 font-semibold transition-colors border-t border-zinc-100 dark:border-white/[0.04] cursor-pointer"
                >
                  <Plus className="w-3.5 h-3.5" />
                  <span>Create tag &ldquo;{cleanInput}&rdquo;</span>
                </button>
              )}
            </div>
          )}
        </div>

        <Button
          type="button"
          size="sm"
          variant="secondary"
          onClick={() => {
            if (cleanInput) {
              handleAddTag(cleanInput);
            }
          }}
          disabled={!cleanInput}
        >
          Add
        </Button>
      </div>

      {/* Selected Tag Badges */}
      {selectedTags.length > 0 && (
        <div className="flex flex-wrap gap-1.5 pt-1">
          {selectedTags.map((t) => (
            <span
              key={t}
              className="inline-flex items-center gap-1.5 text-xs font-medium bg-indigo-500/10 text-indigo-600 dark:text-indigo-400 px-2.5 py-1 rounded-lg border border-indigo-500/20 shadow-2xs group"
            >
              <Tag className="w-3 h-3" />
              <span>{t}</span>
              <button
                type="button"
                onClick={() => handleRemoveTag(t)}
                className="p-0.5 rounded-full hover:bg-indigo-500/20 text-indigo-500 hover:text-indigo-700 dark:hover:text-indigo-300 transition-colors cursor-pointer"
                title={`Remove ${t}`}
              >
                &times;
              </button>
            </span>
          ))}
        </div>
      )}

      {/* Quick clickable tag suggestions under input if no tag is selected */}
      {selectedTags.length === 0 && allAvailable.length > 0 && (
        <div className="flex flex-wrap items-center gap-1 pt-0.5">
          <span className="text-[10px] text-zinc-400 dark:text-zinc-500 mr-1">Suggestions:</span>
          {allAvailable.slice(0, 5).map((t) => (
            <button
              key={t}
              type="button"
              onClick={() => handleAddTag(t)}
              className="inline-flex items-center gap-1 text-[11px] px-2 py-0.5 rounded-md bg-zinc-100 dark:bg-zinc-800 text-zinc-600 dark:text-zinc-400 hover:bg-indigo-500/10 hover:text-indigo-600 dark:hover:text-indigo-400 hover:border-indigo-500/20 border border-zinc-200 dark:border-white/[0.08] transition-colors cursor-pointer"
            >
              <Plus className="w-2.5 h-2.5" />
              <span>{t}</span>
            </button>
          ))}
        </div>
      )}

      {helperText && (
        <p className="text-xs text-zinc-500 dark:text-zinc-400">{helperText}</p>
      )}
    </div>
  );
};
