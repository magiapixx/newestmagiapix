/**
 * Navigation bar: hamburger opens the side menu, and the bar switches to its
 * dark look while a light section sits under it (sections are marked with
 * `data-nav-theme="dark"` / `"light"`).
 */
import { transitionState, type Transition } from '../lib/motion';
import { hoverClass } from '../lib/hover';

// One navigation copy is rendered per breakpoint; each has its own set of looks.
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

type Nav = { el: HTMLElement; base: string };

export function initNav() {
  const navs: Nav[] = [...document.querySelectorAll<HTMLElement>('.m-dG6qZ')].flatMap((el) => {
    const base = Object.keys(LOOKS).find((v) => el.classList.contains(v));
    return base ? [{ el, base }] : [];
  });
  if (!navs.length) return;
  let open = false;
  let dark = false;

  const render = (animated: boolean) => {
    for (const { el, base } of navs) {
      const look = LOOKS[base];
      const next = open ? (dark ? look.darkOpen : look.open) : dark ? look.dark : base;
      const apply = () => {
        el.classList.remove(base, look.open, look.dark, look.darkOpen);
        el.classList.add(next);
        const burger = el.querySelector<HTMLElement>('.m-u7pBX');
        if (burger) {
          burger.classList.remove(...Object.values(BURGER));
          burger.classList.add(open ? BURGER.close : dark ? BURGER.normalDark : BURGER.normal);
        }
        const menu = el.querySelector<HTMLElement>('.m-v1sei0');
        if (menu) menu.style.opacity = open ? '1' : '0';
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
    });
    hoverClass(burger, HOVER);
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
