import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Moon, Sun } from 'lucide-react';
import type { ExtractedTheme, ThemeColors } from '@/lib/theme-generator';

interface ThemePreviewProps {
  theme: ExtractedTheme | null;
}

function PreviewCard({ colors }: { colors: ThemeColors }) {
  // Create inline styles from theme colors
  const style = {
    '--background': colors.background,
    '--foreground': colors.foreground,
    '--card': colors.card,
    '--card-foreground': colors.cardForeground,
    '--primary': colors.primary,
    '--primary-foreground': colors.primaryForeground,
    '--secondary': colors.secondary,
    '--secondary-foreground': colors.secondaryForeground,
    '--muted': colors.muted,
    '--muted-foreground': colors.mutedForeground,
    '--accent': colors.accent,
    '--accent-foreground': colors.accentForeground,
    '--destructive': colors.destructive,
    '--destructive-foreground': colors.destructiveForeground,
    '--border': colors.border,
    '--input': colors.input,
    '--ring': colors.ring,
  } as React.CSSProperties;

  return (
    <div
      style={{
        ...style,
        backgroundColor: `hsl(${colors.background})`,
        color: `hsl(${colors.foreground})`,
      }}
      className="rounded-lg p-4"
    >
      <Card
        style={{
          backgroundColor: `hsl(${colors.card})`,
          borderColor: `hsl(${colors.border})`,
          color: `hsl(${colors.cardForeground})`,
        }}
      >
        <CardHeader className="pb-3">
          <CardTitle className="text-lg">Preview Card</CardTitle>
          <CardDescription
            style={{ color: `hsl(${colors.mutedForeground})` }}
          >
            This shows how your theme looks
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-3">
          <Input
            placeholder="Input field"
            style={{
              borderColor: `hsl(${colors.input})`,
              backgroundColor: 'transparent',
            }}
          />
          <div className="flex gap-2">
            <button
              className="inline-flex h-9 items-center justify-center rounded-md px-4 py-2 text-sm font-medium transition-colors"
              style={{
                backgroundColor: `hsl(${colors.primary})`,
                color: `hsl(${colors.primaryForeground})`,
              }}
            >
              Primary
            </button>
            <button
              className="inline-flex h-9 items-center justify-center rounded-md px-4 py-2 text-sm font-medium transition-colors"
              style={{
                backgroundColor: `hsl(${colors.secondary})`,
                color: `hsl(${colors.secondaryForeground})`,
              }}
            >
              Secondary
            </button>
            <button
              className="inline-flex h-9 items-center justify-center rounded-md px-4 py-2 text-sm font-medium transition-colors"
              style={{
                backgroundColor: `hsl(${colors.destructive})`,
                color: `hsl(${colors.destructiveForeground})`,
              }}
            >
              Destructive
            </button>
          </div>
          <div
            className="rounded-md p-3"
            style={{ backgroundColor: `hsl(${colors.muted})` }}
          >
            <p
              className="text-sm"
              style={{ color: `hsl(${colors.mutedForeground})` }}
            >
              This is muted content area
            </p>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}

export function ThemePreview({ theme }: ThemePreviewProps) {
  const [mode, setMode] = useState<'light' | 'dark'>('light');

  if (!theme) {
    return null;
  }

  const colors = mode === 'light' ? theme.light : theme.dark;

  return (
    <div className="space-y-4">
      <div className="flex justify-end">
        <Button
          variant="outline"
          size="sm"
          onClick={() => setMode(mode === 'light' ? 'dark' : 'light')}
        >
          {mode === 'light' ? (
            <>
              <Moon className="h-4 w-4 mr-2" />
              Dark Mode
            </>
          ) : (
            <>
              <Sun className="h-4 w-4 mr-2" />
              Light Mode
            </>
          )}
        </Button>
      </div>

      <PreviewCard colors={colors} />
    </div>
  );
}
