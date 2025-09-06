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

    const [users, setUsers] = useState([]);
    const [usersMap, setUsersMap] = useState(new Map());
    const [projects, setProjects] = useState([]);
    const [departments, setDepartments] = useState([]);
    const [statusSummary, setStatusSummary] = useState([]);
    const [isLoading, setIsLoading] = useState(false);
    const [searchDepartment, setSearchDepartment] = useState('');
    const [searchStatus, setSearchStatus] = useState('');
    const [keywordSearch, setKeywordSearch] = useState('');
    const [currentPage, setCurrentPage] = useState(1);
    const [totalRecords, setTotalRecords] = useState(0);
    const [pageSize] = useState(3);
    const [error, setError] = useState(null);

    const [showDeleteModal, setShowDeleteModal] = useState(false);
    const [projectToDelete, setProjectToDelete] = useState(null);
    const [deleteError, setDeleteError] = useState('');
    const [deleteMessage, setDeleteMessage] = useState('');

    // Kiểm tra quyền Giám đốc
    const isDirector = user?.roleName === 'Giám đốc';

    useEffect(() => {
        const fetchDepartments = async () => {
            try {
                setIsLoading(true);
                setError(null);
                const response = await axiosInstance.get('/users/departments');
                if (response.data.success) {
                    setDepartments(response.data.data || []);
                } else {
                    setError(response.data.message || 'Lỗi khi lấy danh sách phòng ban');
                }
            } catch (error) {
                console.error('Error fetching departments:', error);
                setError(`Không thể lấy danh sách phòng ban: ${error.message}`);
            } finally {
                setIsLoading(false);
            }
        };

        fetchDepartments();
    }, []);

    useEffect(() => {
        const fetchStatusSummary = async () => {
            try {
                setIsLoading(true);
                setError(null);
                const response = await axiosInstance.get('/projects/status-summary');
                if (response.data.success) {
                    setStatusSummary(response.data.data || []);
                } else {
                    setError(response.data.message || 'Lỗi khi lấy tổng hợp trạng thái');
                }
            } catch (error) {
                console.error('Error fetching status summary:', error);
                setError(`Không thể lấy tổng hợp trạng thái: ${error.message}`);
            } finally {
                setIsLoading(false);
            }
        };

        fetchStatusSummary();
    }, []);

    useEffect(() => {
        const fetchUsers = async () => {
            try {
                const response = await axiosInstance.get('/users/all');
                if (response.data.success) {
                    const usersData = response.data.data || [];
                    setUsers(usersData);
                    const userMap = new Map();
                    usersData.forEach(user => {
                        userMap.set(user.userID, user);
                    });
                    setUsersMap(userMap);
                }
            } catch (error) {
                console.error('Lỗi khi lấy danh sách người dùng:', error);
            }
        };

        fetchUsers();
    }, []);

    const fetchProjects = useCallback(async () => {
        setIsLoading(true);
        try {
            const params = new URLSearchParams({
                department: searchDepartment || 'all',
                status: searchStatus || 'all',
                keyword: keywordSearch || '',
                page: currentPage,
            });
            const response = await axiosInstance.get(`/projects?${params}`);
            if (response.data.success) {
                setProjects(response.data.data?.projects || []);
                setTotalRecords(response.data.data?.totalRecords || 0);
            } else {
                setError(response.data.message || 'Lỗi khi lấy danh sách dự án');
            }
        } catch (error) {
            console.error('Lỗi lấy dự án:', error);
            setError(`Không thể lấy danh sách dự án: ${error.message}`);
        } finally {
            setIsLoading(false);
        }
    }, [searchDepartment, searchStatus, keywordSearch, currentPage]);

    useEffect(() => {
        fetchProjects();
    }, [fetchProjects]);

    const PROJECT_STATUSES = [
        { value: 'Đang thực hiện', label: 'Đang thực hiện' },
        { value: 'Hoàn thành', label: 'Hoàn thành' },
        { value: 'Đã hủy', label: 'Đã hủy' },
    ];

    const selectOptions = useMemo(
        () => [
            {
                name: 'department',
                label: 'Tất cả phòng',
                options: departments.map((dept) => ({
                    value: dept.departmentID,
                    label: dept.departmentName,
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
                options: PROJECT_STATUSES,
                value: searchStatus,
                onChange: (value) => setSearchStatus(value),
            },
        ],
        [departments, statusSummary, searchDepartment, searchStatus]
    );

    const handleAdd = (e) => {
        e.preventDefault();
        if (!isDirector) {
            setDeleteMessage('Chỉ có Giám đốc mới được phép thêm dự án!');
            setShowDeleteModal(true);
            return;
        }
        navigate('/project-add');
    };

    const handleView = (project) => (e) => {
        e.preventDefault();
        navigate(`/project-view/${project.projectID}`);
    };

    const handleEdit = (project) => (e) => {
        e.preventDefault();
        if (!isDirector) {
            setProjectToDelete(project);
            setDeleteMessage('Chỉ có Giám đốc mới được phép sửa dự án!');
            setShowDeleteModal(true);
            return;
        }
        navigate(`/project-edit/${project.projectID}`);
    };

    const handleDelete = (project) => async (e) => {
        e.preventDefault();
        setProjectToDelete(project);
        setDeleteError('');
        setDeleteMessage('');

        // Kiểm tra nếu dự án đã được phân công
        try {
            const response = await axiosInstance.get(`/projects/${project.projectID}/assignments`);
            if (response.data.success && response.data.data.length > 0) {
                setDeleteMessage('Không thể xóa dự án đã được phân công!');
                setShowDeleteModal(true);
                return;
            }
        } catch (error) {
            console.error('Lỗi khi kiểm tra phân công:', error);
        }

        if (!isDirector) {
            setDeleteMessage('Chỉ có Giám đốc mới được phép xóa dự án!');
            setShowDeleteModal(true);
            return;
        }

        setShowDeleteModal(true);
    };

    const confirmDelete = async () => {
        if (!projectToDelete || !isDirector) return;

        setIsLoading(true);
        setDeleteError('');

        try {
            const response = await axiosInstance.delete(`/projects/${projectToDelete.projectID}`);
            if (response.data.success) {
                console.log('Xóa dự án thành công: ', response.data.data?.projectID || projectToDelete.projectID);
                setShowDeleteModal(false);
                fetchProjects();
            } else {
                setDeleteError(response.data.message || 'Lỗi khi xóa dự án');
            }
        } catch (error) {
            console.error('Lỗi khi xóa dự án:', error);
            setDeleteError(error.response?.data?.message || `Không thể xóa dự án: ${error.message}`);
        } finally {
            setIsLoading(false);
        }
    };

    const handleTyping = () => {
        console.log('Typing...');
    };

    const handleSearch = useCallback(() => {
        console.log('Search triggered:', { searchDepartment, searchStatus, keywordSearch });
        setCurrentPage(1);
    }, [searchDepartment, searchStatus, keywordSearch]);

    const handleClearSearch = useCallback(() => {
        console.log('Clear search triggered');
        setSearchDepartment('');
        setSearchStatus('');
        setKeywordSearch('');
        setCurrentPage(1);
    }, []);

    const handlePageChange = (page) => {
        console.log('Page changed to:', page);
        setCurrentPage(page);
    };

    return (
        <>
            <title>Quản lý dự án</title>
            <LayoutMain pageTitle="Danh sách dự án">
                <main className="listwork-content">
                    <Breadcrumb />
                    <div className="status-summary">
                        {statusSummary.map((item, index) => (
                            <div className="summary-item" key={index}>
                                <h4>{item.count}</h4>
                                <p>{item.status}</p>
                            </div>
                        ))}
                    </div>

                    <SearchBar
                        selectOptions={selectOptions}
                        onAdd={handleAdd}
                        onTyping={handleTyping}
                        onSearch={handleSearch}
                        onClearSearch={handleClearSearch}
                        keywordSearch={keywordSearch}
                        onKeywordSearchChange={setKeywordSearch}
                        isLoading={isLoading}
                        showAddButton={isDirector} // Chỉ hiển thị nút thêm cho Giám đốc
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
                                    <th>ID Dự án</th>
                                    <th>Tên Dự án</th>
                                    <th>Người tạo</th>
                                    <th>Trạng thái</th>
                                    <th>Thời hạn</th>
                                    <th>Hành động</th>
                                </tr>
                            </thead>
                            <tbody>
                                {isLoading ? (
                                    <tr>
                                        <td colSpan="8" className="text-center">
                                            <div className="spinner-border" role="status">
                                                <span className="visually-hidden">Đang tải...</span>
                                            </div>
                                        </td>
                                    </tr>
                                ) : projects.length === 0 ? (
                                    <tr>
                                        <td colSpan="8" className="text-center">
                                            {error ? 'Không thể tải dữ liệu' : 'Không có dữ liệu'}
                                        </td>
                                    </tr>
                                ) : (
                                    projects.map((project) => (
                                        <tr key={project.projectID}>
                                            <td>P{project.projectID.toString().padStart(3, '0')}</td>
                                            <td>
                                                <div className="task-title">{project.projectName}</div>
                                                <div className="description-project">{project.description}</div>
                                            </td>
                                            <td>
                                                <div className="infor">
                                                    <img
                                                        src={usersMap.get(project.createdBy)?.avatar || 'images/default-avatar.png'}
                                                        className="avatar"
                                                        alt={usersMap.get(project.createdBy)?.fullName || 'Không rõ'}
                                                        onError={(e) => {
                                                            e.target.onerror = null;
                                                            e.target.src = 'images/default-avatar.png';
                                                        }}
                                                    />
                                                    <div className="user-details">
                                                        <div className="user-name">
                                                            <i className="ri-user-line"></i>
                                                            <span>{usersMap.get(project.createdBy)?.fullName || 'Không rõ'}</span>
                                                        </div>
                                                        <div className="user-role">
                                                            <i className="ri-shield-star-line"></i>
                                                            <span>{usersMap.get(project.createdBy)?.role?.roleName || 'Chưa có vai trò'}</span>
                                                        </div>
                                                        <div className="user-department">
                                                            <i className="ri-building-line"></i>
                                                            <span>{usersMap.get(project.createdBy)?.department?.departmentName || 'Chưa có phòng ban'}</span>
                                                        </div>
                                                    </div>
                                                </div>
                                            </td>
                                            <td>
                                                <span
                                                    className={`status-badge ${project.status === 'Đang thực hiện' ? 'status-progress' :
                                                        project.status === 'Hoàn thành' ? 'status-completed' :
                                                            project.status === 'Đã hủy' ? 'status-cancelled' :
                                                                'status-inactive'
                                                        }`}
                                                >
                                                    {project.status}
                                                </span>
                                            </td>
                                            <td className="date-cell">
                                                <div className="date-range-group">
                                                    <div className="input-group input-group-sm">
                                                        <span className="input-group-text date-label">Ngày tạo</span>
                                                        <input
                                                            type="text"
                                                            className="form-control date-input"
                                                            value={project.createdAt}
                                                            readOnly
                                                            aria-label="Ngày kết thúc"
                                                        />
                                                    </div>
                                                    <div className="input-group input-group-sm">
                                                        <span className="input-group-text date-label">Bắt đầu</span>
                                                        <input
                                                            type="text"
                                                            className="form-control date-input"
                                                            value={project.startDate}
                                                            readOnly
                                                            aria-label="Ngày bắt đầu"
                                                        />
                                                    </div>
                                                    <div className="input-group input-group-sm">
                                                        <span className="input-group-text date-label">Kết thúc</span>
                                                        <input
                                                            type="text"
                                                            className="form-control date-input"
                                                            value={project.endDate}
                                                            readOnly
                                                            aria-label="Ngày kết thúc"
                                                        />
                                                    </div>
                                                </div>
                                            </td>
                                            <td className="text-center action-menu">
                                                <ActionMenu
                                                    onView={handleView(project)}
                                                    onEdit={handleEdit(project)}
                                                    onDelete={handleDelete(project)}
                                                    showEdit={isDirector} // Chỉ hiển thị nút sửa cho Giám đốc
                                                    showDelete={isDirector} // Chỉ hiển thị nút xóa cho Giám đốc
                                                    showView={isDirector || project.createdBy === user.userID} // Hiển thị nút xem nếu là Giám đốc hoặc người tạo dự án }
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
                                        Bạn có chắc chắn muốn xóa dự án <strong>{projectToDelete?.projectName}</strong>?
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
                                            Xóa dự án
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