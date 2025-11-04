'use client';

import React, { useRef, useState } from 'react';
import { Upload, File, X } from 'lucide-react';
import { cn } from '@/lib/utils';

interface FileUploadProps {
  onFileSelect: (files: File[]) => void;
  accept?: string;
  disabled?: boolean;
  maxSizeMB?: number;
  selectedFiles?: File[];
  multiple?: boolean;
  translations?: {
    clickToSelect?: string;
    supportedFormats?: string;
    maxSize?: string;
    filesSelected?: string;
  };
}

export function FileUpload({
  onFileSelect,
  accept = '.pdf,.doc,.docx,.txt,.ppt,.pptx',
  disabled = false,
  maxSizeMB = 10, // Default 10MB limit for security and cost optimization
  selectedFiles = [],
  multiple = true,
  translations,
}: FileUploadProps) {
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [isDragging, setIsDragging] = useState(false);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(e.target.files || []);
    onFileSelect(files);
  };

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    if (!disabled) {
      setIsDragging(true);
    }
  };

  const handleDragLeave = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);

    if (disabled) return;

    const files = Array.from(e.dataTransfer.files || []);
    if (files.length > 0) {
      onFileSelect(files);
      // Update the file input
      if (fileInputRef.current) {
        const dataTransfer = new DataTransfer();
        files.forEach(file => dataTransfer.items.add(file));
        fileInputRef.current.files = dataTransfer.files;
      }
    }
  };

  const handleClick = () => {
    if (!disabled && fileInputRef.current) {
      fileInputRef.current.click();
    }
  };

  const handleRemoveFile = (e: React.MouseEvent, indexToRemove: number) => {
    e.stopPropagation();
    const newFiles = selectedFiles.filter((_, index) => index !== indexToRemove);
    onFileSelect(newFiles);

    // If all files removed, clear the input
    if (newFiles.length === 0 && fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  const handleClearAll = (e: React.MouseEvent) => {
    e.stopPropagation();
    onFileSelect([]);
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  return (
    <div
      onClick={handleClick}
      onDragOver={handleDragOver}
      onDragLeave={handleDragLeave}
      onDrop={handleDrop}
      className={cn(
        'relative border-2 border-dashed rounded-lg p-8 transition-all cursor-pointer',
        'hover:border-primary hover:bg-primary/5',
        isDragging && 'border-primary bg-primary/10',
        disabled && 'opacity-50 cursor-not-allowed hover:border-border hover:bg-transparent',
        selectedFiles.length > 0 ? 'border-green-500 bg-green-50 dark:bg-green-950' : 'border-border'
      )}
    >
      <input
        ref={fileInputRef}
        type="file"
        accept={accept}
        multiple={multiple}
        onChange={handleFileChange}
        disabled={disabled}
        className="hidden"
      />

      {selectedFiles.length === 0 ? (
        <div className="flex flex-col items-center justify-center text-center space-y-3">
          <div className="h-12 w-12 rounded-full bg-primary/10 flex items-center justify-center">
            <Upload className="h-6 w-6 text-primary" />
          </div>
          <div>
            <p className="text-sm font-medium">
              {translations?.clickToSelect || 'Clique para selecionar ou arraste o arquivo aqui'}
            </p>
            <p className="text-xs text-muted-foreground mt-1">
              {translations?.supportedFormats || 'Formatos suportados: PDF, DOC, DOCX, TXT, PPT, PPTX'}
            </p>
            <p className="text-xs text-muted-foreground">
              {translations?.maxSize ? translations.maxSize.replace('{maxSizeMB}', maxSizeMB.toString()) : `Tamanho máximo: ${maxSizeMB}MB`}
            </p>
          </div>
        </div>
      ) : (
        <div className="space-y-2">
          <div className="flex items-center justify-between mb-3">
            <p className="text-sm font-medium text-green-600 dark:text-green-400">
              {translations?.filesSelected || `${selectedFiles.length} file(s) selected`}
            </p>
            <button
              type="button"
              onClick={handleClearAll}
              disabled={disabled}
              className="text-xs text-destructive hover:underline"
            >
              Clear all
            </button>
          </div>

          <div className="space-y-2 max-h-[200px] overflow-y-auto">
            {selectedFiles.map((file, index) => (
              <div key={`${file.name}-${index}`} className="flex items-center justify-between bg-white dark:bg-gray-800 p-2 rounded-lg border border-green-200 dark:border-green-800">
                <div className="flex items-center space-x-3 flex-1 min-w-0">
                  <div className="h-8 w-8 rounded-lg bg-green-100 dark:bg-green-900 flex items-center justify-center flex-shrink-0">
                    <File className="h-4 w-4 text-green-600 dark:text-green-400" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium truncate">{file.name}</p>
                    <p className="text-xs text-muted-foreground">
                      {(file.size / 1024 / 1024).toFixed(2)} MB
                    </p>
                  </div>
                </div>
                <button
                  type="button"
                  onClick={(e) => handleRemoveFile(e, index)}
                  disabled={disabled}
                  className="ml-2 h-7 w-7 rounded-full hover:bg-destructive/10 flex items-center justify-center transition-colors flex-shrink-0"
                >
                  <X className="h-3 w-3 text-destructive" />
                </button>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
