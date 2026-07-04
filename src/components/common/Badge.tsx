import { HTMLAttributes, ReactNode, forwardRef } from 'react';
import { Badge as RadixBadge } from '@radix-ui/themes';

export interface BadgeProps extends Omit<HTMLAttributes<HTMLSpanElement>, 'color'> {
  children: ReactNode;
  variant?:
    | 'default'
    | 'primary'
    | 'success'
    | 'warning'
    | 'danger'
    | 'info'
    | 'outline';
  size?: 'sm' | 'md' | 'lg';
  className?: string;
}

/**
 * Badge Component
 * Reusable badge for labels, tags, and status indicators
 */
const Badge = forwardRef<HTMLSpanElement, BadgeProps>(
  (
    { children, variant = 'default', size = 'md', className = '', ...props },
    ref
  ) => {
    let radixColor: 'gray' | 'teal' | 'green' | 'yellow' | 'red' | 'blue' = 'gray';
    let radixVariant: 'soft' | 'solid' | 'outline' = 'soft';

    if (variant === 'default') { radixColor = 'gray'; radixVariant = 'soft'; }
    else if (variant === 'primary') { radixColor = 'teal'; radixVariant = 'solid'; }
    else if (variant === 'success') { radixColor = 'green'; radixVariant = 'soft'; }
    else if (variant === 'warning') { radixColor = 'yellow'; radixVariant = 'soft'; }
    else if (variant === 'danger') { radixColor = 'red'; radixVariant = 'soft'; }
    else if (variant === 'info') { radixColor = 'blue'; radixVariant = 'soft'; }
    else if (variant === 'outline') { radixColor = 'gray'; radixVariant = 'outline'; }

    const radixSize = size === 'sm' ? '1' : size === 'lg' ? '3' : '2';

    return (
      <RadixBadge
        color={radixColor}
        variant={radixVariant}
        size={radixSize}
        className={className}
        ref={ref}
        {...props}
      >
        {children}
      </RadixBadge>
    );
  }
);

Badge.displayName = 'Badge';

export default Badge;
