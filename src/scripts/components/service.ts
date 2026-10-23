/**
 * Service rows: hover highlights the "Expand" control, click expands the row
 * to show its description (and collapses it again).
 */
import { bindAll, type Machine } from '../lib/states';

type S = 'collapsed' | 'hover' | 'expanded' | 'expandedHover' | 'phone' | 'phoneExpanded';
const on: Machine<S>['on'] = {
  collapsed: { enter: 'hover', tap: 'expanded' },
  hover: { leave: 'collapsed', tap: 'expanded' },
  expanded: { enter: 'expandedHover', tap: 'collapsed' },
  expandedHover: { leave: 'expanded', tap: 'collapsed' },
  phone: { tap: 'phoneExpanded' },
  phoneExpanded: { tap: 'phone' },
};
const transition = { type: 'spring', duration: 0.6, bounce: 0 } as const;

export function initServices() {
  bindAll<S>('.m-Fsg4m', {
    classes: { collapsed: 'v-15zdchv', hover: 'v-ltdkso', expanded: 'v-uy9ec9', expandedHover: 'v-1c1daw2', phone: 'v-1gx16xq', phoneExpanded: 'v-41hfpv' },
    on,
    transition,
  });
  // same row with inverted colours
  bindAll<S>('.m-rBPIz', {
    classes: { collapsed: 'v-1ull6da', hover: 'v-kdf71r', expanded: 'v-5qvrrt', expandedHover: 'v-1jtr0nl', phone: 'v-1c178mz', phoneExpanded: 'v-zan9nj' },
    on,
    transition,
  });
}
