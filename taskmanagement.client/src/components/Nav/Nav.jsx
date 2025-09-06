import { NavLink } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import axiosInstance from '../../api/axiosConfig';

const Nav = () => {
    // Thiết lập không cho Nhân viên xem dự án.
    const { user } = useAuth();
    const isDirector = user?.roleName === 'Giám đốc';
    const isStaff = user?.roleName === 'Nhân viên';

    // Xử lý đăng xuất
    const handleLogout = async () => {
        try {
            // Xóa token khi đăng xuất
            localStorage.removeItem('token');

            await axiosInstance.post('/auth/logout');
            // Xóa thông tin người dùng khỏi context hoặc localStorage nếu cần
            window.location.href = '/sign-in'; // Chuyển hướng về trang đăng nhập
        } catch (error) {
            console.error('Error during logout:', error);
        }
    };
    return (
        <aside className="sidebar" id="sidebar">
            <div className="logo-main">
                <img src="/assets/img/oneqtech.jpg" alt="Logo" />
            </div>
            <nav>
                <ul className="nav-menu">
                    <li className="nav-item">
                        <NavLink to="/dashboard" className="nav-link" activeClassName="active">
                            <i className="ri-dashboard-line"></i>
                            <span>Dashboard</span>
                        </NavLink>
                    </li>
                    {/* Hiển thị Quản lý dự án nếu không phải nhân viên */}
                    {isDirector && (
                        <li className="nav-item">
                            <NavLink to="/project-list" className="nav-link" activeClassName="active">
                                <i className="ri-list-check-3"></i>
                                <span>Quản lý dự án</span>
                            </NavLink>
                        </li>
                    )}

                  
                    <li className="nav-item">
                        <NavLink to="/task-list" className="nav-link" activeClassName="active">
                            <i class="ri-file-list-3-line"></i>
                            <span>{isStaff ? "Công việc của bạn" : "Quản lý công việc"}</span>
                        </NavLink>
                    </li>
                  {/*  Hiển thị Quản lý nhân viên nếu không phải nhân viên*/}
                    <li className="nav-item">
                        <NavLink to="/staff-list" className="nav-link" activeClassName="active">
                            <i className="ri-user-line"></i>
                            <span>{isStaff ? "Hồ sơ của bạn" : "Quản lý nhân viên"}</span>
                        </NavLink>
                    </li>
                    <li className="nav-item d-none">
                        <NavLink to="/statistic-list" className="nav-link" activeClassName="active">
                            <i className="ri-bar-chart-grouped-line"></i>
                            <span>Thống kê công việc</span>
                        </NavLink>
                    </li>
                    <li className="nav-item">
                        <NavLink to="/Feedback" className="nav-link" activeClassName="active">
                            <i className="ri-chat-1-line"></i>
                            <span>Phản hồi & Báo cáo</span>
                        </NavLink>
                    </li>
                    <li className="nav-item d-none">
                        <NavLink to="/setting" className="nav-link" activeClassName="active">
                            <i className="ri-settings-2-line"></i>
                            <span>Cài đặt</span>
                        </NavLink>
                    </li>
                    <li className="nav-item">
                        <NavLink to="/sign-in" className="nav-link" activeClassName="active">
                            <i className="ri-logout-box-line"></i>
                            <span>Đăng xuất</span>
                        </NavLink>
                    </li>
                </ul>
            </nav>
        </aside>
    );
};

export default Nav;