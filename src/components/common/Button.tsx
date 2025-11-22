import { ButtonHTMLAttributes, forwardRef, ReactNode } from 'react';

export interface ButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
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
    const baseClasses =
      'font-medium rounded-lg transition-colors focus:outline-hidden focus:ring-2 focus:ring-offset-2 inline-flex items-center justify-center';

    const variantClasses = {
      primary:
        'bg-black dark:bg-white text-white dark:text-black hover:bg-gray-800 dark:hover:bg-gray-200 focus:ring-black dark:focus:ring-white',
      secondary:
        'bg-gray-200 dark:bg-gray-700 text-gray-900 dark:text-white hover:bg-gray-300 dark:hover:bg-gray-600 focus:ring-gray-500',
      outline:
        'border border-gray-300 dark:border-gray-600 text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-800 focus:ring-gray-500',
      danger: 'bg-red-600 text-white hover:bg-red-700 focus:ring-red-500',
      success:
        'bg-green-600 text-white hover:bg-green-700 focus:ring-green-500',
    };

    const sizeClasses = {
      sm: 'px-3 py-1.5 text-sm',
      md: 'px-4 py-2 text-base',
      lg: 'px-6 py-3 text-lg',
    };

    const disabledClasses = disabled
      ? 'opacity-50 cursor-not-allowed'
      : 'cursor-pointer';

    const widthClass = fullWidth ? 'w-full' : '';

    return (
      <button
        type={type}
        disabled={disabled}
        className={`${baseClasses} ${variantClasses[variant]} ${sizeClasses[size]} ${disabledClasses} ${widthClass} ${className}`}
        ref={ref}
        {...props}
      >
        {children}
      </button>
    );
  }
);

Button.displayName = 'Button';

export default Button;
