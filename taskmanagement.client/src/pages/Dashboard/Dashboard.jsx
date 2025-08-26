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

    useEffect(() => {
        const fetchData = async () => {
            console.log('🔍 Dashboard - Bắt đầu fetch data...');
            console.log('🔍 isAuthenticated:', isAuthenticated);

            if (!isAuthenticated) {
                console.log('❌ Không được xác thực');
                setError('Vui lòng đăng nhập để xem dữ liệu');
                setLoading(false);
                return;
            }

            setLoading(true);
            setError(null);

            try {
                console.log('🔍 Đang gọi API recent-tasks...');
                const tasksResponse = await axiosInstance.get('/dashboard/recent-tasks');
                console.log('✅ Recent Tasks Response:', tasksResponse.data);
                if (tasksResponse.data.success || tasksResponse.data.Success) {
                    const data = tasksResponse.data.data || tasksResponse.data.Data || [];
                    console.log('🔍 Raw Task Data:', JSON.stringify(data, null, 2)); // Nhật ký chi tiết
                    setRecentTasks(data);
                    console.log('✅ Recent tasks set:', data.length, 'items');
                } else {
                    const message = tasksResponse.data.message || tasksResponse.data.Message || 'Lỗi khi lấy công việc gần đây';
                    console.log('❌ Recent tasks error:', message);
                    setError(message);
                }

                console.log('🔍 Đang gọi API upcoming-deadlines...');
                const notificationsResponse = await axiosInstance.get('/dashboard/upcoming-deadlines');
                console.log('📢 Notifications Response:', notificationsResponse.data);
                if (notificationsResponse.data.success || notificationsResponse.data.Success) {
                    const data = notificationsResponse.data.data || notificationsResponse.data.Data || [];
                    console.log('🔍 Raw Notification Data:', JSON.stringify(data, null, 2)); // Nhật ký chi tiết
                    setNotifications(data);
                    console.log('✅ Notifications set:', data.length, 'items');
                } else {
                    const message = notificationsResponse.data.message || notificationsResponse.data.Message || 'Lỗi khi lấy thông báo';
                    console.log('❌ Notifications error:', message);
                    setError(message);
                }

            } catch (err) {
                console.log('🚨 FULL ERROR OBJECT:', err);
                console.log('🚨 Error Response:', err.response);
                console.log('🚨 Error Response Data:', err.response?.data);
                console.log('🚨 Error Status:', err.response?.status);
                console.log('🚨 Error Message:', err.message);

                if (err.response?.status === 401) {
                    console.log('🔑 Token hết hạn, đang logout...');
                    setError('Phiên đăng nhập hết hạn. Vui lòng đăng nhập lại.');
                    logout();
                } else {
                    const errorMsg = err.response?.data?.Message || err.message || 'Unknown error';
                    setError('Đã xảy ra lỗi khi tải dữ liệu: ' + errorMsg);
                }
            } finally {
                setLoading(false);
                console.log('🏁 Fetch data hoàn thành');
            }
        };

        fetchData();
    }, [isAuthenticated, logout]);

    const handleCreateNewTask = () => {
      
        navigate('/task-add'); 
    };
    // Debug render
    console.log('🎨 Dashboard Render State:');
    console.log('- loading:', loading);
    console.log('- error:', error);
    console.log('- recentTasks count:', recentTasks.length);
    console.log('- notifications count:', notifications.length);

    return (
        <>
            <title>Bảng điều khiển</title>
            <LayoutMain>
                <Breadcrumb />
                <main className="dashboard-content">
                    <div id="dashboard-page" className="page">
                        <div className="table-container mb-20">
                            <div className="section-header">
                                <h3 className="section-title">Chào mừng bạn đến với BizManage!</h3>
                                <p style={{ color: '#666' }}>Quản lý công việc dễ dàng và hiệu quả hơn bao giờ hết.</p>
                            </div>
                        </div>

                        {loading && <p>Đang tải dữ liệu...</p>}
                        {error && <p style={{ color: 'red' }}>{error}</p>}

                       

                        <div className="stats-grid">
                            <div className="stat-card">
                                <i className="ri-task-line stat-icon" />
                                <div>
                                    <div className="stat-number">24</div>
                                    <div className="stat-label">Tổng công việc</div>
                                </div>
                            </div>
                            <div className="stat-card orange">
                                <i className="ri-loader-2-line stat-icon" />
                                <div>
                                    <div className="stat-number">8</div>
                                    <div className="stat-label">Đang thực hiện</div>
                                </div>
                            </div>
                            <div className="stat-card green">
                                <i className="ri-checkbox-circle-line stat-icon" />
                                <div>
                                    <div className="stat-number">12</div>
                                    <div className="stat-label">Hoàn thành</div>
                                </div>
                            </div>
                            <div className="stat-card yellow">
                                <i className="ri-error-warning-line stat-icon" />
                                <div>
                                    <div className="stat-number">4</div>
                                    <div className="stat-label">Quá hạn</div>
                                </div>
                            </div>
                        </div>

                        {/*<div className="progress-section">*/}
                        {/*    <div className="section-header">*/}
                        {/*        <h3 className="section-title">Tiến độ công việc</h3>*/}
                        {/*    </div>*/}
                        {/*    <div style={{ padding: '20px' }}>*/}
                        {/*        <div className="progress-bar">*/}
                        {/*            <div className="progress-fill" style={{ width: '50%' }} />*/}
                        {/*        </div>*/}
                        {/*        <p style={{ fontSize: '14px', color: '#666', marginTop: '10px' }}>*/}
                        {/*            50% công việc đã hoàn thành*/}
                        {/*        </p>*/}
                        {/*    </div>*/}
                        {/*</div>*/}

                        <div className="content-grid">
                            <div className="task-section">
                                <div className="section-header">
                                    <h3 className="section-title">Công việc gần đây</h3>
                                    <button
                                        className="btn btn-primary"
                                        onClick={handleCreateNewTask}
                                        title="Chuyển đến trang tạo công việc chi tiết"
                                    >
                                        <i className="ri-add-line" /> Tạo mới
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
                                                    <img
                                                        src={task.creatorAvatar || task.CreatorAvatar || 'man.jpg'}
                                                        className="avatar"
                                                        alt={creatorName}
                                                    />
                                                    <div style={{ flex: 1 }}>
                                                        <div className="task-title">{title}</div>
                                                        <div className="task-meta">
                                                            <span>
                                                                <i className="ri-calendar-line" /> {endDate}
                                                            </span>
                                                            <span style={{
                                                                fontSize: '10px',
                                                                color: '#1890ff',
                                                                marginLeft: '4px',
                                                                backgroundColor: 'rgba(24,144,255,0.1)',
                                                                padding: '1px 4px',
                                                                borderRadius: '3px'
                                                            }}>
                                                                Người tạo:
                                                            </span>
                                                            <span>
                                                                <i className="ri-user-line" /> {creatorName}
                                                            </span>
 
                                                            <span className={`priority-${priority ? priority.toLowerCase() : 'unknown'}`}>
                                                                <i className="ri-flag-line" /> {priority}
                                                            </span>
                                                        </div>

                                                        {/* Phần hiển thị assignees*/}
                                                        {task.assignees && task.assignees.length > 0 && (
                                                            <div className="assignees-section" style={{ marginTop: '8px' }}>
                                                                <span style={{ fontSize: '12px', color: '#666' }}>
                                                                    <i className="ri-team-line" /> Người đảm nhiệm:
                                                                </span>
                                                                <div style={{ display: 'flex', gap: '5px', marginTop: '5px', flexWrap: 'wrap' }}>
                                                                    {task.assignees.map(assignee => (
                                                                        <div key={assignee.userID} style={{ display: 'flex', alignItems: 'center' }}>
                                                                            <img
                                                                                src={assignee.avatar || 'man.jpg'}
                                                                                style={{
                                                                                    width: '24px',
                                                                                    height: '24px',
                                                                                    borderRadius: '50%',
                                                                                    marginRight: '5px'
                                                                                }}
                                                                                alt={assignee.fullName}
                                                                            />
                                                                            <span style={{ fontSize: '12px' }}>
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
                                            );
                                        })
                                    ) : (
                                        <p>Không có công việc gần đây.</p>
                                    )}
                                </div>
                            </div>

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

                                            // Xác định màu sắc theo số ngày còn lại
                                            let color, bgColor;
                                            if (daysLeft <= 1) {  // 1 ngày hoặc đã hết hạn
                                                color = '#ff4d4f';
                                                bgColor = 'rgba(255,77,79,0.1)';
                                            } else if (daysLeft <= 7) {  // 3-7 ngày
                                                color = '#faad14';
                                                bgColor = 'rgba(250,173,20,0.1)';
                                            } else {  // >7 ngày
                                                color = '#52c41a';
                                                bgColor = 'rgba(82,196,65,0.1)';
                                            }

                                            return (
                                                <div className="task-card" key={notification.TaskID || notification.id || Math.random()}>
                                                    <div style={{ flex: 1 }}>
                                                        {/* Tiêu đề + Số ngày còn lại */}
                                                        <div style={{ display: 'block', marginBottom: '8px' }}>
                                                            <div style={{ fontSize: '15px', fontWeight: '500', marginBottom: '4px' }}>{title}</div>
                                                            <span style={{
                                                                color: color,
                                                                backgroundColor: bgColor,
                                                                fontSize: '13px',
                                                                padding: '2px 8px',
                                                                borderRadius: '8px',
                                                                display: 'inline-block'
                                                            }}>
                                                                {daysLeft === 0 ? 'Đến hạn' : `Còn ${daysLeft} ngày`}
                                                            </span>
                                                        </div>

                                                        {/* Danh sách người đảm nhiệm */}
                                                        {task.assignees && task.assignees.length > 0 && (
                                                            <div className="assignees-section">
                                                                <span style={{ fontSize: '14px', color: '#666', marginBottom: '8px', display: 'block' }}>
                                                                    <i className="ri-team-line" /> Người đảm nhiệm:
                                                                </span>
                                                                <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap' }}>
                                                                    {task.assignees.map(assignee => (
                                                                        <div
                                                                            key={assignee.userID}
                                                                            style={{
                                                                                display: 'flex',
                                                                                alignItems: 'center',
                                                                                backgroundColor: '#f5f5f5',
                                                                                padding: '6px 12px',
                                                                                borderRadius: '20px',
                                                                                boxShadow: '0 1px 3px rgba(0,0,0,0.1)'
                                                                            }}
                                                                        >
                                                                            <img
                                                                                src={assignee.avatar || 'man.jpg'}
                                                                                style={{
                                                                                    width: '28px',
                                                                                    height: '28px',
                                                                                    borderRadius: '50%',
                                                                                    marginRight: '8px'
                                                                                }}
                                                                                alt={assignee.fullName}
                                                                            />
                                                                            <span style={{ fontSize: '14px' }}>
                                                                                {assignee.fullName}
                                                                                {assignee.departmentName && (
                                                                                    <span style={{ color: '#888', marginLeft: '5px' }}>
                                                                                        ({assignee.departmentName})
                                                                                    </span>
                                                                                )}
                                                                            </span>
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
                                        <p>Không có thông báo sắp đến hạn.</p>
                                    )}
                                </div>
                                <div className="quick-task">
                                    <div className="form-group">
                                        <label className="form-label">Thêm công việc nhanh</label>
                                        <input
                                            type="text"
                                            className="form-control"
                                            placeholder="Nhập tiêu đề công việc..."
                                        />
                                    </div>
                                    <button className="btn btn-primary"
                                        style={{ width: '100%' }}
                                        onClick={handleCreateNewTask}
                                    >
                                        <i className="ri-add-line" /> Thêm ngay
                                    </button>
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