'use client';

import React, { useRef, useState } from 'react';
import { Upload, File, X } from 'lucide-react';
import { cn } from '@/lib/utils';

interface FileUploadProps {
  onFileSelect: (file: File | null) => void;
  accept?: string;
  disabled?: boolean;
  maxSizeMB?: number;
  selectedFile?: File | null;
  translations?: {
    clickToSelect?: string;
    supportedFormats?: string;
    maxSize?: string;
  };
}

export function FileUpload({
  onFileSelect,
  accept = '.pdf,.doc,.docx,.txt,.ppt,.pptx',
  disabled = false,
  maxSizeMB = 50,
  selectedFile,
  translations,
}: FileUploadProps) {
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [isDragging, setIsDragging] = useState(false);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0] || null;
    onFileSelect(file);
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

    const file = e.dataTransfer.files?.[0];
    if (file) {
      onFileSelect(file);
      // Update the file input
      if (fileInputRef.current) {
        const dataTransfer = new DataTransfer();
        dataTransfer.items.add(file);
        fileInputRef.current.files = dataTransfer.files;
      }
    }
  };

  const handleClick = () => {
    if (!disabled && fileInputRef.current) {
      fileInputRef.current.click();
    }
  };

  const handleClear = (e: React.MouseEvent) => {
    e.stopPropagation();
    onFileSelect(null);
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
        selectedFile ? 'border-green-500 bg-green-50 dark:bg-green-950' : 'border-border'
      )}
    >
      <input
        ref={fileInputRef}
        type="file"
        accept={accept}
        onChange={handleFileChange}
        disabled={disabled}
        className="hidden"
      />

      {!selectedFile ? (
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
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-3">
            <div className="h-10 w-10 rounded-lg bg-green-100 dark:bg-green-900 flex items-center justify-center">
              <File className="h-5 w-5 text-green-600 dark:text-green-400" />
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-sm font-medium truncate">{selectedFile.name}</p>
              <p className="text-xs text-muted-foreground">
                {(selectedFile.size / 1024 / 1024).toFixed(2)} MB
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={handleClear}
            disabled={disabled}
            className="ml-4 h-8 w-8 rounded-full hover:bg-destructive/10 flex items-center justify-center transition-colors"
          >
            <X className="h-4 w-4 text-destructive" />
          </button>
        </div>
      )}
    </div>
  );
}
