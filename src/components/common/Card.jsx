import PropTypes from 'prop-types';
import { Card as RadixCard } from '@radix-ui/themes';

/**
 * Card Component
 * Reusable card container with consistent styling
 */
function Card({
  children,
  className = '',
  rounded = 'rounded-xl',
  shadow = true,
}) {
  const shadowClass = shadow ? 'shadow-lg' : '';

  return (
    <RadixCard
      variant="surface"
      className={`${rounded} ${shadowClass} ${className}`}
    >
      {children}
    </RadixCard>
  );
}

Card.propTypes = {
  children: PropTypes.node.isRequired,
  className: PropTypes.string,
  rounded: PropTypes.string,
  shadow: PropTypes.bool,
};

export default Card;
