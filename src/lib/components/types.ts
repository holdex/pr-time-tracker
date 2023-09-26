import type {
  HTMLAnchorAttributes,
  HTMLAttributes,
  HTMLButtonAttributes,
  SVGAttributes
} from 'svelte/elements';
import type { ItemSchema, SubmissionSchema } from '$lib/@types';

/** Button */
export interface ButtonProps
  extends HTMLButtonAttributes,
    Pick<HTMLAnchorAttributes, 'href' | 'target'> {
  text?: string | number | null;
  size?: 'small' | 'medium' | 'large';
  variant?: 'primary' | 'secondary' | 'solo' | 'icon';
  /** @deprecated - Use `text` instead. */
  label?: string;
  fixedTo?: string;
  /** @deprecated - Use `iconProps` instead. */
  icon?: IconName | undefined;
  iconProps?: IconProps;
  /** Used for control DOM element from outside */
  forwardRef?: HTMLButtonElement | HTMLAnchorElement;
  disabled?: boolean;
  isSubmitBtn?: boolean;
  isLoading?: boolean;
  forwardAction?: any;
  onClick?: (e?: Event) => void;
  getRef?: () => ButtonProps['forwardRef'];
}

/** Icon */
export interface IconProps extends Omit<SVGAttributes<SVGElement>, 'className'> {
  name: IconName;
  isOutlined?: boolean;
  colorInherit?: boolean;
}

export interface IconSourceProps
  extends Omit<IconProps, 'name'>,
    Omit<SVGAttributes<SVGElement>, 'className'> {
  src: { solid?: IconThemeSource } & { default: IconThemeSource };
}

type IconThemeSource = {
  a: { [attribute: string]: string };
} & {
  [tag in AllowedTags]?: Array<{ [attribute: string]: string }>;
};

type AllowedTags = 'path' | 'circle' | 'rect' | 'polygon' | 'polyline' | 'line';

/** Add names of icons you use (or include) here (for stricter typing and intellisense [name suggestions]). */
export type IconName =
  | 'pr-open'
  | 'pr-closed'
  | 'information-circle'
  | 'arrow-path'
  | 'x-circle'
  | 'check-circle'
  | 'github'
  | 'exclamation-triangle'
  | 'hand-thumb-up'
  | 'hand-thumb-down'
  | 'arrow-right-on-rectangle'
  | '';

/** Toggle */
export interface ToggleProps extends HTMLAttributes<HTMLSpanElement> {
  leftButtonProps?: ButtonProps;
  rightButtonProps?: ButtonProps;
  activeButton?: 'left' | 'right' | '';
  isReactionToggle?: boolean;
}

/** Snackbar */
export type SnackbarType = 'success' | 'busy' | 'error' | 'info';

/** Card */
export interface CardProps {
  isReadonly?: boolean;
  isAdmin?: boolean;
  loading?: boolean;
  data: ItemSchema & { number?: number };
  onSubmit?: (
    payload: Partial<SubmissionSchema>,
    number: number,
    isUpdate?: boolean
  ) => (e?: Event | undefined) => Promise<SubmissionSchema | null>;
}
