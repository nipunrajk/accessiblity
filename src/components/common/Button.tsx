import { ButtonHTMLAttributes, forwardRef, ReactNode } from 'react';
import { Button as RadixButton } from '@radix-ui/themes';

export interface ButtonProps extends Omit<ButtonHTMLAttributes<HTMLButtonElement>, 'color'> {
  children: ReactNode;
  variant?: 'primary' | 'secondary' | 'outline' | 'danger' | 'success';
  size?: 'sm' | 'md' | 'lg';
  fullWidth?: boolean;
  className?: string;
}

/**
 * Button Component
 * Reusable button with consistent styling and variants
 */
const Button = forwardRef<HTMLButtonElement, ButtonProps>(
  (
    {
      children,
      variant = 'primary',
      size = 'md',
      disabled = false,
      type = 'button',
      className = '',
      fullWidth = false,
      ...props
    },
    ref
  ) => {
    const widthClass = fullWidth ? 'w-full' : '';

    let radixColor: 'teal' | 'gray' | 'red' | 'green' = 'teal';
    let radixVariant: 'solid' | 'surface' | 'outline' = 'solid';

    if (variant === 'primary') {
      radixColor = 'teal';
      radixVariant = 'solid';
    } else if (variant === 'secondary') {
      radixColor = 'gray';
      radixVariant = 'surface';
    } else if (variant === 'outline') {
      radixColor = 'gray';
      radixVariant = 'outline';
    } else if (variant === 'danger') {
      radixColor = 'red';
      radixVariant = 'solid';
    } else if (variant === 'success') {
      radixColor = 'green';
      radixVariant = 'solid';
    }

    const radixSize = size === 'sm' ? '1' : size === 'lg' ? '3' : '2';

    return (
      <RadixButton
        type={type}
        disabled={disabled}
        color={radixColor}
        variant={radixVariant}
        size={radixSize}
        className={`${widthClass} ${className}`}
        ref={ref}
        {...props}
      >
        {children}
      </RadixButton>
    );
  }
);

Button.displayName = 'Button';

export default Button;
