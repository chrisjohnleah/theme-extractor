// Cloudflare Pages Function for extracting CSS colors from URLs

interface Env {
  // Add any bindings here if needed
}

export const onRequestGet: PagesFunction<Env> = async (context) => {
  const url = new URL(context.request.url);
  const targetUrl = url.searchParams.get('url');

  // CORS headers
  const corsHeaders = {
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Methods': 'GET, OPTIONS',
    'Access-Control-Allow-Headers': 'Content-Type',
  };

  if (!targetUrl) {
    return new Response(
      JSON.stringify({ error: 'Missing url parameter' }),
      {
        status: 400,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      }
    );
  }

  try {
    // Validate URL
    const parsedUrl = new URL(targetUrl);
    if (!['http:', 'https:'].includes(parsedUrl.protocol)) {
      throw new Error('Invalid URL protocol');
    }

    // Fetch the page
    const response = await fetch(targetUrl, {
      headers: {
        'User-Agent': 'Mozilla/5.0 (compatible; ThemeGrab/1.0)',
        'Accept': 'text/html,text/css,*/*',
      },
    });

    if (!response.ok) {
      throw new Error(`Failed to fetch: ${response.status}`);
    }

    const html = await response.text();

    // Extract inline styles and linked stylesheets
    const cssContent: string[] = [html];

    // Find linked stylesheets
    const stylesheetRegex = /<link[^>]+rel=["']stylesheet["'][^>]+href=["']([^"']+)["']/gi;
    const styleMatches = html.matchAll(stylesheetRegex);

    for (const match of styleMatches) {
      const href = match[1];
      try {
        const cssUrl = new URL(href, targetUrl).toString();
        const cssResponse = await fetch(cssUrl, {
          headers: {
            'User-Agent': 'Mozilla/5.0 (compatible; ThemeGrab/1.0)',
          },
        });
        if (cssResponse.ok) {
          cssContent.push(await cssResponse.text());
        }
      } catch {
        // Skip failed stylesheet fetches
      }
    }

    // Extract colors from all CSS content
    const combinedCSS = cssContent.join('\n');
    const colors: string[] = [];
    const colorPatterns = [
      /#[a-fA-F0-9]{6}\b/g,
      /#[a-fA-F0-9]{3}\b/g,
      /rgba?\(\s*\d+\s*,\s*\d+\s*,\s*\d+\s*(?:,\s*[\d.]+\s*)?\)/gi,
      /hsla?\(\s*[\d.]+\s*,\s*[\d.]+%?\s*,\s*[\d.]+%?\s*(?:,\s*[\d.]+\s*)?\)/gi,
    ];

    for (const pattern of colorPatterns) {
      const matches = combinedCSS.match(pattern);
      if (matches) {
        colors.push(...matches);
      }
    }

    // Deduplicate colors
    const uniqueColors = [...new Set(colors.map(c => c.toLowerCase()))];

    return new Response(
      JSON.stringify({ colors: uniqueColors, css: combinedCSS }),
      {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      }
    );
  } catch (error) {
    return new Response(
      JSON.stringify({
        error: error instanceof Error ? error.message : 'Failed to extract colors',
      }),
      {
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      }
    );
  }
};

export const onRequestOptions: PagesFunction<Env> = async () => {
  return new Response(null, {
    headers: {
      'Access-Control-Allow-Origin': '*',
      'Access-Control-Allow-Methods': 'GET, OPTIONS',
      'Access-Control-Allow-Headers': 'Content-Type',
    },
  });
};
