import { NavLink } from 'react-router-dom';

const Nav = () => {
    return (
        <aside className="sidebar" id="sidebar">
            <div className="logo-main">
                <img src="assets/img/team.png" alt="Logo" />
            </div>
            <nav>
                <ul className="nav-menu">
                    <li className="nav-item">
                        <NavLink to="/dashboard" className="nav-link" activeClassName="active">
                            <i className="ri-dashboard-line"></i>
                            <span>Dashboard</span>
                        </NavLink>
                    </li>
                    <li className="nav-item">
                        <NavLink to="/project-list" className="nav-link" activeClassName="active">
                            <i class="ri-list-check-3"></i>
                            <span>Quản lý dự án</span>
                        </NavLink>
                    </li>
                    <li className="nav-item">
                        <NavLink to="/task-list" className="nav-link" activeClassName="active">
                            <i className="ri-task-line"></i>
                            <span>Quản lý công việc</span>
                        </NavLink>
                    </li>
                    <li className="nav-item">
                        <NavLink to="/staff-list" className="nav-link" activeClassName="active">
                            <i className="ri-user-line"></i>
                            <span>Quản lý nhân viên</span>
                        </NavLink>
                    </li>
                    <li className="nav-item">
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
                    <li className="nav-item">
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