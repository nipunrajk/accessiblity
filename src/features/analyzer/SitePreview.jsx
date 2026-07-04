import { Card } from '@radix-ui/themes';
import { Camera, ZoomIn, AlertTriangle } from 'lucide-react';

export default function SitePreview({ screenshot, loading, error, device }) {
  return (
    <Card variant="surface">
      <div className="relative group">
        <div className="aspect-video rounded-lg overflow-hidden flex items-center justify-center relative">
          {loading ? (
            <div className="text-center">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto mb-2" />
              <p className="text-xs text-muted-foreground animate-pulse">Capturing screenshot...</p>
            </div>
          ) : error ? (
            <div className="text-center p-4">
              <AlertTriangle className="h-6 w-6 text-destructive mx-auto mb-2" />
              <p className="text-xs text-muted-foreground">{error}</p>
            </div>
          ) : screenshot ? (
            <img
              src={screenshot}
              alt={`${device} screenshot`}
              className="w-full h-full object-cover"
            />
          ) : (
            <div className="text-center">
              <Camera className="h-8 w-8 mx-auto mb-2 opacity-50" />
              <p className="text-xs">Screenshot preview</p>
              <p className="text-[10px]">
                {device === "desktop" ? "1920×1080" : "375×667"}
              </p>
            </div>
          )}
        </div>
        <div className="absolute top-2 left-2">
          <span className="px-2 py-1 text-[10px] bg-background/90 backdrop-blur border rounded">
            {device === "desktop" ? "1920×1080" : "375×667"}
          </span>
        </div>
        <button className="absolute bottom-2 right-2 px-2 py-1 text-xs bg-secondary rounded-lg opacity-0 group-hover:opacity-100 transition-opacity flex items-center gap-1">
          <ZoomIn className="h-3 w-3" />
          Expand
        </button>
      </div>
    </Card>
  );
}
