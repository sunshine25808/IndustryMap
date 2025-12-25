import React, { useState, useEffect, useRef } from 'react';

interface EditableTextProps {
  text: string;
  onSave: (newText: string) => void;
  className?: string;
  placeholder?: string;
  multiline?: boolean;
}

export const EditableText: React.FC<EditableTextProps> = ({ 
  text, 
  onSave, 
  className = "", 
  placeholder = "Edit...",
  multiline = false
}) => {
  const [isEditing, setIsEditing] = useState(false);
  const [value, setValue] = useState(text);
  const inputRef = useRef<HTMLInputElement | HTMLTextAreaElement>(null);

  useEffect(() => {
    setValue(text);
  }, [text]);

  useEffect(() => {
    if (isEditing && inputRef.current) {
      inputRef.current.focus();
    }
  }, [isEditing]);

  const handleBlur = () => {
    setIsEditing(false);
    if (value.trim() !== text) {
      onSave(value);
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleBlur();
    }
    if (e.key === 'Escape') {
      setValue(text);
      setIsEditing(false);
    }
  };

  if (isEditing) {
    if (multiline) {
      return (
        <textarea
          ref={inputRef as React.RefObject<HTMLTextAreaElement>}
          value={value}
          onChange={(e) => setValue(e.target.value)}
          onBlur={handleBlur}
          onKeyDown={handleKeyDown}
          className={`w-full bg-white border border-blue-400 rounded px-1 outline-none text-gray-800 ${className}`}
          rows={2}
        />
      );
    }
    return (
      <input
        ref={inputRef as React.RefObject<HTMLInputElement>}
        value={value}
        onChange={(e) => setValue(e.target.value)}
        onBlur={handleBlur}
        onKeyDown={handleKeyDown}
        className={`w-full bg-white border border-blue-400 rounded px-1 outline-none text-gray-800 ${className}`}
      />
    );
  }

  return (
    <span 
      onClick={() => setIsEditing(true)}
      className={`cursor-pointer hover:bg-blue-100/50 rounded px-1 -mx-1 transition-colors border border-transparent hover:border-blue-200 ${className} ${!text ? 'text-gray-400 italic' : ''}`}
      title="Click to edit"
    >
      {text || placeholder}
    </span>
  );
};