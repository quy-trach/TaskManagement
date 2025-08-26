import PropTypes from 'prop-types';


const LayoutBasic = ({ children }) => {
    return (
        <div className="login-container">

            {/* PAGE-WRAPPER */}
            {children}
        </div>
    );
};

LayoutBasic.propTypes = {
    children: PropTypes.node.isRequired,
};

export default LayoutBasic;
