import PropTypes from 'prop-types';

const HeadingMain = ({ children }) => {
    return children;
};

//Kiểu của children
HeadingMain.propTypes = {
    children: PropTypes.node
};
//Giá trị mặc định của children
HeadingMain.defaultProps = {
    children: ""
};

export default HeadingMain;
