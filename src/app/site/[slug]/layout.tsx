/**
 * Public business websites render in one pass on the server, without a
 * loading skeleton, so visitors never see a placeholder for the whole page.
 *
 * Missing, unpublished and suspended pages call notFound(). Without Partial
 * Prerendering (e.g. `next dev`) that is a 404 response; in production the
 * static shell has already been sent, so it is a 200 response showing the
 * not-found page with a `noindex` tag. Either way, no unpublished data is sent.
 */
export const instant = false;

export default function BusinessSiteLayout({ children }: LayoutProps<"/site/[slug]">) {
  return children;
}
