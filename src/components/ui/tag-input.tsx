'use client';

import { useState } from 'react';
import { X, Tag } from 'lucide-react';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';

interface TagInputProps {
  tags: string[];
  onTagsChange: (tags: string[]) => void;
  maxTags?: number;
  placeholder?: string;
  disabled?: boolean;
  className?: string;
}

export function TagInput({ 
  tags, 
  onTagsChange, 
  maxTags = 10, 
  placeholder = "Add a tag...", 
  disabled = false,
  className = "" 
}: TagInputProps) {
  const [currentTag, setCurrentTag] = useState('');

  const addTag = () => {
    const trimmedTag = currentTag.trim();
    if (trimmedTag && !tags.includes(trimmedTag) && tags.length < maxTags) {
      onTagsChange([...tags, trimmedTag]);
      setCurrentTag('');
    }
  };

  const removeTag = (tagToRemove: string) => {
    onTagsChange(tags.filter(tag => tag !== tagToRemove));
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') {
      e.preventDefault();
      addTag();
    }
  };

  return (
    <div className={className}>
      <label className="block text-sm font-medium text-gray-700 mb-2">
        Tags ({tags.length}/{maxTags})
      </label>
      
      {/* Existing Tags */}
      {tags.length > 0 && (
        <div className="flex flex-wrap gap-2 mb-3">
          {tags.map((tag, index) => (
            <span
              key={index}
              className="inline-flex items-center gap-1 px-3 py-1 bg-blue-100 text-blue-800 rounded-lg text-sm"
            >
              <Tag className="w-3 h-3" />
              {tag}
              {!disabled && (
                <button
                  type="button"
                  onClick={() => removeTag(tag)}
                  className="ml-1 text-blue-600 hover:text-blue-800 transition-colors"
                >
                  <X className="w-3 h-3" />
                </button>
              )}
            </span>
          ))}
        </div>
      )}

      {/* Tag Input */}
      {!disabled && tags.length < maxTags && (
        <div className="flex gap-2">
          <Input
            type="text"
            placeholder={placeholder}
            value={currentTag}
            onChange={(e) => setCurrentTag(e.target.value)}
            onKeyPress={handleKeyPress}
            className="flex-1"
          />
          <Button
            type="button"
            onClick={addTag}
            variant="outline"
            disabled={!currentTag.trim() || tags.includes(currentTag.trim())}
          >
            Add
          </Button>
        </div>
      )}

      {tags.length >= maxTags && !disabled && (
        <p className="text-sm text-orange-600 mt-2">
          Maximum {maxTags} tags reached
        </p>
      )}
    </div>
  );
} 