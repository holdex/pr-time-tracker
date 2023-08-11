import { writable } from 'svelte/store';

import type { SnackbarType } from '../types';

export const snackbar = writable<{ open?: boolean; text?: string; type?: SnackbarType }>({
  open: false,
  text: "You've successfully submitted #372.",
  type: 'success'
});
