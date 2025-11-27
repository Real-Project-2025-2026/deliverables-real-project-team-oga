import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const MAPBOX_ACCESS_TOKEN = Deno.env.get('MAPBOX_ACCESS_TOKEN');
    
    if (!MAPBOX_ACCESS_TOKEN) {
      console.error('MAPBOX_ACCESS_TOKEN is not set');
      throw new Error('Mapbox token not configured');
    }

    const { action, url } = await req.json();
    
    // Action: get-token - returns the token for client-side use
    // Note: While this still exposes the token to the client, it keeps it out of
    // the source code and allows for easy rotation via secrets management
    if (action === 'get-token') {
      console.log('Returning Mapbox token');
      return new Response(JSON.stringify({ token: MAPBOX_ACCESS_TOKEN }), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    // Action: proxy - proxies requests to Mapbox API
    if (url) {
      console.log('Proxying request to:', url);

      // Add access token to the URL
      const separator = url.includes('?') ? '&' : '?';
      const proxiedUrl = `${url}${separator}access_token=${MAPBOX_ACCESS_TOKEN}`;

      const response = await fetch(proxiedUrl);
      
      if (!response.ok) {
        console.error('Mapbox API error:', response.status, response.statusText);
        throw new Error(`Mapbox API error: ${response.status}`);
      }

      // Get content type to handle different response types
      const contentType = response.headers.get('content-type') || 'application/octet-stream';
      
      // For binary data (tiles, sprites, fonts), return as ArrayBuffer
      if (contentType.includes('application/x-protobuf') || 
          contentType.includes('image/') ||
          contentType.includes('application/octet-stream')) {
        const arrayBuffer = await response.arrayBuffer();
        return new Response(arrayBuffer, {
          headers: {
            ...corsHeaders,
            'Content-Type': contentType,
          },
        });
      }

      // For JSON responses (styles, etc.)
      const data = await response.json();
      return new Response(JSON.stringify(data), {
        headers: {
          ...corsHeaders,
          'Content-Type': 'application/json',
        },
      });
    }

    throw new Error('Invalid request: specify action or url');

  } catch (error) {
    console.error('Error in mapbox-proxy:', error);
    const errorMessage = error instanceof Error ? error.message : 'Unknown error';
    return new Response(JSON.stringify({ error: errorMessage }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }
});
