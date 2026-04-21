const DEFAULT_EXTRA_OFFSET = 2;
const MOBILE_SCROLL_CORRECTION = 24;

function getNavbarElement(): HTMLElement | null {
  return document.querySelector<HTMLElement>('[data-site-navbar="true"]');
}

export function getNavbarScrollOffset(extraOffset = DEFAULT_EXTRA_OFFSET): number {
  const navbar = getNavbarElement();
  const navbarHeight = navbar?.getBoundingClientRect().height ?? 0;
  const isMobileViewport =
    typeof window !== "undefined" && window.matchMedia("(max-width: 1023px)").matches;

  return Math.max(
    0,
    Math.round(navbarHeight + extraOffset - (isMobileViewport ? MOBILE_SCROLL_CORRECTION : 0)),
  );
}

export function isInternalHashHref(href?: string): boolean {
  if (!href) return false;
  return href.startsWith("/#") || href.startsWith("#");
}

export function extractHashFromHref(href: string): string {
  if (href.startsWith("/#")) return href.slice(1);
  if (href.startsWith("#")) return href;
  return "";
}

export function scrollToHashTarget(
  hash: string,
  options?: { behavior?: ScrollBehavior; retries?: number },
) {
  if (typeof window === "undefined" || !hash) return false;

  const normalizedHash = hash.startsWith("#") ? hash : `#${hash}`;
  const targetId = normalizedHash.slice(1);
  const target = document.getElementById(targetId);

  if (!target) {
    const retries = options?.retries ?? 0;
    if (retries > 0) {
      window.setTimeout(() => {
        scrollToHashTarget(normalizedHash, {
          behavior: options?.behavior ?? "smooth",
          retries: retries - 1,
        });
      }, 80);
    }
    return false;
  }

  const anchorTarget =
    target.querySelector<HTMLElement>('[data-scroll-anchor="true"]') ??
    target.querySelector<HTMLElement>("h1, h2, h3") ??
    target;

  const top =
    window.scrollY +
    anchorTarget.getBoundingClientRect().top -
    getNavbarScrollOffset();

  window.scrollTo({
    top: Math.max(0, top),
    behavior: options?.behavior ?? "smooth",
  });
  return true;
}
