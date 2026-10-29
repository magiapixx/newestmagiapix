/**
 * Navigation bar: hamburger opens the full-screen menu, and the bar switches to its
 * dark look while a light section sits under it (sections are marked with
 * `data-nav-theme="dark"` / `"light"`). The menu fades in and out with the bar's tween; on opening its links
 * scramble in, and hovering a link shows its picture.
 */
import { reducedMotion, transitionState, type Transition } from '../lib/motion';
import { hoverClass } from '../lib/hover';
import { scramble } from './scramble';

// Each breakpoint has its own set of looks. The bar carries one per breakpoint as a responsive class
// (`rv-<bp>-<look>`, lib/rv) or, unprefixed, a single look.
const LOOKS: Record<string, { open: string; dark: string; darkOpen: string }> = {
  'v-ykxwx9': { open: 'v-5saxcr', dark: 'v-10ycspi', darkOpen: 'v-1h3wqfx' }, // desktop
  'v-224r0t': { open: 'v-1gzagu0', dark: 'v-1kjzjgh', darkOpen: 'v-6l4m8f' }, // tablet
  'v-1sbst1b': { open: 'v-25w2vf', dark: 'v-12vjq9m', darkOpen: 'v-zg9u1' }, // phone
};
const BURGER = { normal: 'v-12arz0', close: 'v-jkb23n', normalDark: 'v-1fh2vaw', closeDark: 'v-8dglob' };
const TWEEN: Transition = { type: 'tween', duration: 0.7, ease: [0.4, -0.03, 0.16, 1] };
const HOVER: Transition = { type: 'spring', duration: 0.4, bounce: 0.2 };
const WHITE = 'var(--color-white, rgb(255, 255, 255))';
const BLACK = 'var(--color-black, rgb(0, 0, 0))';

type Slot = { prefix: string; base: string };
type Nav = { el: HTMLElement; slots: Slot[] };

export function initNav() {
  const navs: Nav[] = [...document.querySelectorAll<HTMLElement>('.m-dG6qZ')].flatMap((el) => {
    const slots = [...el.classList].flatMap((c) => {
      const m = c.match(/^(rv-[a-z]+-)?(v-[a-z0-9]+)$/);
      return m && LOOKS[m[2]] ? [{ prefix: m[1] ?? '', base: m[2] }] : [];
    });
    return slots.length ? [{ el, slots }] : [];
  });
  if (!navs.length) return;
  let open = false;
  let dark = false;

  const render = (animated: boolean) => {
    for (const { el, slots } of navs) {
      const apply = () => {
        for (const { prefix, base } of slots) {
          const look = LOOKS[base];
          const next = open ? (dark ? look.darkOpen : look.open) : dark ? look.dark : base;
          el.classList.remove(...[base, look.open, look.dark, look.darkOpen].map((c) => prefix + c));
          el.classList.add(prefix + next);
        }
        const burger = el.querySelector<HTMLElement>('.m-u7pBX');
        if (burger) {
          burger.classList.remove(...Object.values(BURGER));
          burger.classList.add(open ? BURGER.close : dark ? BURGER.normalDark : BURGER.normal);
        }
        const menu = el.querySelector<HTMLElement>('.m-v1sei0');
        if (menu) {
          menu.style.opacity = open ? '1' : '0';
          // the closed panel still covers the screen: let clicks and focus through it
          menu.style.pointerEvents = open ? 'auto' : 'none';
          menu.inert = !open;
        }
        for (const label of el.querySelectorAll<HTMLElement>('.m-GMBhV .m-6in8ye')) label.style.setProperty('--prop-dDeNEndC5', dark && !open ? BLACK : WHITE);
      };
      if (animated && el.getClientRects().length) transitionState(el, apply, TWEEN);
      else apply();
    }
  };

  for (const { el } of navs) {
    const burger = el.querySelector<HTMLElement>('.m-u7pBX');
    if (!burger) continue;
    burger.style.cursor = 'pointer';
    burger.addEventListener('click', () => {
      open = !open;
      render(true);
      if (open && !reducedMotion()) for (const link of el.querySelectorAll<HTMLElement>('.nm-link')) scramble(link);
    });
    hoverClass(burger, HOVER);
  }

  // menu pictures: the hovered (or focused) link's picture shows, the others hide
  for (const { el } of navs) {
    const pics = [...el.querySelectorAll<HTMLElement>('.nm-pic')];
    const show = (index?: string) => pics.forEach((p) => p.classList.toggle('is-shown', p.dataset.index === index));
    for (const link of el.querySelectorAll<HTMLElement>('.nm-link')) {
      link.addEventListener('mouseenter', () => show(link.dataset.index));
      link.addEventListener('focus', () => show(link.dataset.index));
      link.addEventListener('mouseleave', () => show());
      link.addEventListener('blur', () => show());
    }
  }

  // dark while the top of the viewport is between the first "dark" section and the next "light" one
  const sections = [...document.querySelectorAll<HTMLElement>('[data-nav-theme]')];
  const pageTop = (el: HTMLElement) => el.getBoundingClientRect().top + window.scrollY;
  const update = () => {
    const y = window.scrollY;
    let theme: string | undefined;
    for (const s of sections.filter((s) => s.getClientRects().length).sort((a, b) => pageTop(a) - pageTop(b))) {
      if (pageTop(s) - 1 <= y) theme = s.dataset.navTheme;
    }
    const nextDark = theme === 'dark';
    if (nextDark !== dark) {
      dark = nextDark;
      render(true);
    }
  };
  window.addEventListener('scroll', update, { passive: true });
  window.addEventListener('resize', update);
  update();
}
