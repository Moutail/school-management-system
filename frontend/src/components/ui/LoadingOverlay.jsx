// src/components/ui/LoadingOverlay.jsx
import PropTypes from 'prop-types';

const LoadingOverlay = ({ show = false, text = 'Chargement...' }) => {
  if (!show) return null;
  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white p-6 rounded-lg shadow-xl">
        <div className="animate-spin rounded-full h-10 w-10 border-b-2 border-blue-500 mx-auto mb-4"></div>
        <p className="text-center text-gray-700">{text}</p>
      </div>
    </div>
  );
};

LoadingOverlay.propTypes = {
  show: PropTypes.bool,
  text: PropTypes.string
};

export default LoadingOverlay;