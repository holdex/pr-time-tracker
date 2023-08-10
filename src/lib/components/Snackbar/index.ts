import { writable } from 'svelte/store';

import type { SnackbarStatus } from '../types';

export const snackbar = writable<{ open?: boolean; text?: string; status?: SnackbarStatus }>({
  open: false,
  text: "You've successfully submitted #372.",
  status: 'successful'
});
