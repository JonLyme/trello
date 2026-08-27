import { cn } from '@/utils/cn';
import type { ComponentProps } from 'react';
import {
  Button,
  type ButtonProps,
  Header,
  Menu,
  MenuItem,
  type MenuItemProps,
  MenuSection,
  type MenuSectionProps,
  MenuTrigger,
  type MenuTriggerProps,
  Popover,
  type PopoverProps,
  Separator,
} from 'react-aria-components';

export function DropdownMenu(props: MenuTriggerProps) {
  return <MenuTrigger {...props} />;
}

export function DropdownMenuTrigger({ className, ...props }: ButtonProps) {
  return <Button className={cn('outline-none', className)} {...props} />;
}

type DropdownContentProps = PopoverProps;

export function DropdownMenuContent({
  children,
  className,
  ...props
}: DropdownContentProps) {
  return (
    <Popover
      {...props}
      className={({ isEntering, isExiting }) =>
        cn(
          'z-50 min-w-40 overflow-hidden rounded-xl border border-base-100 bg-dropdown-background/80 backdrop-blur-md shadow-lg outline-none transition-all duration-200 ease-out',
          isEntering && 'animate-in',
          isExiting && 'animate-out',
          className,
        )
      }
    >
      <Menu className="p-1 outline-none">{children}</Menu>
    </Popover>
  );
}

type DropdownMenuItemProps = MenuItemProps;

export function DropdownMenuItem({
  className,
  ...props
}: DropdownMenuItemProps) {
  return (
    <MenuItem
      {...props}
      className={({ isFocused }) =>
        cn(
          'group flex w-full cursor-pointer items-center gap-3 rounded-lg px-3 py-2 text-sm text-text-50 outline-none transition-colors duration-150',
          isFocused && 'bg-dropdown-hover-background text-title-50',
          className,
        )
      }
    />
  );
}

export function DropdownMenuSection<T extends object>({
  className,
  ...props
}: MenuSectionProps<T>) {
  return <MenuSection {...props} className={cn('p-1', className)} />;
}

export function DropdownMenuHeader({
  className,
  ...props
}: ComponentProps<typeof Header>) {
  return (
    <Header
      {...props}
      className={cn(
        'text-text-100 px-3 py-2 text-[11px] font-bold tracking-wider uppercase',
        className,
      )}
    />
  );
}

export function DropdownMenuSeparator({
  className,
  ...props
}: ComponentProps<'hr'>) {
  return (
    <Separator
      className={cn('my-1 h-px border-none bg-base-100', className)}
      {...props}
    />
  );
}
