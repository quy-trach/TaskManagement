import React, { useState, useEffect } from 'react';
import { useAuth } from '../../context/AuthContext';
import axiosInstance from '../../api/axiosConfig';
import Breadcrumb from '../../components/Breadcrumb';
import LayoutMain from '../../layouts/LayoutMain';
import { useNavigate } from 'react-router-dom';

const Dashboard = () => {
    const navigate = useNavigate();
    const { isAuthenticated, logout } = useAuth();
    const [recentTasks, setRecentTasks] = useState([]);
    const [notifications, setNotifications] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);
    const [summaryData, setSummaryData] = useState({
        TotalTasks: 0,
        InProgressTasks: 0,
        CompletedTasks: 0,
        OverdueTasks: 0
    });

    useEffect(() => {
        const fetchData = async () => {
            if (!isAuthenticated) {
                setError('Vui lòng đăng nhập để xem dữ liệu');
                setLoading(false);
                return;
            }

            setLoading(true);
            setError(null);

            try {
                const tasksResponse = await axiosInstance.get('/dashboard/recent-tasks');
                if (tasksResponse.data.success || tasksResponse.data.Success) {
                    const data = tasksResponse.data.data || tasksResponse.data.Data || [];
                    setRecentTasks(data);
                } else {
                    const message = tasksResponse.data.message || tasksResponse.data.Message || 'Lỗi khi lấy công việc gần đây';
                    setError(message);
                }

                const notificationsResponse = await axiosInstance.get('/dashboard/upcoming-deadlines');
                if (notificationsResponse.data.success || notificationsResponse.data.Success) {
                    const data = notificationsResponse.data.data || notificationsResponse.data.Data || [];
                    setNotifications(data);
                } else {
                    const message = notificationsResponse.data.message || notificationsResponse.data.Message || 'Lỗi khi lấy thông báo';
                    setError(message);
                }
                const totalSummaryResponse = await axiosInstance.get('/dashboard/total-summary');
                if (totalSummaryResponse.data.success || totalSummaryResponse.data.Success) {
                    const data = totalSummaryResponse.data.data || totalSummaryResponse.data.Data || {};
                    // Map từ lowercase sang PascalCase
                    setSummaryData({
                        TotalTasks: data.totalTasks || 0,
                        InProgressTasks: data.inProgressTasks || 0,
                        CompletedTasks: data.completedTasks || 0,
                        OverdueTasks: data.overdueTasks || 0
                    });
                } else {
                    const message = totalSummaryResponse.data.message || totalSummaryResponse.data.Message || 'Lỗi khi lấy tổng quan';
                    setError(message);
                }
            } catch (err) {
                if (err.response?.status === 401) {
                    setError('Phiên đăng nhập hết hạn. Vui lòng đăng nhập lại.');
                    logout();
                } else {
                    const errorMsg = err.response?.data?.Message || err.message || 'Unknown error';
                    setError('Đã xảy ra lỗi khi tải dữ liệu: ' + errorMsg);
                }
            } finally {
                setLoading(false);
            }
        };

        fetchData();
    }, [isAuthenticated, logout]);

    const handleCreateNewTask = () => {
        navigate('/task-add');
    };

    return (
        <>
            <title>Bảng điều khiển</title>
            <LayoutMain pageTitle="Bảng điều khiển">
                <Breadcrumb />
                <main className="dashboard-content">
                    <div className="container-fluid">
                        {/* Header Section */}
                        <div className="row mb-4">
                            <div className="col-12">
                                <div className="table-container">
                                    <div className="section-header">
                                        <img alt="Logo" src="/assets/img/oneqtech.jpg" />
                                        <p style={{ color: '#666' }}>Quản lý công việc dễ dàng và hiệu quả hơn bao giờ hết.</p>
                                    </div>
                                </div>
                            </div>
                        </div>

                        {/* Loading and Error Messages */}
                        {loading && (
                            <div className="row">
                                <div className="col-12">
                                    <p className="text-center">Đang tải dữ liệu...</p>
                                </div>
                            </div>
                        )}

                        {error && (
                            <div className="row">
                                <div className="col-12">
                                    <div className="alert alert-danger">{error}</div>
                                </div>
                            </div>
                        )}

                        {/* Stats Section */}
                        <div className="row mb-4">
                            <div className="col-xl-3 col-lg-6 col-md-6 col-12 mb-3">
                                <div className="stat-card">
                                    <i className="ri-task-line stat-icon" />
                                    <div>
                                        <div className="stat-number">{summaryData.TotalTasks}</div>
                                        <div className="stat-label">Tổng công việc</div>
                                    </div>
                                </div>
                            </div>
                            <div className="col-xl-3 col-lg-6 col-md-6 col-12 mb-3">
                                <div className="stat-card orange">
                                    <i className="ri-loader-2-line stat-icon" />
                                    <div>
                                        <div className="stat-number">{summaryData.InProgressTasks}</div>
                                        <div className="stat-label">Đang thực hiện</div>
                                    </div>
                                </div>
                            </div>
                            <div className="col-xl-3 col-lg-6 col-md-6 col-12 mb-3">
                                <div className="stat-card green">
                                    <i className="ri-checkbox-circle-line stat-icon" />
                                    <div>
                                        <div className="stat-number">{summaryData.CompletedTasks}</div>
                                        <div className="stat-label">Hoàn thành</div>
                                    </div>
                                </div>
                            </div>
                            <div className="col-xl-3 col-lg-6 col-md-6 col-12 mb-3">
                                <div className="stat-card yellow">
                                    <i className="ri-error-warning-line stat-icon" />
                                    <div>
                                        <div className="stat-number">{summaryData.OverdueTasks}</div>
                                        <div className="stat-label">Quá hạn</div>
                                    </div>
                                </div>
                            </div>
                        </div>

                        {/* Main Content Grid */}
                        <div className="row">
                            {/* Tasks Section */}
                            <div className="col-xl-8 col-lg-7 col-md-12 mb-4">
                                <div className="task-section">
                                    <div className="section-header">
                                        <h3 className="section-title">Công việc gần đây</h3>
                                        <button
                                            className="btn btn-primary"
                                            onClick={handleCreateNewTask}
                                            title="Chuyển đến trang tạo công việc chi tiết"
                                        >
                                            <i className="ri-add-line" /> <span className="d-none d-sm-inline">Tạo mới</span>
                                        </button>
                                    </div>
                                    <div className="task-list">
                                        {recentTasks.length > 0 ? (
                                            recentTasks.map(task => {
                                                const title = task.title || task.Title || 'Không có tiêu đề';
                                                const creatorName = task.creatorName || task.CreatorFullName || 'Không xác định';
                                                const endDate = task.endDate || task.EndDate || 'Không có ngày';
                                                const priority = task.priority || task.Priority || 'Không xác định';
                                                const statusName = task.statusName || task.StatusName || 'Không xác định';

                                                return (
                                                    <div className="task-card" key={task.taskID || task.TaskID || Math.random()}>
                                                        <div className="row align-items-center">
                                                            <div className="col-auto d-none d-md-block">
                                                                <img
                                                                    src={task.creatorAvatar || task.CreatorAvatar || 'man.jpg'}
                                                                    className="avatar"
                                                                    alt={creatorName}
                                                                />
                                                            </div>
                                                            <div className="col">
                                                                <div className="task-title">{title}</div>
                                                                <div className="task-meta d-flex flex-wrap gap-2 mb-2">
                                                                    <span className="d-flex align-items-center">
                                                                        <i className="ri-calendar-line me-1" />
                                                                        <span className="d-none d-sm-inline">{endDate}</span>
                                                                    </span>
                                                                    <span className="creator-badge">
                                                                        Người tạo:
                                                                    </span>
                                                                    <span className="d-flex align-items-center">
                                                                        <i className="ri-user-line me-1" />
                                                                        <span className="d-none d-md-inline">{creatorName}</span>
                                                                    </span>
                                                                    <span className={`priority-${priority ? priority.toLowerCase() : 'unknown'} d-flex align-items-center`}>
                                                                        <i className="ri-flag-line me-1" /> {priority}
                                                                    </span>
                                                                </div>
                                                                {task.assignees && task.assignees.length > 0 && (
                                                                    <div className="assignees-section mb-2">
                                                                        <span className="assignees-label">
                                                                            <i className="ri-team-line" /> Người đảm nhiệm:
                                                                        </span>
                                                                        <div className="assignees-list d-flex flex-wrap gap-2 mt-2">
                                                                            {task.assignees.map(assignee => (
                                                                                <div key={assignee.userID} className="assignee-item d-flex align-items-center">
                                                                                    <img
                                                                                        src={assignee.avatar || 'man.jpg'}
                                                                                        className="assignee-avatar"
                                                                                        alt={assignee.fullName}
                                                                                    />
                                                                                    <span className="assignee-name d-none d-lg-inline">
                                                                                        {assignee.fullName}
                                                                                        {assignee.departmentName && ` (${assignee.departmentName})`}
                                                                                    </span>
                                                                                </div>
                                                                            ))}
                                                                        </div>
                                                                    </div>
                                                                )}
                                                                <span
                                                                    className={`status-badge status-${statusName ? statusName.toLowerCase().replace(' ', '-') : 'unknown'}`}
                                                                >
                                                                    {statusName}
                                                                </span>
                                                            </div>
                                                        </div>
                                                    </div>
                                                );
                                            })
                                        ) : (
                                            <p className="text-center text-muted">Không có công việc gần đây.</p>
                                        )}
                                    </div>
                                </div>
                            </div>

                            {/* Notifications Section */}
                            <div className="col-xl-4 col-lg-5 col-md-12 mb-4">
                                <div className="notification-section">
                                    <div className="section-header">
                                        <h3 className="section-title">Thông báo</h3>
                                    </div>
                                    <div className="task-list">
                                        {notifications.length > 0 ? (
                                            notifications.map(notification => {
                                                const title = notification.Title || notification.title || 'Không có tiêu đề';
                                                const daysLeft = notification.DaysUntilDue ?? notification.daysUntilDue ?? 0;
                                                const task = notification.Task || notification.task || {};

                                                let color, bgColor;
                                                if (daysLeft <= 1) {
                                                    color = '#ff4d4f';
                                                    bgColor = 'rgba(255,77,79,0.1)';
                                                } else if (daysLeft <= 7) {
                                                    color = '#faad14';
                                                    bgColor = 'rgba(250,173,20,0.1)';
                                                } else {
                                                    color = '#52c41a';
                                                    bgColor = 'rgba(82,196,65,0.1)';
                                                }

                                                return (
                                                    <div className="task-card" key={notification.TaskID || notification.id || Math.random()}>
                                                        <div className="notification-content">
                                                            <div className="notification-header mb-3">
                                                                <div className="notification-title mb-2">{title}</div>
                                                                <span
                                                                    className="deadline-badge"
                                                                    style={{
                                                                        color: color,
                                                                        backgroundColor: bgColor
                                                                    }}
                                                                >
                                                                    {daysLeft === 0 ? 'Đến hạn' : `Còn ${daysLeft} ngày`}
                                                                </span>
                                                            </div>
                                                            {task.assignees && task.assignees.length > 0 && (
                                                                <div className="assignees-section">
                                                                    <span className="assignees-label d-block mb-2">
                                                                        <i className="ri-team-line" /> Người đảm nhiệm:
                                                                    </span>
                                                                    <div className="assignees-list">
                                                                        {task.assignees.map(assignee => (
                                                                            <div
                                                                                key={assignee.userID}
                                                                                className="assignee-card d-flex align-items-center mb-2"
                                                                            >
                                                                                <img
                                                                                    src={assignee.avatar || 'man.jpg'}
                                                                                    className="assignee-avatar-lg"
                                                                                    alt={assignee.fullName}
                                                                                />
                                                                                <div className="assignee-info">
                                                                                    <div className="assignee-name">{assignee.fullName}</div>
                                                                                    {assignee.departmentName && (
                                                                                        <div className="assignee-dept">
                                                                                            ({assignee.departmentName})
                                                                                        </div>
                                                                                    )}
                                                                                </div>
                                                                            </div>
                                                                        ))}
                                                                    </div>
                                                                </div>
                                                            )}
                                                        </div>
                                                    </div>
                                                );
                                            })
                                        ) : (
                                            <p className="text-center text-muted">Không có thông báo sắp đến hạn.</p>
                                        )}
                                    </div>

                                    {/* Quick Task Form */}
                                    <div className="quick-task">
                                        <div className="form-group mb-3">
                                            <label className="form-label">Thêm công việc nhanh</label>
                                            <input
                                                type="text"
                                                className="form-control"
                                                placeholder="Nhập tiêu đề công việc..."
                                            />
                                        </div>
                                        <button
                                            className="btn btn-primary w-100"
                                            onClick={handleCreateNewTask}
                                        >
                                            <i className="ri-add-line" /> Thêm ngay
                                        </button>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>
                </main>
            </LayoutMain>
        </>
    );
};

export default Dashboard;