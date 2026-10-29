/**
 * Page zoom set by the head script in BaseLayout (html { zoom }): on desktop screens smaller than the
 * design size the whole page is scaled down. Under zoom, getBoundingClientRect(), innerWidth/innerHeight
 * and pointer coordinates are in screen px, while inline styles, offset* and client* are in CSS px.
 * Divide screen px by this before writing them into a style.
 */
export const pageZoom = () => parseFloat(getComputedStyle(document.documentElement).zoom) || 1;
