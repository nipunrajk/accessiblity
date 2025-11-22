import { LabelHTMLAttributes, forwardRef } from 'react';

export interface LabelProps extends LabelHTMLAttributes<HTMLLabelElement> {
  className?: string;
}

/**
 * Label Component
 * Reusable label for form inputs
 */
const Label = forwardRef<HTMLLabelElement, LabelProps>(
  ({ className = '', children, ...props }, ref) => {
    return (
      <label
        className={`text-sm font-medium text-gray-900 leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70 ${className}`}
        ref={ref}
        {...props}
      >
        {children}
      </label>
    );
  }
);

Label.displayName = 'Label';

export default Label;
