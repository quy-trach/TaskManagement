import { useState, useEffect, useCallback, useMemo, useContext } from 'react';
import { useNavigate } from 'react-router-dom';
import { AuthContext } from '../../context/AuthContext';
import axiosInstance from '../../api/axiosConfig';
import Breadcrumb from '../../components/Breadcrumb';
import SearchBar from '../../components/SearchBar/SearchBar';
import Pagination from '../../components/Pagination/Pagination';
import ActionMenu from '../../components/ActionMenu/ActionMenu';
import LayoutMain from '../../layouts/LayoutMain';

const List = () => {
    const navigate = useNavigate();
    const { user, isAuthenticated } = useContext(AuthContext);

    // State cho dữ liệu
    const [users, setUsers] = useState([]);
    const [roles, setRoles] = useState([]);
    const [departments, setDepartments] = useState([]);
    const [statusSummary, setStatusSummary] = useState([]);
    const [isLoading, setIsLoading] = useState(false);
    const [searchRole, setSearchRole] = useState('');
    const [searchDepartment, setSearchDepartment] = useState('');
    const [keywordSearch, setKeywordSearch] = useState('');
    const [currentPage, setCurrentPage] = useState(1);
    const [totalRecords, setTotalRecords] = useState(0);
    const [pageSize] = useState(5);
    const [error, setError] = useState(null);
    const [showDeleteModal, setShowDeleteModal] = useState(false);
    const [userToDelete, setUserToDelete] = useState(null);
    const [deleteError, setDeleteError] = useState('');
    const [showWarningModal, setShowWarningModal] = useState(false);
    const [warningMessage, setWarningMessage] = useState('');

    //Kiểm tra quyền 
    //const isManager = user?.roleName === 'Trưởng phòng';
    //const isDirector = user?.roleName === 'Giám đốc';
    const isStaff = user?.roleName === 'Nhân viên';

    // Hàm fetchRoles lấy dữ liệu chức vụ từ API
    const fetchRoles = useCallback(async () => {
        try {
            setIsLoading(true);
            setError(null);
            const response = await axiosInstance.get('/users/roles');
            if (response.data.success) {
                setRoles(response.data.data || []);
            } else {
                setError(response.data.message || 'Lỗi khi lấy danh sách chức vụ');
            }
        } catch (error) {
            console.error('Error fetching roles:', error);
            setError(`Không thể lấy danh sách chức vụ: ${error.message}`);
        } finally {
            setIsLoading(false);
        }
    }, []);

    // Hàm fetchDepartments lấy dữ liệu phòng ban từ API
    const fetchDepartments = useCallback(async () => {
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
    }, []);

    // Lấy tổng hợp trạng thái từ API
    const fetchStatusSummary = useCallback(async () => {
        try {
            const response = await axiosInstance.get('/users/status-summary');
            if (response.data.success) {
                setStatusSummary(response.data.data || []);
            } else {
                console.error(response.data.message || 'Lỗi khi lấy tổng hợp trạng thái');
            }
        } catch (error) {
            console.error('Error fetching status summary:', error);
        }
    }, []);

    // Hàm fetchUsers lấy dữ liệu người dùng từ API
    const fetchUsers = useCallback(async () => {
        setIsLoading(true);
        try {
            const params = new URLSearchParams({
                role: searchRole || '',
                department: searchDepartment || '',
                keyword: keywordSearch || '',
                page: currentPage,
            });
            const response = await axiosInstance.get(`/users?${params}`);
            if (response.data.success) {
                setUsers(response.data.data?.users || []);
                setTotalRecords(response.data.data?.totalRecords || 0);
            } else {
                setError(response.data.message || 'Lỗi khi lấy danh sách người dùng');
            }
        } catch (error) {
            console.error('Lỗi lấy người dùng:', error);
            setError(`Không thể lấy danh sách người dùng: ${error.message}`);
        } finally {
            setIsLoading(false);
        }
    }, [searchRole, searchDepartment, keywordSearch, currentPage]);

    // Gọi fetchRoles và fetchDepartments khi component mount
    useEffect(() => {
        fetchRoles();
        fetchDepartments();
    }, [fetchRoles, fetchDepartments]);

    // Gọi fetchUsers và fetchStatusSummary khi các tham số tìm kiếm thay đổi
    useEffect(() => {
        fetchUsers();
        fetchStatusSummary();
    }, [fetchUsers, fetchStatusSummary]);

    // Cấu hình selectOptions cho SearchBar
    const selectOptions = useMemo(
        () => [
            {
                name: 'role',
                label: 'Tất cả chức vụ',
                options: roles.map((role) => ({
                    value: role.roleID,
                    label: role.roleName,
                })),
                value: searchRole,
                onChange: (value) => {
                    console.log('Role changed to:', value);
                    setSearchRole(value);
                },
            },
            {
                name: 'department',
                label: 'Tất cả phòng ban',
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
        ],
        [roles, departments, searchRole, searchDepartment]
    );

    // Hàm xử lý khi nhấn nút thêm mới
    const handleAdd = (e) => {
        e.preventDefault();
        if (!isAuthenticated) {
            setWarningMessage('Vui lòng đăng nhập để thêm nhân viên.');
            setShowWarningModal(true);
            return;
        }
        if (isStaff) {
            setWarningMessage('Bạn không có quyền thêm nhân viên. Chỉ Giám đốc hoặc Trưởng phòng được phép.');
            setShowWarningModal(true);
            return;
        }
        navigate('/staff-add');
    };

    // Hàm xử lý khi nhấn nút xem chi tiết
    const handleView = (userItem) => (e) => {
        e.preventDefault();
        navigate(`/staff-view/${userItem.userID}`);
    };

    // Hàm xử lý khi nhấn nút chỉnh sửa
    const handleEdit = (userItem) => (e) => {
        e.preventDefault();
        if (!isAuthenticated) {
            setWarningMessage('Vui lòng đăng nhập để chỉnh sửa nhân viên.');
            setShowWarningModal(true);
            return;
        }
        if (isStaff) {
            setWarningMessage('Bạn không có quyền chỉnh sửa nhân viên. Chỉ Giám đốc hoặc Trưởng phòng được phép.');
            setShowWarningModal(true);
            return;
        }
        navigate(`/staff-edit/${userItem.userID}`);
    };

    // Hàm xử lý kích hoạt tài khoản
    const handleActivate = (userItem) => async (e) => {
        e.preventDefault();
        if (!isAuthenticated) {
            setWarningMessage('Vui lòng đăng nhập để kích hoạt tài khoản.');
            setShowWarningModal(true);
            return;
        }
        if (isStaff) {
            setWarningMessage('Bạn không có quyền kích hoạt tài khoản. Chỉ Giám đốc hoặc Trưởng phòng được phép.');
            setShowWarningModal(true);
            return;
        }
        setIsLoading(true);
        try {
            const response = await axiosInstance.patch(`/users/${userItem.userID}/status`, { status: true });
            if (response.data.success) {
                console.log('Kích hoạt tài khoản thành công: ', response.data.data?.userID || userItem.userID);
                setUsers(currentUsers =>
                    currentUsers.map(user =>
                        user.userID === userItem.userID ? { ...user, status: true } : user
                    )
                );

                fetchStatusSummary();
            } else {
                setError(response.data.message || 'Lỗi khi kích hoạt tài khoản');
            }
        } catch (error) {
            console.error('Lỗi khi kích hoạt tài khoản:', error);
            setError(error.response?.data?.message || `Không thể kích hoạt tài khoản: ${error.message}`);
        } finally {
            setIsLoading(false);
        }
    };

    // Hàm xử lý tạm khóa tài khoản
    const handleDeactivate = (userItem) => async (e) => {
        e.preventDefault();
        if (!isAuthenticated) {
            setWarningMessage('Vui lòng đăng nhập để tạm khóa tài khoản.');
            setShowWarningModal(true);
            return;
        }
        if (isStaff) {
            setWarningMessage('Bạn không có quyền tạm khóa tài khoản. Chỉ Giám đốc hoặc Trưởng phòng được phép.');
            setShowWarningModal(true);
            return;
        }
        setIsLoading(true);
        try {
            const response = await axiosInstance.patch(`/users/${userItem.userID}/status`, { status: false });
            if (response.data.success) {
                console.log('Tạm khóa tài khoản thành công: ', response.data.data?.userID || userItem.userID);
                setUsers(currentUsers =>
                    currentUsers.map(user =>
                        user.userID === userItem.userID ? { ...user, status: false } : user
                    )
                );

                fetchStatusSummary();
            } else {
                setError(response.data.message || 'Lỗi khi tạm khóa tài khoản');
            }
        } catch (error) {
            console.error('Lỗi khi tạm khóa tài khoản:', error);
            setError(error.response?.data?.message || `Không thể tạm khóa tài khoản: ${error.message}`);
        } finally {
            setIsLoading(false);
        }
    };

    // Hàm xử lý xóa
    const handleDelete = (userItem) => async (e) => {
        e.preventDefault();
        if (!isAuthenticated) {
            setWarningMessage('Vui lòng đăng nhập để xóa nhân viên.');
            setShowWarningModal(true);
            return;
        }
        if (isStaff) {
            setWarningMessage('Bạn không có quyền xóa nhân viên. Chỉ Giám đốc hoặc Trưởng phòng được phép.');
            setShowWarningModal(true);
            return;
        }
        setUserToDelete(userItem);
        setDeleteError('');
        setShowDeleteModal(true);
    };

    // Xác nhận xóa người dùng
    const confirmDelete = async () => {
        if (!userToDelete || !userToDelete.userID) {
            setDeleteError('Không tìm thấy thông tin người dùng cần xóa');
            return;
        }

        setIsLoading(true);
        setDeleteError('');

        try {
            const response = await axiosInstance.delete(`/users/${userToDelete.userID}`);
            if (response.data.success) {
                console.log('Xóa người dùng thành công: ', userToDelete.userID);
                setShowDeleteModal(false);
                // Lọc người dùng đã xóa ra khỏi state
                setUsers(currentUsers =>
                    currentUsers.filter(user => user.userID !== userToDelete.userID)
                );
                // Cập nhật lại tổng số bản ghi và bảng tóm tắt
                setTotalRecords(prevTotal => prevTotal - 1);
                fetchStatusSummary();
            } else {
                setDeleteError(response.data.message || 'Lỗi khi xóa người dùng');
            }
        } catch (error) {
            console.error('Lỗi khi xóa người dùng:', error);
            setDeleteError(error.response?.data?.message || `Không thể xóa người dùng: ${error.message}`);
        } finally {
            setIsLoading(false);
            setUserToDelete(null); // Dọn dẹp state sau khi xóa
        }
    };

    const handleTyping = () => {
        console.log('Typing...');
    };

    const handleSearch = useCallback(() => {
        console.log('Search triggered:', { searchRole, searchDepartment, keywordSearch });
        setCurrentPage(1);
    }, [searchRole, searchDepartment, keywordSearch]);

    const handleClearSearch = useCallback(() => {
        console.log('Clear search triggered');
        setSearchRole('');
        setSearchDepartment('');
        setKeywordSearch('');
        setCurrentPage(1);
    }, []);

    const handlePageChange = (page) => {
        console.log('Page changed to:', page);
        setCurrentPage(page);
    };

    return (
        <>
            <title>Quản lý nhân viên</title>
            <LayoutMain pageTitle="Quản lý nhân viên">
                <main className="members-content" id="members-page">
                    <Breadcrumb />
                    <div className="status-summary">
                        {statusSummary.map((item, index) => (
                            <div className="summary-item" key={index}>
                                <h4>{item.count}</h4>
                                <p>{item.status ? 'Hoạt động' : 'Ngừng hoạt động'}</p>
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
                                    <th>ID Nhân viên</th>
                                    <th>Ảnh đại diện</th>
                                    <th>Thông tin</th>
                                    <th>Bộ phận</th>
                                    <th>Trạng thái</th>
                                    <th>Ngày tạo</th>
                                    <th>Hành động</th>
                                </tr>
                            </thead>
                            <tbody>
                                {users.length === 0 ? (
                                    <tr>
                                        <td colSpan="8" className="text-center">
                                            {error ? 'Không thể tải dữ liệu' : 'Không có dữ liệu'}
                                        </td>
                                    </tr>
                                ) : (
                                    users.map((userItem) => (
                                        <tr key={userItem.userID}>
                                            <td>U{userItem.userID.toString().padStart(3, '0')}</td>
                                            <td>
                                                <div className="avatar">
                                                    <img
                                                        src={userItem.avatar || 'man.jpg'}
                                                        className="avatar"
                                                        alt={userItem.fullName}
                                                        onError={(e) => {
                                                            e.target.src = 'man.jpg';
                                                        }}
                                                    />
                                                </div>
                                            </td>
                                            <td>
                                                <div className="information d-flex flex-column gap-2">
                                                    <span className="name">
                                                        <i className="ri-user-3-line"></i>
                                                        {userItem.fullName}
                                                    </span>
                                                    <span className="email">
                                                        <i className="ri-mail-line"></i>
                                                        {userItem.email}
                                                    </span>
                                                    <span className="phone">
                                                        <i className="ri-phone-line"></i>
                                                        {userItem.mobile}
                                                    </span>
                                                    <span className="address">
                                                        <i className="ri-map-pin-line"></i>
                                                        {userItem.address}
                                                    </span>
                                                </div>
                                            </td>
                                            <td>
                                                <div className="division d-flex flex-column gap-2">
                                                    <span className="role">
                                                        <i className="ri-user-3-line"></i>
                                                        {userItem.roleName}
                                                    </span>
                                                    <span className="department">
                                                        <i className="ri-building-2-line"></i>
                                                        {userItem.departmentName}
                                                    </span>
                                                </div>
                                            </td>
                                            <td>
                                                <span
                                                    className={`status-badge ${userItem.status ? 'status-active' : 'status-inactive'}`}
                                                >
                                                    {userItem.status ? 'Hoạt động' : 'Ngừng hoạt động'}
                                                </span>
                                            </td>
                                            <td>
                                                <div className="date-range-group">
                                                    <div className="input-group input-group-sm">
                                                        <span className="input-group-text date-label">Ngày tạo</span>
                                                        <input
                                                            type="text"
                                                            className="form-control date-input"
                                                            value={userItem.createdAt}
                                                            readOnly
                                                            aria-label="Ngày tạo"
                                                        />
                                                    </div>
                                                </div>
                                            </td>
                                            <td className="text-center action-menu">
                                                <ActionMenu
                                                    isActive={userItem.status}
                                                    onActivate={isAuthenticated && user.RoleName !== 'Nhân viên' ? handleActivate(userItem) : undefined}
                                                    onView={handleView(userItem)}
                                                    onEdit={isAuthenticated && user.RoleName !== 'Nhân viên' ? handleEdit(userItem) : undefined}
                                                    onDelete={isAuthenticated && user.RoleName !== 'Nhân viên' ? handleDelete(userItem) : undefined}
                                                    onDeactivate={isAuthenticated && user.RoleName !== 'Nhân viên' ? handleDeactivate(userItem) : undefined}
                                                    showEdit={isAuthenticated && user.RoleName !== 'Nhân viên'}
                                                    showDelete={isAuthenticated && user.RoleName !== 'Nhân viên'}
                                                    showActivate={isAuthenticated && user.RoleName !== 'Nhân viên'}
                                                    showDeactivate={isAuthenticated && user.RoleName !== 'Nhân viên'}
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
                            <h5 className="modal-title">Xác nhận xóa nhân viên</h5>
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
                            ) : (
                                <>
                                    <div className="text-center mb-3">
                                        <i className="ri-delete-bin-line text-danger" style={{ fontSize: '3rem' }}></i>
                                    </div>
                                    <p className="text-center mb-0">
                                        Bạn có chắc chắn muốn xóa nhân viên <strong>{userToDelete?.fullName}</strong>?
                                    </p>
                                    <p className="text-center text-muted small mt-1">
                                        ID: U{userToDelete?.userID.toString().padStart(3, '0')}
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
                                Hủy
                            </button>
                            {!deleteError && (
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
                                            Xóa nhân viên
                                        </>
                                    )}
                                </button>
                            )}
                        </div>
                    </div>
                </div>
            </div>
            <div className={`modal fade ${showWarningModal ? 'show' : ''}`}
                style={{ display: showWarningModal ? 'block' : 'none' }}
                tabIndex="-1"
                role="dialog">
                <div className="modal-dialog modal-dialog-centered" role="document">
                    <div className="modal-content">
                        <div className="modal-header">
                            <h5 className="modal-title">Cảnh báo</h5>
                            <button type="button"
                                className="btn-close"
                                onClick={() => setShowWarningModal(false)}
                                disabled={isLoading}>
                            </button>
                        </div>
                        <div className="modal-body">
                            <div className="text-center mb-3">
                                <i className="ri-error-warning-line text-danger" style={{ fontSize: '3rem' }}></i>
                            </div>
                            <p className="text-center mb-0">{warningMessage}</p>
                        </div>
                        <div className="modal-footer">
                            <button type="button"
                                className="btn btn-secondary"
                                onClick={() => setShowWarningModal(false)}
                                disabled={isLoading}>
                                Đóng
                            </button>
                        </div>
                    </div>
                </div>
            </div>
            {(showDeleteModal || showWarningModal) && <div className="modal-backdrop fade show"></div>}
        </>
    );
};

export default List;