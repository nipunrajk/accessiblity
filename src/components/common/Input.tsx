import { InputHTMLAttributes, forwardRef } from 'react';
import { TextField } from '@radix-ui/themes';

export interface InputProps extends Omit<InputHTMLAttributes<HTMLInputElement>, 'size'> {
  className?: string;
  size?: '1' | '2' | '3';
}

/**
 * Input Component
 * Reusable input field with consistent styling
 */
const Input = forwardRef<HTMLInputElement, InputProps>(
  ({ className = '', type = 'text', size, ...props }, ref) => {
    return (
      <TextField.Root
        type={type}
        size={size}
        className={className}
        ref={ref}
        {...props}
      />
    );
  }
);

Input.displayName = 'Input';

export default Input;
