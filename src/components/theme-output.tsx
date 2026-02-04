import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Check, Copy, Download } from 'lucide-react';
import type { ExtractedTheme } from '@/lib/theme-generator';
import { generateCSSOutput } from '@/lib/theme-generator';

interface ThemeOutputProps {
  theme: ExtractedTheme | null;
}

export function ThemeOutput({ theme }: ThemeOutputProps) {
  const [copied, setCopied] = useState(false);

  if (!theme) {
    return (
      <div className="rounded-lg border border-dashed border-muted-foreground/25 p-8 text-center">
        <p className="text-muted-foreground">
          Enter a URL or upload a screenshot to extract a theme
        </p>
      </div>
    );
  }

  const cssOutput = generateCSSOutput(theme);

  const handleCopy = async () => {
    await navigator.clipboard.writeText(cssOutput);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const handleDownload = () => {
    const blob = new Blob([cssOutput], { type: 'text/css' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'theme.css';
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };

  return (
    <div className="space-y-4">
      <div className="flex justify-end gap-2">
        <Button variant="outline" size="sm" onClick={handleDownload}>
          <Download className="h-4 w-4 mr-2" />
          Download
        </Button>
        <Button size="sm" onClick={handleCopy}>
          {copied ? (
            <>
              <Check className="h-4 w-4 mr-2" />
              Copied!
            </>
          ) : (
            <>
              <Copy className="h-4 w-4 mr-2" />
              Copy CSS
            </>
          )}
        </Button>
      </div>

      <div className="relative">
        <pre className="rounded-lg bg-muted p-4 overflow-x-auto text-sm">
          <code>{cssOutput}</code>
        </pre>
      </div>

      {theme.colorDetails && theme.colorDetails.length > 0 && (
        <div className="space-y-2">
          <h4 className="text-sm font-medium text-muted-foreground">
            Extracted Colors (sorted by frequency)
          </h4>
          <div className="flex flex-wrap gap-2">
            {theme.colorDetails.map((colorInfo, i) => (
              <div
                key={i}
                className="flex items-center gap-2 rounded-md border bg-background px-2 py-1"
                title={`Hue: ${colorInfo.hue}°, Found ${colorInfo.frequency}x`}
              >
                <div
                  className="h-4 w-4 rounded-sm border"
                  style={{ backgroundColor: colorInfo.hex }}
                />
                <span className="text-xs font-mono">{colorInfo.hex}</span>
                <span className="text-xs text-muted-foreground">({colorInfo.frequency}x)</span>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
