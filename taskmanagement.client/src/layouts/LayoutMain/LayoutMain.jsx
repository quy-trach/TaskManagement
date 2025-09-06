import PropTypes from 'prop-types';
import Header from '../../components/Header';
import Nav from '../../components/Nav';
import Scripts from '../../components/Scripts';

const LayoutMain = ({ children, pageTitle }) => {
    // Thiết lập icon map cho từng page linh động.
    const iconMap = {
        'Danh sách công việc': 'ri-file-list-3-line',
        'Dashboard': 'ri-dashboard-line',
        'Danh sách dự án': 'ri-list-check-3',
        'Thêm dự án': 'ri-add-line', 
        'Chi tiết dự án': 'ri-file-list-3-line',
        'Chỉnh sửa dự án': 'ri-edit-line',

        //Quản lý nhân viên
        'Quản lý nhân viên': 'ri-user-line',
        'Hồ sơ của bạn': 'ri-profile-line', 
        'Chi tiết nhân viên': 'ri-profile-line', 
        'Thêm nhân viên': 'ri-user-add-line', 
        'Chỉnh sửa nhân viên': 'ri-user-settings-line',

        //Quản lý công việc
        'Quản lý công việc': 'ri-task-line',
        'Chỉnh sửa công việc': 'ri-edit-line',
        'Thêm công việc': 'ri-add-line',     
        'Chi tiết công việc': 'ri-file-list-3-line' ,


        'Phản hồi & Báo cáo': 'ri-chat-1-line',
        'Cài đặt': 'ri-settings-2-line',
    };

    const iconClass = iconMap[pageTitle] || 'ri-dashboard-line';

    return (
        <div className="app-container">
           
            {/*Nav*/}
            <Nav />
            {/*Header*/}
            <Header pageTitle={pageTitle} iconClass={iconClass} />

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
