import { Upload, Loader2 } from "lucide-react";
import { useDropzone, type Accept } from "react-dropzone";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

interface FileUploadAreaProps {
  onDrop: (files: File[]) => void;
  accept?: Accept;
  maxFiles?: number;
  maxSize?: number; // in bytes
  isUploading?: boolean;
  disabled?: boolean;
  title?: string;
  description?: string;
  uploadingText?: string;
  buttonText?: string;
  className?: string;
}

export function FileUploadArea({
  onDrop,
  accept = {
    'application/pdf': ['.pdf'],
    'text/plain': ['.txt'],
  },
  maxFiles = 1,
  maxSize = 10 * 1024 * 1024, // 10MB default
  isUploading = false,
  disabled = false,
  title = "Upload File",
  description = "Drag and drop files, or click to select",
  uploadingText = "Uploading...",
  buttonText = "Select File",
  className,
}: FileUploadAreaProps) {
  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    onDrop,
    accept,
    maxFiles,
    maxSize,
    multiple: maxFiles > 1,
    disabled: disabled || isUploading,
  });

  const formatAcceptedTypes = () => {
    const types: string[] = [];
    Object.keys(accept).forEach(key => {
      const extensions = accept[key];
      if (extensions && extensions.length > 0) {
        types.push(...extensions.map(ext => ext.toUpperCase().replace('.', '')));
      }
    });
    return types.join(', ');
  };

  const formatMaxSize = () => {
    const kb = 1024;
    const mb = kb * 1024;
    if (maxSize >= mb) {
      return `max ${(maxSize / mb).toFixed(0)}MB`;
    }
    return `max ${(maxSize / kb).toFixed(0)}KB`;
  };

  return (
    <div
      {...getRootProps()}
      className={cn(
        "border-2 border-dashed rounded-lg p-8 text-center cursor-pointer transition-colors",
        isDragActive
          ? "border-indigo-500 bg-indigo-50 dark:bg-indigo-900/30"
          : "border-gray-300 dark:border-gray-600 hover:border-gray-400 dark:hover:border-gray-500",
        (disabled || isUploading) && "opacity-60 cursor-not-allowed",
        className
      )}
    >
      <input {...getInputProps()} />
      <div className="h-16 w-16 bg-indigo-100 dark:bg-indigo-900/30 rounded-2xl mx-auto mb-4 flex items-center justify-center">
        {isUploading ? (
          <Loader2 className="h-8 w-8 text-indigo-600 animate-spin" />
        ) : (
          <Upload className="h-8 w-8 text-indigo-600 dark:text-indigo-400" />
        )}
      </div>
      <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-2">
        {isUploading ? uploadingText : title}
      </h3>
      <p className="text-gray-600 dark:text-gray-400 mb-6 max-w-sm mx-auto">
        {isDragActive
          ? "Drop the file here..."
          : `${description} (${formatAcceptedTypes()}, ${formatMaxSize()})`
        }
      </p>
      <Button
        type="button"
        disabled={disabled || isUploading}
        className="bg-indigo-600 hover:bg-indigo-700 dark:bg-indigo-700 dark:hover:bg-indigo-800"
        onClick={(e) => {
          // Prevent event propagation if needed
          if (disabled || isUploading) {
            e.stopPropagation();
          }
        }}
      >
        {isUploading ? (
          <>
            <Loader2 className="h-4 w-4 mr-2 animate-spin" />
            {uploadingText}
          </>
        ) : (
          <>
            <Upload className="h-4 w-4 mr-2" />
            {buttonText}
          </>
        )}
      </Button>
    </div>
  );
}
