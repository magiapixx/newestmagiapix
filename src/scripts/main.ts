import { initSmoothScroll } from './components/smooth-scroll';
import { initIntro } from './components/intro';
import { initReveals } from './components/reveal';
import { initServices } from './components/service';
import { initShowreel } from './components/showreel';
import { initVideos } from './components/video';
import { initPriceCards } from './components/price-card';
import { initCaseCards } from './components/case-card';
import { initNav } from './components/nav';
import { initNavLinks } from './components/nav-link';
import { initScrollVariants } from './components/scroll-variants';

initSmoothScroll();
initIntro();
initNav();
initNavLinks();
initReveals();
initServices();
initScrollVariants();
initShowreel();
initVideos();
initPriceCards();
initCaseCards();

// three.js is only loaded on pages that have WebGL effects
if (document.querySelector('[data-gl]')) import('./webgl').then((m) => m.initWebgl());
