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
            <span className="hidden sm:inline-block text-xs bg-primary/10 text-primary px-2 py-0.5 rounded-full">
              Free AI Tool
            </span>
          </div>
          <a
            href="https://github.com/chrisjohnleah/theme-extractor"
            target="_blank"
            rel="noopener noreferrer"
            className="text-muted-foreground hover:text-foreground transition-colors"
            aria-label="View source on GitHub"
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
              Free AI-Powered Tailwind Theme Extractor
            </h1>
            <p className="text-lg text-muted-foreground max-w-2xl mx-auto">
              Extract Tailwind CSS and shadcn/ui theme variables from any website URL or screenshot in seconds.
              Perfect for <strong>Lovable.dev</strong>, <strong>v0.dev</strong>, and modern web development.
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
          <section aria-labelledby="features-heading">
            <h2 id="features-heading" className="sr-only">Features</h2>
            <div className="grid gap-4 md:grid-cols-3">
              <Card>
                <CardHeader>
                  <CardTitle className="text-lg">Website URL Extraction</CardTitle>
                </CardHeader>
                <CardContent>
                  <p className="text-sm text-muted-foreground">
                    Paste any website URL and our AI analyzes its CSS to extract the complete color palette automatically.
                  </p>
                </CardContent>
              </Card>
              <Card>
                <CardHeader>
                  <CardTitle className="text-lg">AI Screenshot Analysis</CardTitle>
                </CardHeader>
                <CardContent>
                  <p className="text-sm text-muted-foreground">
                    Upload a screenshot and our AI-powered color quantization algorithm extracts dominant brand colors.
                  </p>
                </CardContent>
              </Card>
              <Card>
                <CardHeader>
                  <CardTitle className="text-lg">shadcn/ui Ready CSS</CardTitle>
                </CardHeader>
                <CardContent>
                  <p className="text-sm text-muted-foreground">
                    Get production-ready CSS variables compatible with shadcn/ui, Lovable.dev, v0.dev, and Tailwind CSS.
                  </p>
                </CardContent>
              </Card>
            </div>
          </section>

          {/* How it works */}
          <section className="text-center space-y-4 py-8 border-t">
            <h2 className="text-2xl font-semibold">How It Works</h2>
            <div className="grid gap-6 md:grid-cols-3 text-left max-w-3xl mx-auto">
              <div className="space-y-2">
                <div className="text-3xl font-bold text-primary">1</div>
                <h3 className="font-medium">Paste URL or Upload</h3>
                <p className="text-sm text-muted-foreground">
                  Enter any website URL or drag and drop a screenshot
                </p>
              </div>
              <div className="space-y-2">
                <div className="text-3xl font-bold text-primary">2</div>
                <h3 className="font-medium">AI Extracts Colors</h3>
                <p className="text-sm text-muted-foreground">
                  Our AI identifies primary, secondary, and accent colors
                </p>
              </div>
              <div className="space-y-2">
                <div className="text-3xl font-bold text-primary">3</div>
                <h3 className="font-medium">Copy CSS Variables</h3>
                <p className="text-sm text-muted-foreground">
                  One-click copy ready-to-use Tailwind theme variables
                </p>
              </div>
            </div>
          </section>
        </div>
      </main>

      {/* Footer */}
      <footer className="border-t mt-16 bg-muted/30">
        <div className="container mx-auto px-4 py-8">
          <div className="flex flex-col md:flex-row items-center justify-between gap-4">
            <div className="flex items-center gap-2">
              <Palette className="h-5 w-5 text-muted-foreground" />
              <span className="font-semibold">ThemeGrab</span>
            </div>
            <p className="text-sm text-muted-foreground text-center">
              Built by{' '}
              <a
                href="https://happywebs.co.uk"
                target="_blank"
                rel="noopener noreferrer"
                className="font-medium text-foreground hover:text-primary transition-colors"
              >
                Chris Leah
              </a>
              {' '}at{' '}
              <a
                href="https://happywebs.co.uk"
                target="_blank"
                rel="noopener noreferrer"
                className="font-medium text-foreground hover:text-primary transition-colors"
              >
                HappyWebs.co.uk
              </a>
            </p>
            <div className="flex items-center gap-4 text-sm text-muted-foreground">
              <a
                href="https://github.com/chrisjohnleah/theme-extractor"
                target="_blank"
                rel="noopener noreferrer"
                className="hover:text-foreground transition-colors"
              >
                Open Source
              </a>
            </div>
          </div>
        </div>
      </footer>
    </div>
  );
}

export default App;
