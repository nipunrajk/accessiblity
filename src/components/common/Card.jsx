import PropTypes from 'prop-types';

/**
 * Card Component
 * Reusable card container with consistent styling
 */
function Card({
  children,
  className = '',
  padding = 'p-6',
  rounded = 'rounded-xl',
  shadow = true,
}) {
  const baseClasses =
    'bg-white dark:bg-dark-surface border border-gray-200 dark:border-dark-border';
  const shadowClass = shadow ? 'shadow-lg' : '';

  return (
    <div
      className={`${baseClasses} ${rounded} ${padding} ${shadowClass} ${className}`}
    >
      {children}
    </div>
  );
}

Card.propTypes = {
  children: PropTypes.node.isRequired,
  className: PropTypes.string,
  padding: PropTypes.string,
  rounded: PropTypes.string,
  shadow: PropTypes.bool,
};

export default Card;
