import PropTypes from 'prop-types';

const Button = ({ children, variant = "default", onClick, className = "" }) => {
  const baseStyles = "inline-flex items-center justify-center rounded-md text-sm font-medium transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-50";
  
  const variants = {
    default: "bg-blue-600 text-white hover:bg-blue-700",
    outline: "border border-blue-200 bg-white hover:bg-blue-100 text-blue-600",
    secondary: "bg-blue-100 text-blue-900 hover:bg-blue-200",
    ghost: "hover:bg-gray-100 text-gray-600"
  };

  const variantStyle = variants[variant] || variants.default;

  return (
    <button
      className={`${baseStyles} ${variantStyle} ${className} px-4 py-2`}
      onClick={onClick}
      type="button"
    >
      {children}
    </button>
  );
};

Button.propTypes = {
  children: PropTypes.node.isRequired,
  variant: PropTypes.oneOf(['default', 'outline', 'secondary', 'ghost']),
  onClick: PropTypes.func,
  className: PropTypes.string
};

export default Button;