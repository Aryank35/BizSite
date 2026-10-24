/** Header set by proxy.ts when a request arrived on a tenant subdomain. */
export const SUBDOMAIN_HEADER = "x-bizsite-subdomain";

/** Canonical public URL of a business website (subdomain when configured, otherwise /site/<slug>). */
export function publicSiteUrl(slug: string, path = ""): string {
  const appUrl = (process.env.APP_URL ?? "http://localhost:3000").replace(/\/$/, "");
  const rootDomain = process.env.TENANT_ROOT_DOMAIN;
  if (rootDomain) {
    const protocol = new URL(appUrl).protocol;
    return `${protocol}//${slug}.${rootDomain}${path}`;
  }
  return `${appUrl}/site/${slug}${path}`;
}
