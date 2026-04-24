export function initializeAnalytics() {
  if (typeof window === "undefined" || typeof document === "undefined") return;

  const endpoint = import.meta.env.VITE_ANALYTICS_ENDPOINT;
  const websiteId = import.meta.env.VITE_ANALYTICS_WEBSITE_ID;

  if (!endpoint || !websiteId) return;

  const normalizedEndpoint = endpoint.replace(/\/+$/, "");
  const scriptSrc = `${normalizedEndpoint}/umami`;
  const existingScript = document.querySelector(
    `script[src="${scriptSrc}"][data-website-id="${websiteId}"]`,
  );

  if (existingScript) return;

  const script = document.createElement("script");
  script.defer = true;
  script.src = scriptSrc;
  script.setAttribute("data-website-id", websiteId);
  document.head.appendChild(script);
}
