import PropTypes from 'prop-types';

/**
 * Badge Component
 * Reusable badge for labels, tags, and status indicators
 */
function Badge({ children, variant = 'default', size = 'md', className = '' }) {
  const baseClasses = 'inline-flex items-center font-medium rounded-full';

  const variantClasses = {
    default: 'bg-gray-100 dark:bg-gray-800 text-gray-800 dark:text-gray-200',
    primary: 'bg-black dark:bg-white text-white dark:text-black',
    success:
      'bg-green-100 dark:bg-green-900 text-green-800 dark:text-green-200',
    warning:
      'bg-yellow-100 dark:bg-yellow-900 text-yellow-800 dark:text-yellow-200',
    danger: 'bg-red-100 dark:bg-red-900 text-red-800 dark:text-red-200',
    info: 'bg-blue-100 dark:bg-blue-900 text-blue-800 dark:text-blue-200',
  };

  const sizeClasses = {
    sm: 'px-2 py-0.5 text-xs',
    md: 'px-2.5 py-1 text-sm',
    lg: 'px-3 py-1.5 text-base',
  };

  return (
    <span
      className={`${baseClasses} ${variantClasses[variant]} ${sizeClasses[size]} ${className}`}
    >
      {children}
    </span>
  );
}

Badge.propTypes = {
  children: PropTypes.node.isRequired,
  variant: PropTypes.oneOf([
    'default',
    'primary',
    'success',
    'warning',
    'danger',
    'info',
  ]),
  size: PropTypes.oneOf(['sm', 'md', 'lg']),
  className: PropTypes.string,
};

export default Badge;
