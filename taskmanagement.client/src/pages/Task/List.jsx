// src/pages/Task/List.jsx
import { useState, useEffect, useCallback, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import Breadcrumb from '../../components/Breadcrumb';
import SearchBar from '../../components/SearchBar/SearchBar';
import Pagination from '../../components/Pagination/Pagination';
import ActionMenu from '../../components/ActionMenu/ActionMenu';
import { useAuth } from '../../context/AuthContext';
import LayoutMain from '../../layouts/LayoutMain';
import axiosInstance from '../../api/axiosConfig';

const List = () => {
    const { user } = useAuth(); // Lấy thông tin user
    const navigate = useNavigate();

    // State
    const [users, setUsers] = useState([]);
    const [usersMap, setUsersMap] = useState(new Map());
    const [tasks, setTasks] = useState([]);
    const [departments, setDepartments] = useState([]);
    const [taskStatuses, setTaskStatuses] = useState([]);
    const [statusSummary, setStatusSummary] = useState([]);
    const [totalTasks, setTotalTasks] = useState(0);
    const [isLoading, setIsLoading] = useState(false);
    const [searchDepartment, setSearchDepartment] = useState('');
    const [searchStatus, setSearchStatus] = useState('');
    const [keywordSearch, setKeywordSearch] = useState('');
    const [currentPage, setCurrentPage] = useState(1);
    const [totalRecords, setTotalRecords] = useState(0);
    const [pageSize] = useState(5);
    const [error, setError] = useState(null);

    // Modal states
    const [showDeleteModal, setShowDeleteModal] = useState(false);
    const [taskToDelete, setTaskToDelete] = useState(null);
    const [deleteError, setDeleteError] = useState('');
    const [deleteMessage, setDeleteMessage] = useState('');

    // Kiểm tra quyền - Nhân viên không được phép thêm/sửa/xóa
    const isEmployee = user?.roleName === 'Nhân viên';

    // Lấy danh sách phòng ban từ API
    useEffect(() => {
        const fetchDepartments = async () => {
            try {
                setError(null);
                const response = await axiosInstance.get('/users/departments');
                const data = response.data;
                if (data.success) {
                    setDepartments(data.data || []);
                } else {
                    setError(data.message || 'Lỗi khi lấy danh sách phòng ban');
                }
            } catch (error) {
                console.error('Error fetching departments:', error);
                setError(`Không thể lấy danh sách phòng ban: ${error.response?.data?.message || error.message}`);
                setDepartments([]);
            }
        };

        fetchDepartments();
    }, []);

    // Lấy danh sách trạng thái công việc từ API
    useEffect(() => {
        const fetchTaskStatuses = async () => {
            try {
                setError(null);
                const response = await axiosInstance.get('/tasks/statuses');
                const data = response.data;
                if (data.success) {
                    setTaskStatuses(data.data || []);
                } else {
                    setError(data.message || 'Lỗi khi lấy danh sách trạng thái');
                }
            } catch (error) {
                console.error('Error fetching task statuses:', error);
                setError(`Không thể lấy danh sách trạng thái: ${error.response?.data?.message || error.message}`);
                setTaskStatuses([]);
            }
        };

        fetchTaskStatuses();
    }, []);

    // Lấy tổng hợp trạng thái công việc từ API
    useEffect(() => {
        const fetchStatusSummary = async () => {
            try {
                setError(null);
                const response = await axiosInstance.get('/tasks/status-summary');
                console.log('Status summary response:', response.data);
                if (response.data && response.data.success) {
                    const summaryData = response.data.data?.summary || [];
                    const totalTasksCount = response.data.data?.total || 0;
                    setStatusSummary(summaryData);
                    setTotalTasks(totalTasksCount);
                } else {
                    console.error('API returned error:', response.data?.message);
                    setStatusSummary([]);
                    setTotalTasks(0);
                }
            } catch (error) {
                console.error('Error fetching status summary:', error);
                setStatusSummary([]);
                setTotalTasks(0);
            }
        };

        fetchStatusSummary();
    }, []);

    // Lấy danh sách người dùng từ API
    useEffect(() => {
        const fetchUsers = async () => {
            try {
                setError(null);
                const response = await axiosInstance.get('/users/all');
                const data = response.data;
                console.log('Users from API:', data.data); // Log để kiểm tra usersMap
                if (data.success) {
                    const usersData = data.data || [];
                    setUsers(usersData);
                    const userMap = new Map();
                    usersData.forEach(user => {
                        userMap.set(user.userID, user);
                    });
                    setUsersMap(userMap);
                    console.log('UserID 15:', userMap.get(15)); // Log cụ thể cho userID: 15
                } else {
                    setError(data.message || 'Lỗi khi lấy danh sách người dùng');
                }
            } catch (error) {
                console.error('Error fetching users:', error);
                setError(`Không thể lấy danh sách người dùng: ${error.response?.data?.message || error.message}`);
                setUsers([]);
                setUsersMap(new Map());
            }
        };

        fetchUsers();
    }, []);

    // Hàm lấy danh sách công việc từ API
    const fetchTasks = useCallback(async () => {
        setIsLoading(true);
        try {
            const params = {
                department: searchDepartment || '',
                status: searchStatus || '',
                keyword: keywordSearch || '',
                page: currentPage,
            };
            const response = await axiosInstance.get('/tasks', { params });
            const data = response.data;
            console.log('Tasks from API:', data.data.tasks); // Log để kiểm tra assignees
            if (data.success) {
                setTasks(data.data?.tasks || []);
                setTotalRecords(data.data?.totalRecords || 0);
                setError(null);
            } else {
                setError(data.message || 'Lỗi khi lấy danh sách công việc');
                setTasks([]);
                setTotalRecords(0);
            }
        } catch (error) {
            console.error('Lỗi lấy công việc:', error);
            setError(`Không thể lấy danh sách công việc: ${error.response?.data?.message || error.message}`);
            setTasks([]);
            setTotalRecords(0);
        } finally {
            setIsLoading(false);
        }
    }, [searchDepartment, searchStatus, keywordSearch, currentPage]);

    useEffect(() => {
        fetchTasks();
    }, [fetchTasks]);

    // Cấu hình selectOptions cho SearchBar
    const selectOptions = useMemo(() => [
        {
            name: 'department',
            label: 'Tất cả phòng ban',
            options: departments.map(dept => ({
                value: dept.departmentID?.toString() || '',
                text: dept.departmentName || 'Không rõ',
            })),
            value: searchDepartment,
            onChange: (value) => {
                console.log('Department changed to:', value);
                setSearchDepartment(value);
            },
        },
        {
            name: 'status',
            label: 'Tiến độ công việc',
            options: taskStatuses.map(status => ({
                value: status.value || status.statusID?.toString() || '',
                text: status.text || status.statusName || 'Không rõ',
            })),
            value: searchStatus,
            onChange: (value) => {
                console.log('Status changed to:', value);
                setSearchStatus(value);
            },
        },
    ], [departments, taskStatuses, searchDepartment, searchStatus]);

    // Hàm xử lý thêm mới
    const handleAdd = (e) => {
        e.preventDefault();
        if (isEmployee) {
            setDeleteMessage('Bạn không có quyền thêm công việc mới!');
            setShowDeleteModal(true);
            return;
        }
        navigate('/task-add');
    };

    // Hàm xử lý xem chi tiết
    const handleView = (task) => (e) => {
        e.preventDefault();
        navigate(`/task-view/${task.taskID}`);
    };

    // Hàm xử lý chỉnh sửa
    const handleEdit = (task) => (e) => {
        e.preventDefault();
        navigate(`/task-edit/${task.taskID}`);
    };

    // Hàm xử lý xóa
    const handleDelete = (task) => async (e) => {
        e.preventDefault();
        setTaskToDelete(task);
        setDeleteError('');
        setDeleteMessage('');

        if (isEmployee) {
            setDeleteMessage('Bạn không có quyền xóa công việc!');
            setShowDeleteModal(true);
            return;
        }

        setShowDeleteModal(true);
    };

    // Xác nhận xóa
    const confirmDelete = async () => {
        if (!taskToDelete || isEmployee) return;

        setIsLoading(true);
        setDeleteError('');

        try {
            const response = await axiosInstance.delete(`/tasks/${taskToDelete.taskID}`);
            if (response.data.success) {
                console.log('Xóa công việc thành công: ', response.data.data?.taskID || taskToDelete.taskID);
                setShowDeleteModal(false);
                fetchTasks();
            } else {
                setDeleteError(response.data.message || 'Lỗi khi xóa công việc');
            }
        } catch (error) {
            console.error('Lỗi khi xóa công việc:', error);
            setDeleteError(error.response?.data?.message || `Không thể xóa công việc: ${error.message}`);
        } finally {
            setIsLoading(false);
        }
    };

    // Hàm xử lý tìm kiếm
    const handleSearch = useCallback(() => {
        console.log('Search triggered:', { searchDepartment, searchStatus, keywordSearch });
        setCurrentPage(1);
    }, [searchDepartment, searchStatus, keywordSearch]);

    // Hàm xử lý xóa bộ lọc
    const handleClearSearch = useCallback(() => {
        console.log('Clear search triggered');
        setSearchDepartment('');
        setSearchStatus('');
        setKeywordSearch('');
        setCurrentPage(1);
    }, []);

    // Hàm xử lý thay đổi trang
    const handlePageChange = (page) => {
        console.log('Page changed to:', page);
        setCurrentPage(page);
    };

    // Hàm hiển thị danh sách người đảm nhiệm
    const renderAssignees = (assignees) => {
        console.log('Rendering assignees:', assignees); 
        if (!assignees || assignees.length === 0) {
            console.log('No assignees found');
            return 'Chưa gán';
        }
        return (
            <>
                {assignees.map((assignee) => {
                    const userFromMap = usersMap.get(assignee.userID);
                    console.log(`Assignee userID ${assignee.userID}:`, userFromMap);
                    return (
                        <div key={assignee.userID} className="infor">
                            <img
                                src={assignee.avatar || userFromMap?.avatar || '/man.jpg'}
                                className="avatar"
                                alt={assignee.fullName || userFromMap?.fullName || 'Không rõ'}
                                onError={(e) => {
                                    console.log('Avatar error for userID:', assignee.userID);
                                    e.target.onerror = null;
                                    e.target.src = '/man.jpg';
                                }}
                            />
                            <div className="user-details">
                                <div className="user-name">
                                    <i className="ri-user-line"></i>
                                    <span>{assignee.fullName || userFromMap?.fullName || 'Không rõ'}</span>
                                </div>
                                <div className="user-role">
                                    <i className="ri-shield-star-line"></i>
                                    <span>{assignee.roleName || userFromMap?.role?.roleName || 'Chưa có vai trò'}</span>
                                </div>
                                <div className="user-department">
                                    <i className="ri-building-line"></i>
                                    <span>{assignee.departmentName || userFromMap?.department?.departmentName || 'Chưa có phòng ban'}</span>
                                </div>
                            </div>
                        </div>
                    );
                })}
            </>
        );
    };

    // Hàm kiểm tra quyền xem task
    const canViewTask = (task) => {
        if (!isEmployee) return true; // Non-employee có thể xem tất cả
        // Employee chỉ có thể xem task được giao hoặc tự tạo
        return task.createdBy === user.userID ||
            (task.assignees && task.assignees.some(assignee => assignee.userID === user.userID));
    };

    return (
        <>
            <title>Danh sách công việc</title>
            <LayoutMain pageTitle="Danh sách công việc">
                <main className="listwork-content">
                    <Breadcrumb />
                    <div className="status-summary">
                        {(statusSummary || []).map(status => (
                            <div key={status.StatusID || status.statusId} className="summary-item">
                                <h4 className="status-count">{status.Count || status.count}</h4>
                                <p className="status-name">{status.StatusName || status.statusName}</p>
                            </div>
                        ))}
                    </div>

                    <SearchBar
                        selectOptions={selectOptions}
                        onAdd={handleAdd}
                        onTyping={() => console.log('Typing...')}
                        onSearch={handleSearch}
                        onClearSearch={handleClearSearch}
                        keywordSearch={keywordSearch}
                        onKeywordSearchChange={setKeywordSearch}
                        isLoading={isLoading}
                        showAddButton={!isEmployee} // Chỉ hiển thị nút thêm cho non-employee
                    />

                    <div className="table-container">
                        {error && (
                            <div className="alert alert-danger" role="alert">
                                <strong>Lỗi:</strong> {error}
                            </div>
                        )}
                        <table className="table">
                            <thead>
                                <tr>
                                    <th>ID Công việc</th>
                                    <th>Tên Công việc</th>
                                    <th>Người đảm nhiệm</th>
                                    <th>Trạng thái</th>
                                    <th>Thời hạn</th>
                                    <th>Hành động</th>
                                </tr>
                            </thead>
                            <tbody>
                                {isLoading ? (
                                    <tr>
                                        <td colSpan="6" className="text-center">
                                            <div className="spinner-border" role="status">
                                                <span className="visually-hidden">Đang tải...</span>
                                            </div>
                                        </td>
                                    </tr>
                                ) : tasks.length === 0 ? (
                                    <tr>
                                        <td colSpan="6" className="text-center">
                                            {error ? 'Không thể tải dữ liệu' : 'Không có dữ liệu'}
                                        </td>
                                    </tr>
                                ) : (
                                    tasks.map((task) => (
                                        <tr key={task.taskID}>
                                            <td>T{task.taskID.toString().padStart(3, '0')}</td>
                                            <td>
                                                <div className="task-title">{task.title}</div>
                                                <div className="description-project">{task.description}</div>
                                            </td>
                                            <td>{renderAssignees(task.assignees)}</td>
                                            <td>
                                                <span
                                                    className={`status-badge ${task.statusName === 'Đang thực hiện' ? 'status-progress' :
                                                        task.statusName === 'Hoàn thành' ? 'status-completed' :
                                                            task.statusName === 'Chưa bắt đầu' ? 'status-not-started' :
                                                                'status-inactive'
                                                        }`}
                                                >
                                                    {task.statusName}
                                                </span>
                                            </td>
                                            <td className="date-cell">
                                                <div className="date-range-group">
                                                    <div className="input-group input-group-sm">
                                                        <span className="input-group-text date-label">Ngày tạo</span>
                                                        <input
                                                            type="text"
                                                            className="form-control date-input"
                                                            value={task.createdAt}
                                                            readOnly
                                                            aria-label="Ngày tạo"
                                                        />
                                                    </div>
                                                    <div className="input-group input-group-sm">
                                                        <span className="input-group-text date-label">Bắt đầu</span>
                                                        <input
                                                            type="text"
                                                            className="form-control date-input"
                                                            value={task.startDate}
                                                            readOnly
                                                            aria-label="Ngày bắt đầu"
                                                        />
                                                    </div>
                                                    <div className="input-group input-group-sm">
                                                        <span className="input-group-text date-label">Kết thúc</span>
                                                        <input
                                                            type="text"
                                                            className="form-control date-input"
                                                            value={task.endDate}
                                                            readOnly
                                                            aria-label="Ngày kết thúc"
                                                        />
                                                    </div>
                                                </div>
                                            </td>
                                            <td className="text-center action-menu">
                                                <ActionMenu
                                                    onView={handleView(task)}
                                                    onEdit={handleEdit(task)}
                                                    onDelete={handleDelete(task)}
                                                    showEdit={!isEmployee} // Chỉ hiển thị nút sửa cho non-employee
                                                    showDelete={!isEmployee} // Chỉ hiển thị nút xóa cho non-employee
                                                    showView={canViewTask(task)} // Hiển thị nút xem theo quyền
                                                />
                                            </td>
                                        </tr>
                                    ))
                                )}
                            </tbody>
                        </table>
                        {!error && totalRecords > 0 && (
                            <Pagination
                                totalRecords={totalRecords}
                                pageSize={pageSize}
                                currentPage={currentPage}
                                onPageChange={handlePageChange}
                            />
                        )}
                    </div>
                </main>
            </LayoutMain>

            {/* Modal thông báo */}
            <div className={`modal fade ${showDeleteModal ? 'show' : ''}`}
                style={{ display: showDeleteModal ? 'block' : 'none' }}
                tabIndex="-1"
                role="dialog">
                <div className="modal-dialog modal-dialog-centered" role="document">
                    <div className="modal-content">
                        <div className="modal-header">
                            <h5 className="modal-title">Thông báo</h5>
                            <button type="button"
                                className="btn-close"
                                onClick={() => setShowDeleteModal(false)}
                                disabled={isLoading}>
                            </button>
                        </div>
                        <div className="modal-body">
                            {deleteError ? (
                                <div className="alert alert-danger">
                                    <i className="ri-error-warning-line me-2"></i>
                                    {deleteError}
                                </div>
                            ) : deleteMessage ? (
                                <div className="alert alert-warning">
                                    <i className="ri-alert-line me-2"></i>
                                    {deleteMessage}
                                </div>
                            ) : (
                                <>
                                    <div className="text-center mb-3">
                                        <i className="ri-delete-bin-line text-danger" style={{ fontSize: '3rem' }}></i>
                                    </div>
                                    <p className="text-center mb-0">
                                        Bạn có chắc chắn muốn xóa công việc <strong>{taskToDelete?.title}</strong>?
                                    </p>
                                    <p className="text-center text-muted small mt-2">
                                        Hành động này không thể hoàn tác.
                                    </p>
                                </>
                            )}
                        </div>
                        <div className="modal-footer">
                            <button type="button"
                                className="btn btn-secondary"
                                onClick={() => setShowDeleteModal(false)}
                                disabled={isLoading}>
                                Đóng
                            </button>
                            {!deleteError && !deleteMessage && (
                                <button type="button"
                                    className="btn btn-danger"
                                    onClick={confirmDelete}
                                    disabled={isLoading}>
                                    {isLoading ? (
                                        <>
                                            <span className="spinner-border spinner-border-sm me-2" role="status"></span>
                                            Đang xóa...
                                        </>
                                    ) : (
                                        <>
                                            <i className="ri-delete-bin-line me-1"></i>
                                            Xóa công việc
                                        </>
                                    )}
                                </button>
                            )}
                        </div>
                    </div>
                </div>
            </div>

            {showDeleteModal && <div className="modal-backdrop fade show"></div>}
        </>
    );
};

export default List;