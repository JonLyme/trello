import { cn } from '@/utils/cn';
import {
  Label as AriaLabel,
  type LabelProps as AriaLabelProps,
} from 'react-aria-components';

export interface LabelProps extends AriaLabelProps {}

export function Label({ className, ...props }: LabelProps) {
  return (
    <AriaLabel
      className={cn('text-text-50 text-sm font-normal', className)}
      {...props}
    />
  );
}
