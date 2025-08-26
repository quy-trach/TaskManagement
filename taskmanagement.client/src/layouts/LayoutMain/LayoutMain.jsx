import PropTypes from 'prop-types';
import Header from '../../components/Header';
import Nav from '../../components/Nav';
import Scripts from '../../components/Scripts';

const LayoutMain = ({ children, pageTitle }) => {
    return (
        <div className="app-container">
           
            {/*Nav*/}
            <Nav />
            {/*Header*/}
            <Header pageTitle={pageTitle} />

            <div className="main-content">
                {/*PAGE-WRAPPER*/}
                {children}

               
            </div>

            <Scripts />
        </div>
    );
};

LayoutMain.propTypes = {
    children: PropTypes.node.isRequired,
    pageTitle: PropTypes.string 
};

export default LayoutMain;
