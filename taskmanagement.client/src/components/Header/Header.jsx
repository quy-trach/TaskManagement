import React, { useState, useEffect, useRef, useContext } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { AuthContext } from '../../context/AuthContext';

const Header = ({ pageTitle, iconClass }) => {
    const navigate = useNavigate();
    const [isDropdownOpen, setIsDropdownOpen] = useState(false);
    const [isNotificationOpen, setIsNotificationOpen] = useState(false);
    const dropdownRef = useRef(null);
    const notificationRef = useRef(null);
    const { user, token, logout } = useContext(AuthContext);
    const [notificationCount, setNotificationCount] = useState(5);

    // Xử lý đăng xuất
    const handleLogout = async () => {
        try {
            await logout();
            navigate('/sign-in'); // Chuyển hướng về trang đăng nhập
        } catch (error) {
            console.error('Error during logout:', error);
        }
    };
    // Đóng dropdown khi click ra ngoài


    useEffect(() => {
        const handleClickOutside = (event) => {
            if (dropdownRef.current && !dropdownRef.current.contains(event.target)) {
                setIsDropdownOpen(false);
            }
            if (notificationRef.current && !notificationRef.current.contains(event.target)) {
                setIsNotificationOpen(false);
            }
        };
        document.addEventListener('mousedown', handleClickOutside);
        return () => document.removeEventListener('mousedown', handleClickOutside);
    }, []);

    const avatarSrc = user?.avatar || '/man.jpg';

    const getDisplayToken = () => {
        if (!token) return 'No token';
        try {
            const tokenStr = String(token);
            return tokenStr.length > 20 ? `${tokenStr.substring(0, 20)}...` : tokenStr;
        } catch (error) {
            console.error('Error processing token for display:', error);
            return 'Invalid token';
        }
    };

    const displayToken = getDisplayToken();

    return (
        <header className="header">
            <h1>
                <i className={iconClass || 'ri-dashboard-line'}></i> {pageTitle || 'Dashboard'}
            </h1>
            {user && (
                <div className="header-right-section">
                    <div className="notification-wrapper" ref={notificationRef}>
                        <a
                            href="#"
                            className="notification-icon-wrapper"
                            onClick={(e) => {
                                e.preventDefault();
                                setIsNotificationOpen(!isNotificationOpen);
                            }}
                        >
                            <i className="ri-notification-3-line"></i>
                            {notificationCount > 0 && (
                                <span className="notification-badge">{notificationCount}</span>
                            )}
                        </a>
                        <div className={`dropdown-menu notification-dropdown ${isNotificationOpen ? 'show' : ''}`}>
                            <div className="notification-header">
                                <h6>Thông báo</h6>
                                <a href="#" className="mark-as-read">Đánh dấu đã đọc</a>
                            </div>
                            <ul className="notification-list">
                                <li className="notification-item unread">
                                    <div className="notification-avatar">
                                        <img src="/man.jpg" alt="User" />
                                    </div>
                                    <div className="notification-content">
                                        <p>
                                            <strong>Nguyễn Văn A</strong> đã giao cho bạn một công việc mới:
                                            <span className="task-name"> "Thiết kế giao diện trang chủ"</span>.
                                        </p>
                                        <span className="notification-time">
                                            <i className="ri-time-line"></i> 5 phút trước
                                        </span>
                                    </div>
                                </li>
                                <li className="notification-item">
                                    <div className="notification-avatar">
                                        <img src="/woman.jpg" alt="User" />
                                    </div>
                                    <div className="notification-content">
                                        <p>
                                            <strong>Trần Thị B</strong> đã bình luận về công việc
                                            <span className="task-name"> "Fix bug login"</span>.
                                        </p>
                                        <span className="notification-time">
                                            <i className="ri-time-line"></i> 1 giờ trước
                                        </span>
                                    </div>
                                </li>
                            </ul>
                            <div className="notification-footer">
                                <a href="#">Xem tất cả thông báo</a>
                            </div>
                        </div>
                    </div>

                    <div className="dropdown user-info" ref={dropdownRef}>
                        <a
                            href="#"
                            className="d-flex align-items-center text-decoration-none dropdown-toggle"
                            id="userDropdown"
                            onClick={(e) => {
                                e.preventDefault();
                                setIsDropdownOpen(!isDropdownOpen);
                            }}
                            aria-expanded={isDropdownOpen}
                        >
                            <img
                                src={avatarSrc}
                                className="avatar"
                                alt={user.fullName || 'User'}
                                onError={(e) => {
                                    e.target.onerror = null;
                                    e.target.src = '/man.jpg';
                                }}
                            />
                            <span className="ms-2">{user.fullName || 'User'}</span>
                        </a>
                        <ul
                            className={`dropdown-menu dropdown-menu-end ${isDropdownOpen ? 'show' : ''}`}
                            aria-labelledby="userDropdown"
                        >
                            <li>
                                <Link className="dropdown-item" to={`/staff-view/${user.userId}`}>
                                    <i className="ri-user-line"></i> Thông tin cá nhân
                                </Link>
                            </li>
                            <li>
                                <Link className="dropdown-item" to={`/staff-edit/${user.userId}`}>
                                    <i className="ri-lock-password-line"></i> Đổi mật khẩu
                                </Link>
                            </li>
                            <li>
                                <hr className="dropdown-divider" />
                            </li>
                            <li>
                                <button
                                    className="dropdown-item text-danger"
                                    onClick={handleLogout}
                                    type="button"
                                >
                                    <i className="ri-logout-box-line"></i> Đăng xuất
                                </button>
                            </li>
                            {process.env.NODE_ENV === 'development' && (
                                <li>
                                    <div className="dropdown-item text-muted small">
                                        Token: {displayToken}
                                    </div>
                                </li>
                            )}
                        </ul>
                    </div>
                </div>
            )}
        </header>
    );
};

export default Header;
