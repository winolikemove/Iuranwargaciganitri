'use client';

import { useState, useRef, useCallback } from 'react';
import { Button } from '@/components/ui/button';
import { Progress } from '@/components/ui/progress';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { 
  Upload, 
  X, 
  Image as ImageIcon, 
  FileText, 
  AlertCircle, 
  CheckCircle,
  Loader2 
} from 'lucide-react';
import { cn } from '@/lib/utils';

interface FileUploadProps {
  onUpload: (file: File) => Promise<{ ok: boolean; url?: string; error?: string }>;
  accept?: string;
  maxSizeMB?: number;
  className?: string;
  value?: string | null;
  onValueChange?: (url: string | null) => void;
  label?: string;
  description?: string;
  disabled?: boolean;
  previewClassName?: string;
}

export function FileUpload({
  onUpload,
  accept = 'image/*',
  maxSizeMB = 2,
  className,
  value,
  onValueChange,
  label = 'Upload File',
  description,
  disabled = false,
  previewClassName,
}: FileUploadProps) {
  const [isUploading, setIsUploading] = useState(false);
  const [uploadProgress, setUploadProgress] = useState(0);
  const [preview, setPreview] = useState<string | null>(value || null);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const validateFile = useCallback((file: File): string | null => {
    // Check file size
    const sizeMB = file.size / (1024 * 1024);
    if (sizeMB > maxSizeMB) {
      return `Ukuran file maksimal ${maxSizeMB}MB. File Anda: ${sizeMB.toFixed(2)}MB`;
    }

    // Check file type
    const acceptedTypes = accept.split(',').map(t => t.trim());
    const isAccepted = acceptedTypes.some(type => {
      if (type.endsWith('/*')) {
        const category = type.slice(0, -2);
        return file.type.startsWith(category);
      }
      return file.type === type;
    });

    if (!isAccepted) {
      return `Tipe file tidak didukung. Gunakan: ${accept}`;
    }

    return null;
  }, [accept, maxSizeMB]);

  const handleFileSelect = useCallback(async (file: File) => {
    setError(null);
    setSuccess(false);

    // Validate file
    const validationError = validateFile(file);
    if (validationError) {
      setError(validationError);
      return;
    }

    // Create preview for images
    if (file.type.startsWith('image/')) {
      const reader = new FileReader();
      reader.onload = (e) => {
        setPreview(e.target?.result as string);
      };
      reader.readAsDataURL(file);
    } else {
      setPreview(null);
    }

    // Upload file
    setIsUploading(true);
    setUploadProgress(0);

    try {
      // Simulate progress
      const progressInterval = setInterval(() => {
        setUploadProgress(prev => Math.min(prev + 10, 90));
      }, 100);

      const result = await onUpload(file);

      clearInterval(progressInterval);
      setUploadProgress(100);

      if (result.ok && result.url) {
        onValueChange?.(result.url);
        setSuccess(true);
        setTimeout(() => setSuccess(false), 3000);
      } else {
        setError(result.error || 'Gagal mengupload file');
        setPreview(value || null); // Revert preview
      }
    } catch (err) {
      setError('Terjadi kesalahan saat upload');
      setPreview(value || null);
    } finally {
      setIsUploading(false);
      setTimeout(() => setUploadProgress(0), 500);
    }
  }, [validateFile, onUpload, onValueChange, value]);

  const handleDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    const file = e.dataTransfer.files[0];
    if (file) {
      handleFileSelect(file);
    }
  }, [handleFileSelect]);

  const handleDragOver = useCallback((e: React.DragEvent) => {
    e.preventDefault();
  }, []);

  const handleClick = () => {
    if (!disabled && !isUploading) {
      fileInputRef.current?.click();
    }
  };

  const handleRemove = () => {
    setPreview(null);
    onValueChange?.(null);
    setError(null);
    setSuccess(false);
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  const isImage = preview?.startsWith('data:image') || 
    preview?.match(/\.(jpg|jpeg|png|gif|webp)$/i);

  return (
    <div className={cn('space-y-3', className)}>
      {label && (
        <label className="text-sm font-medium">{label}</label>
      )}
      
      {description && (
        <p className="text-sm text-muted-foreground">{description}</p>
      )}

      {/* Error/Success Messages */}
      {error && (
        <Alert variant="destructive">
          <AlertCircle className="h-4 w-4" />
          <AlertDescription>{error}</AlertDescription>
        </Alert>
      )}

      {success && (
        <Alert className="bg-green-50 border-green-500 text-green-800">
          <CheckCircle className="h-4 w-4 text-green-500" />
          <AlertDescription>File berhasil diupload</AlertDescription>
        </Alert>
      )}

      {/* Upload Area */}
      <div
        className={cn(
          'relative border-2 border-dashed rounded-lg transition-all cursor-pointer',
          isUploading ? 'border-primary bg-primary/5' : 'border-border hover:border-primary/50',
          disabled && 'opacity-50 cursor-not-allowed',
          preview && 'border-solid'
        )}
        onDrop={handleDrop}
        onDragOver={handleDragOver}
        onClick={handleClick}
      >
        <input
          ref={fileInputRef}
          type="file"
          accept={accept}
          className="hidden"
          disabled={disabled || isUploading}
          onChange={(e) => {
            const file = e.target.files?.[0];
            if (file) handleFileSelect(file);
          }}
        />

        {/* Progress Overlay */}
        {isUploading && (
          <div className="absolute inset-0 bg-background/80 flex flex-col items-center justify-center rounded-lg z-10">
            <Loader2 className="h-8 w-8 animate-spin text-primary mb-2" />
            <p className="text-sm font-medium mb-2">Mengupload...</p>
            <Progress value={uploadProgress} className="w-3/4" />
          </div>
        )}

        {/* Preview */}
        {preview ? (
          <div className={cn('p-4', previewClassName)}>
            {isImage ? (
              <div className="relative group">
                <img
                  src={preview}
                  alt="Preview"
                  className="w-full h-48 object-cover rounded-lg"
                />
                <div className="absolute inset-0 bg-black/50 opacity-0 group-hover:opacity-100 transition-opacity rounded-lg flex items-center justify-center gap-2">
                  <Button
                    size="sm"
                    variant="secondary"
                    onClick={(e) => {
                      e.stopPropagation();
                      handleClick();
                    }}
                    disabled={disabled || isUploading}
                  >
                    Ganti
                  </Button>
                  <Button
                    size="sm"
                    variant="destructive"
                    onClick={(e) => {
                      e.stopPropagation();
                      handleRemove();
                    }}
                    disabled={disabled || isUploading}
                  >
                    <X className="h-4 w-4" />
                  </Button>
                </div>
              </div>
            ) : (
              <div className="flex items-center gap-3 p-4 bg-muted rounded-lg">
                <FileText className="h-10 w-10 text-muted-foreground" />
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium truncate">File uploaded</p>
                  <p className="text-xs text-muted-foreground">Klik untuk mengganti</p>
                </div>
                <Button
                  size="sm"
                  variant="ghost"
                  onClick={(e) => {
                    e.stopPropagation();
                    handleRemove();
                  }}
                  disabled={disabled || isUploading}
                >
                  <X className="h-4 w-4" />
                </Button>
              </div>
            )}
          </div>
        ) : (
          <div className="p-8 text-center">
            <div className="mx-auto w-12 h-12 rounded-full bg-muted flex items-center justify-center mb-4">
              {accept.includes('image') ? (
                <ImageIcon className="h-6 w-6 text-muted-foreground" />
              ) : (
                <Upload className="h-6 w-6 text-muted-foreground" />
              )}
            </div>
            <p className="text-sm font-medium mb-1">
              {isUploading ? 'Mengupload...' : 'Klik atau drag file ke sini'}
            </p>
            <p className="text-xs text-muted-foreground">
              Maksimal {maxSizeMB}MB
            </p>
          </div>
        )}
      </div>
    </div>
  );
}

