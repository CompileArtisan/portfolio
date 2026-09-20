const SANITY_PROJECT_ID = "hob493ap";
const SANITY_DATASET = "production";
const SITE_URL = "https://portfolio.compileartisan.dev";

export default {
  async fetch(request, env) {
    const url = new URL(request.url);

    // Only inject tags into the actual HTML page
    if (url.pathname === "/" || url.pathname === "/index.html") {
      const response = await env.ASSETS.fetch(request);
      let html = await response.text();

      let ogImageUrl = null;
      try {
        const query = encodeURIComponent(
          `*[_type == "siteSettings"][0]{ "ogImage": ogImage.asset->url }`
        );
        const res = await fetch(
          `https://${SANITY_PROJECT_ID}.apicdn.sanity.io/v2024-01-01/data/query/${SANITY_DATASET}?query=${query}`
        );
        const data = await res.json();
        ogImageUrl = data.result?.ogImage || null;
      } catch (e) {
        // fall back to no image tag rather than breaking the page
      }

      if (ogImageUrl) {
        const tags = `
    <meta property="og:image" content="${ogImageUrl}">
    <meta property="og:url" content="${SITE_URL}">
    <meta name="twitter:card" content="summary_large_image">
    <meta name="twitter:image" content="${ogImageUrl}">
`;
        html = html.replace("</head>", `${tags}</head>`);
      }

      return new Response(html, { headers: response.headers });
    }

    return env.ASSETS.fetch(request);
  },
};
