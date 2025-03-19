import PropTypes from 'prop-types';

const Card = ({ children, className = "", onClick }) => {
  return (
    <div 
      className={`bg-white rounded-lg border border-gray-200 shadow-sm ${className}`}
      onClick={onClick}
    >
      {children}
    </div>
  );
};

Card.propTypes = {
  children: PropTypes.node.isRequired,
  className: PropTypes.string,
  onClick: PropTypes.func
};

export default Card;