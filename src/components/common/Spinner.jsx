import PropTypes from 'prop-types';

/**
 * Spinner Component
 * Reusable loading spinner
 */
function Spinner({ size = 'md', className = '', color = 'black' }) {
  const sizeClasses = {
    sm: 'h-4 w-4 border-2',
    md: 'h-8 w-8 border-2',
    lg: 'h-12 w-12 border-2',
    xl: 'h-16 w-16 border-4',
  };

  const colorClasses = {
    black: 'border-black dark:border-white',
    white: 'border-white',
    gray: 'border-gray-500',
    primary: 'border-black dark:border-white',
  };

  return (
    <div
      className={`animate-spin rounded-full border-t-transparent ${sizeClasses[size]} ${colorClasses[color]} ${className}`}
      role='status'
      aria-label='Loading'
    >
      <span className='sr-only'>Loading...</span>
    </div>
  );
}

Spinner.propTypes = {
  size: PropTypes.oneOf(['sm', 'md', 'lg', 'xl']),
  className: PropTypes.string,
  color: PropTypes.oneOf(['black', 'white', 'gray', 'primary']),
};

export default Spinner;