// Avatar upload component specifically for profile photos
interface AvatarUploadProps {
  onUpload: (file: File) => Promise<{ ok: boolean; url?: string; error?: string }>;
  value?: string | null;
  onValueChange?: (url: string | null) => void;
  disabled?: boolean;
  maxSizeMB?: number;
}

export function AvatarUpload({
  onUpload,
  value,
  onValueChange,
  disabled = false,
  maxSizeMB = 2,
}: AvatarUploadProps) {
  const [isUploading, setIsUploading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleFileSelect = async (file: File) => {
    setError(null);

    // Validate file size
    const sizeMB = file.size / (1024 * 1024);
    if (sizeMB > maxSizeMB) {
      setError(`Ukuran file maksimal ${maxSizeMB}MB`);
      return;
    }

    // Validate image type
    if (!file.type.startsWith('image/')) {
      setError('File harus berupa gambar');
      return;
    }

    setIsUploading(true);

    try {
      const result = await onUpload(file);
      if (result.ok && result.url) {
        onValueChange?.(result.url);
      } else {
        setError(result.error || 'Gagal mengupload foto');
      }
    } catch {
      setError('Terjadi kesalahan');
    } finally {
      setIsUploading(false);
    }
  };

  return (
    <div className="relative inline-block">
      <input
        ref={fileInputRef}
        type="file"
        accept="image/*"
        className="hidden"
        disabled={disabled || isUploading}
        onChange={(e) => {
          const file = e.target.files?.[0];
          if (file) handleFileSelect(file);
        }}
      />

      <button
        type="button"
        onClick={() => fileInputRef.current?.click()}
        disabled={disabled || isUploading}
        className="relative group rounded-full overflow-hidden"
      >
        {value ? (
          <img
            src={value}
            alt="Avatar"
            className="w-24 h-24 object-cover rounded-full"
          />
        ) : (
          <div className="w-24 h-24 rounded-full bg-emerald-500 flex items-center justify-center text-white text-2xl font-bold">
            <ImageIcon className="h-8 w-8" />
          </div>
        )}
        
        <div className="absolute inset-0 bg-black/50 opacity-0 group-hover:opacity-100 transition-opacity rounded-full flex items-center justify-center">
          {isUploading ? (
            <Loader2 className="h-6 w-6 animate-spin text-white" />
          ) : (
            <Upload className="h-6 w-6 text-white" />
          )}
        </div>
      </button>

      {error && (
        <p className="text-xs text-destructive mt-2 text-center">{error}</p>
      )}
    </div>
  );
}
