import { InputHTMLAttributes, forwardRef } from 'react';

export interface InputProps extends InputHTMLAttributes<HTMLInputElement> {
  className?: string;
}

/**
 * Input Component
 * Reusable input field with consistent styling
 */
const Input = forwardRef<HTMLInputElement, InputProps>(
  ({ className = '', type = 'text', ...props }, ref) => {
    return (
      <input
        type={type}
        className={`flex h-11 w-full rounded-lg border border-gray-200 bg-white px-3 py-2 text-base text-gray-900 placeholder:text-gray-500 focus:outline-hidden focus:ring-2 focus:ring-blue-600 focus:border-transparent disabled:cursor-not-allowed disabled:opacity-50 transition-colors ${className}`}
        ref={ref}
        {...props}
      />
    );
  }
);

Input.displayName = 'Input';

export default Input;
