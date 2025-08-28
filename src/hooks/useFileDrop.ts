import { useState, useRef, useCallback } from "react";

interface UseFileDropOptions {
  onFilesSelected: (files: File[]) => void;
  multiple?: boolean;
  maxSize?: number; // in bytes
}

interface UseFileDropReturn {
  isDragOver: boolean;
  fileInputRef: React.RefObject<HTMLInputElement>;
  dragHandlers: {
    onDragLeave: (e: React.DragEvent) => void;
    onDragOver: (e: React.DragEvent) => void;
    onDrop: (e: React.DragEvent) => void;
  };
  handleFileInputChange: (e: React.ChangeEvent<HTMLInputElement>) => void;
  handleClick: () => void;
}

export function useFileDrop({
  onFilesSelected,
  multiple = true,
  maxSize,
}: UseFileDropOptions): UseFileDropReturn {
  const [isDragOver, setIsDragOver] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleDragLeave = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragOver(false);
  }, []);

  const handleDragOver = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragOver(true);
  }, []);

  const handleDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragOver(false);

    const files = Array.from(e.dataTransfer.files);
    if (files.length > 0) {
      processFiles(files);
    }
  }, []);

  const handleFileInputChange = useCallback(
    (e: React.ChangeEvent<HTMLInputElement>) => {
      const files = Array.from(e.target.files || []);
      if (files.length > 0) {
        processFiles(files);
      }
      // Reset the input value so the same file can be selected again
      if (fileInputRef.current) {
        fileInputRef.current.value = "";
      }
    },
    []
  );

  const processFiles = useCallback(
    (files: File[]) => {
      let validFiles = files;

      // Filter by file size if maxSize is specified
      if (maxSize) {
        validFiles = validFiles.filter((file) => file.size <= maxSize);
      }

      if (validFiles.length > 0) {
        onFilesSelected(validFiles);
      }
    },
    [maxSize, onFilesSelected]
  );

  const handleClick = useCallback(() => {
    fileInputRef.current?.click();
  }, []);

  return {
    isDragOver,
    fileInputRef: fileInputRef as React.RefObject<HTMLInputElement>,
    dragHandlers: {
      onDragLeave: handleDragLeave,
      onDragOver: handleDragOver,
      onDrop: handleDrop,
    },
    handleFileInputChange,
    handleClick,
  };
}
