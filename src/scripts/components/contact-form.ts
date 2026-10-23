/**
 * Contact form: sends the message to the endpoint in PUBLIC_CONTACT_ENDPOINT
 * (any service that accepts a multipart POST and answers JSON, e.g. Formspree).
 * Until one is set, messages go through FormSubmit to the agency inbox.
 * With an empty endpoint it falls back to opening the visitor's mail app.
 * The submit button shows a spinner while sending, then "Thank you!" or "Error!".
 */
import { setVariant } from '../lib/motion';

// temporary default: FormSubmit forwards to this address (it asks the inbox to confirm once)
const ENDPOINT: string = import.meta.env.PUBLIC_CONTACT_ENDPOINT ?? 'https://formsubmit.co/ajax/magiapixx@gmail.com';
const LOOKS = { default: 'v-ts31mo', loading: 'v-kqxjfx', success: 'v-12oxvwd', error: 'v-7tr97' };
const ACCENT = 'var(--color-accent, rgb(0, 255, 161))';

export function initContactForms() {
  for (const form of document.querySelectorAll<HTMLFormElement>('form.m-vil12t')) {
    // placeholder styling while a field is empty
    for (const input of form.querySelectorAll<HTMLInputElement>('input.form-input')) {
      input.addEventListener('input', () => input.classList.toggle('form-input-empty', !input.value));
    }
    const button = form.querySelector<HTMLButtonElement>('button.m-sdRQw');
    if (!button) continue;
    button.dataset.state = 'default';
    const label = button.querySelector<HTMLElement>('.m-cf4z8f');
    const text = label?.querySelector('p');
    const spinner = button.querySelector<HTMLElement>('.m-1jx21u2');
    let spin: Animation | undefined;

    const show = (state: keyof typeof LOOKS, message?: string) => {
      button.dataset.state = state;
      setVariant(button, LOOKS, state);
      button.querySelector('.m-bGO9v')?.classList.remove('hover');
      if (message && text) text.textContent = message;
      if (message) label?.style.setProperty('--prop-GffgxLMr6', ACCENT);
      spin?.cancel();
      if (state === 'loading' && spinner) {
        spin = spinner.animate([{ transform: 'rotate(0deg)' }, { transform: 'rotate(-360deg)' }], {
          duration: 1500,
          easing: 'cubic-bezier(0.54, 0, 0.48, 0.98)',
          iterations: Infinity,
        });
      }
    };

    form.addEventListener('submit', async (e) => {
      e.preventDefault();
      if (button.dataset.state === 'loading') return;
      const data = new FormData(form);
      if (!ENDPOINT) {
        const to = document.querySelector<HTMLAnchorElement>('a[href^="mailto:"]')?.href.slice(7) ?? '';
        const body = [...data].map(([k, v]) => `${k}: ${v}`).join('\n');
        location.href = `mailto:${to}?subject=${encodeURIComponent('New project enquiry')}&body=${encodeURIComponent(body)}`;
        show('success', 'Thank you!');
        return;
      }
      show('loading');
      try {
        const res = await fetch(ENDPOINT, { method: 'POST', body: data, headers: { Accept: 'application/json' } });
        if (!res.ok) throw new Error(String(res.status));
        // FormSubmit answers 200 with { success: "false" } when it rejects a message
        const json = await res.json().catch(() => ({}));
        if (json.success === false || json.success === 'false') throw new Error(json.message);
        form.reset();
        show('success', 'Thank you!');
      } catch {
        show('error', 'Error!');
      }
    });
  }
}
