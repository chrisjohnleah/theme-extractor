import { useState } from 'react';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { UrlInput } from '@/components/url-input';
import { ScreenshotUpload } from '@/components/screenshot-upload';
import { ThemeOutput } from '@/components/theme-output';
import { ThemePreview } from '@/components/theme-preview';
import { extractColorsFromCSS } from '@/lib/color-utils';
import { generateTheme, generateThemeFromRGB, type ExtractedTheme } from '@/lib/theme-generator';
import type { RGB } from '@/lib/color-utils';
import { Palette, Github } from 'lucide-react';

function App() {
  const [theme, setTheme] = useState<ExtractedTheme | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleUrlExtract = async (url: string) => {
    setIsLoading(true);
    setError(null);

    try {
      let colors: string[] = [];

      // In production, use our Cloudflare Pages function
      // In development, use a CORS proxy
      if (import.meta.env.DEV) {
        // Use allorigins CORS proxy for development
        const proxyUrl = `https://api.allorigins.win/raw?url=${encodeURIComponent(url)}`;
        const response = await fetch(proxyUrl);

        if (!response.ok) {
          throw new Error('Failed to fetch website');
        }

        const html = await response.text();
        colors = extractColorsFromCSS(html);
      } else {
        // Use our API in production
        const apiUrl = `/api/extract?url=${encodeURIComponent(url)}`;
        const response = await fetch(apiUrl);

        if (!response.ok) {
          throw new Error('Failed to fetch website');
        }

        const data = await response.json();

        if (data.error) {
          throw new Error(data.error);
        }

        colors = data.colors?.length > 0
          ? data.colors
          : extractColorsFromCSS(data.css || '');
      }

      if (colors.length === 0) {
        throw new Error('No colors found on this page. Try uploading a screenshot instead.');
      }

      const extractedTheme = generateTheme(colors);
      setTheme(extractedTheme);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to extract theme');
    } finally {
      setIsLoading(false);
    }
  };

  const handleImageColorsExtracted = (colors: RGB[]) => {
    if (colors.length === 0) {
      setError('No colors could be extracted from the image');
      return;
    }

    const extractedTheme = generateThemeFromRGB(colors);
    setTheme(extractedTheme);
    setError(null);
  };

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <header className="border-b">
        <div className="container mx-auto px-4 py-4 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Palette className="h-6 w-6 text-primary" />
            <span className="text-xl font-bold">ThemeGrab</span>
          </div>
          <a
            href="https://github.com"
            target="_blank"
            rel="noopener noreferrer"
            className="text-muted-foreground hover:text-foreground transition-colors"
          >
            <Github className="h-5 w-5" />
          </a>
        </div>
      </header>

      {/* Main content */}
      <main className="container mx-auto px-4 py-8">
        <div className="max-w-4xl mx-auto space-y-8">
          {/* Hero */}
          <div className="text-center space-y-4">
            <h1 className="text-4xl font-bold tracking-tight">
              Extract Themes from Any Website
            </h1>
            <p className="text-lg text-muted-foreground max-w-2xl mx-auto">
              Grab Tailwind/shadcn CSS theme variables from any website URL or screenshot.
              Ready to paste into Lovable.dev, v0.dev, and more.
            </p>
          </div>

          {/* Input section */}
          <Card>
            <CardHeader>
              <CardTitle>Extract Theme</CardTitle>
              <CardDescription>
                Enter a website URL or upload a screenshot to extract color variables
              </CardDescription>
            </CardHeader>
            <CardContent>
              <Tabs defaultValue="url" className="space-y-4">
                <TabsList className="grid w-full grid-cols-2">
                  <TabsTrigger value="url">From URL</TabsTrigger>
                  <TabsTrigger value="screenshot">From Screenshot</TabsTrigger>
                </TabsList>
                <TabsContent value="url">
                  <UrlInput onExtract={handleUrlExtract} isLoading={isLoading} />
                </TabsContent>
                <TabsContent value="screenshot">
                  <ScreenshotUpload
                    onColorsExtracted={handleImageColorsExtracted}
                    isLoading={isLoading}
                    setIsLoading={setIsLoading}
                  />
                </TabsContent>
              </Tabs>

              {error && (
                <div className="mt-4 p-4 rounded-lg bg-destructive/10 text-destructive text-sm">
                  {error}
                </div>
              )}
            </CardContent>
          </Card>

          {/* Output section */}
          {theme && (
            <div className="grid gap-8 lg:grid-cols-2">
              <Card>
                <CardHeader>
                  <CardTitle>CSS Output</CardTitle>
                  <CardDescription>
                    Copy these variables into your project
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <ThemeOutput theme={theme} />
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle>Live Preview</CardTitle>
                  <CardDescription>
                    See how your extracted theme looks
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <ThemePreview theme={theme} />
                </CardContent>
              </Card>
            </div>
          )}

          {/* Features */}
          <div className="grid gap-4 md:grid-cols-3">
            <Card>
              <CardHeader>
                <CardTitle className="text-lg">URL Extraction</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-sm text-muted-foreground">
                  Paste any website URL and we'll analyze its CSS to extract the color palette.
                </p>
              </CardContent>
            </Card>
            <Card>
              <CardHeader>
                <CardTitle className="text-lg">Screenshot Analysis</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-sm text-muted-foreground">
                  Upload a screenshot and our color quantization algorithm extracts dominant colors.
                </p>
              </CardContent>
            </Card>
            <Card>
              <CardHeader>
                <CardTitle className="text-lg">Ready-to-Use CSS</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-sm text-muted-foreground">
                  Get shadcn/ui compatible CSS variables that work with Lovable.dev, v0.dev, and more.
                </p>
              </CardContent>
            </Card>
          </div>
        </div>
      </main>

      {/* Footer */}
      <footer className="border-t mt-16">
        <div className="container mx-auto px-4 py-6 text-center text-sm text-muted-foreground">
          <p>
            Built with React, Tailwind CSS, and shadcn/ui.
            Deploy your own on Cloudflare Pages.
          </p>
        </div>
      </footer>
    </div>
  );
}

export default App;
