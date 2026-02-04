import { useCallback, useState } from 'react';
import { Button } from '@/components/ui/button';
import { Upload, ImageIcon, Loader2, X } from 'lucide-react';
import { extractColorsFromImageData } from '@/lib/color-utils';
import type { RGB } from '@/lib/color-utils';

interface ScreenshotUploadProps {
  onColorsExtracted: (colors: RGB[]) => void;
  isLoading: boolean;
  setIsLoading: (loading: boolean) => void;
}

export function ScreenshotUpload({
  onColorsExtracted,
  isLoading,
  setIsLoading,
}: ScreenshotUploadProps) {
  const [preview, setPreview] = useState<string | null>(null);
  const [isDragging, setIsDragging] = useState(false);

  const processImage = useCallback(
    async (file: File) => {
      setIsLoading(true);

      // Create preview
      const reader = new FileReader();
      reader.onload = (e) => {
        setPreview(e.target?.result as string);
      };
      reader.readAsDataURL(file);

      // Extract colors from image
      const img = new Image();
      img.onload = () => {
        const canvas = document.createElement('canvas');
        const ctx = canvas.getContext('2d');
        if (!ctx) {
          setIsLoading(false);
          return;
        }

        // Scale down large images for performance
        const maxSize = 400;
        let width = img.width;
        let height = img.height;

        if (width > maxSize || height > maxSize) {
          if (width > height) {
            height = (height / width) * maxSize;
            width = maxSize;
          } else {
            width = (width / height) * maxSize;
            height = maxSize;
          }
        }

        canvas.width = width;
        canvas.height = height;
        ctx.drawImage(img, 0, 0, width, height);

        const imageData = ctx.getImageData(0, 0, width, height);
        const colors = extractColorsFromImageData(imageData);

        onColorsExtracted(colors);
        setIsLoading(false);
      };

      img.src = URL.createObjectURL(file);
    },
    [onColorsExtracted, setIsLoading]
  );

  const handleDrop = useCallback(
    (e: React.DragEvent) => {
      e.preventDefault();
      setIsDragging(false);

      const file = e.dataTransfer.files[0];
      if (file && file.type.startsWith('image/')) {
        processImage(file);
      }
    },
    [processImage]
  );

  const handleDragOver = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(true);
  }, []);

  const handleDragLeave = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
  }, []);

  const handleFileSelect = useCallback(
    (e: React.ChangeEvent<HTMLInputElement>) => {
      const file = e.target.files?.[0];
      if (file) {
        processImage(file);
      }
    },
    [processImage]
  );

  const clearPreview = () => {
    setPreview(null);
  };

  return (
    <div className="space-y-4">
      <div
        onDrop={handleDrop}
        onDragOver={handleDragOver}
        onDragLeave={handleDragLeave}
        className={`
          relative border-2 border-dashed rounded-lg p-8 text-center transition-colors
          ${isDragging ? 'border-primary bg-primary/5' : 'border-muted-foreground/25 hover:border-muted-foreground/50'}
          ${isLoading ? 'pointer-events-none opacity-50' : ''}
        `}
      >
        {preview ? (
          <div className="space-y-4">
            <div className="relative inline-block">
              <img
                src={preview}
                alt="Uploaded screenshot"
                className="max-h-48 rounded-lg shadow-lg"
              />
              <Button
                variant="destructive"
                size="icon"
                className="absolute -top-2 -right-2 h-6 w-6"
                onClick={clearPreview}
                disabled={isLoading}
              >
                <X className="h-4 w-4" />
              </Button>
            </div>
            {isLoading && (
              <div className="flex items-center justify-center gap-2 text-muted-foreground">
                <Loader2 className="h-4 w-4 animate-spin" />
                Extracting colors...
              </div>
            )}
          </div>
        ) : (
          <div className="space-y-4">
            <div className="flex justify-center">
              <div className="rounded-full bg-muted p-4">
                <ImageIcon className="h-8 w-8 text-muted-foreground" />
              </div>
            </div>
            <div>
              <p className="text-lg font-medium">Drop a screenshot here</p>
              <p className="text-sm text-muted-foreground">or click to browse</p>
            </div>
            <label>
              <input
                type="file"
                accept="image/*"
                onChange={handleFileSelect}
                className="hidden"
                disabled={isLoading}
              />
              <Button variant="outline" asChild disabled={isLoading}>
                <span className="cursor-pointer">
                  <Upload className="h-4 w-4 mr-2" />
                  Choose File
                </span>
              </Button>
            </label>
          </div>
        )}
      </div>
    </div>
  );
}
