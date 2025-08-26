import React, { useState, useEffect, useCallback, useContext } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import PropTypes from 'prop-types';
import { AuthContext } from '../../context/AuthContext';
import axiosInstance from '../../api/axiosConfig';
import LayoutMain from '../../layouts/LayoutMain';
import Breadcrumb from '../../components/Breadcrumb';
import MessageBox from '../../components/MessageBox';

const Detail = ({ mode }) => {
    const { id } = useParams();
    const navigate = useNavigate();
    const { user, isAuthenticated } = useContext(AuthContext);

    // State
    const [roles, setRoles] = useState([]);
    const [departments, setDepartments] = useState([]);
    const [isLoading, setIsLoading] = useState(false);
    const [message, setMessage] = useState({ type: 'info', content: 'Mời nhập thông tin tài khoản' });
    const [formErrors, setFormErrors] = useState({});
    const [error, setError] = useState(null);
    const [showWarningModal, setShowWarningModal] = useState(false);
    const [warningMessage, setWarningMessage] = useState('');

    //Kiểm tra quyền truy cập
    const isStaff = user?.roleName === 'Nhân viên';

    // Data State
    const [formData, setFormData] = useState({
        fullName: '',
        email: '',
        mobile: '',
        address: '',
        password: '',
        confirmPassword: '',
        roleID: '',
        departmentID: '',
        status: true,
        createdAt: '',
        notes: '',
        avatar: ''
    });

    // Lấy danh sách chức vụ và phòng ban từ API
    useEffect(() => {
        const fetchRoles = async () => {
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
        };

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
        fetchRoles();
    }, []);

    // Hàm tải dữ liệu tài khoản
    const loadUser = useCallback(async () => {
        if (!id || mode === 'add') return;

        try {
            setIsLoading(true);
            const response = await axiosInstance.get(`/users/${id}`);
            if (response.data.success) {
                const userData = response.data.data;
                const formattedCreatedAt = userData.createdAt ? formatDate(userData.createdAt) : '';
                setFormData({
                    userID: userData.userID,
                    fullName: userData.fullName || '',
                    email: userData.email || '',
                    mobile: userData.mobile || '',
                    address: userData.address || '',
                    password: '',
                    confirmPassword: '',
                    roleID: userData.roleID || '',
                    departmentID: userData.departmentID || '',
                    status: userData.status,
                    createdAt: formattedCreatedAt,
                    notes: userData.notes || '',
                    avatar: userData.avatar || ''
                });
            } else {
                setMessage({ type: 'error', content: response.data.message || 'Không tìm thấy tài khoản.' });
            }
        } catch (error) {
            console.error('Lỗi khi tải thông tin tài khoản:', error);
            setMessage({ type: 'error', content: error.response?.data?.message || 'Lỗi khi tải thông tin tài khoản.' });
        } finally {
            setIsLoading(false);
        }
    }, [id, mode]);

    // Hàm xử lý thay đổi input
    const handleInputChange = (e) => {
        const { name, value } = e.target;
        setFormData((prevData) => ({
            ...prevData,
            [name]: name === 'status' ? value === 'true' : value,
        }));
    };

    // Hàm upload ảnh
    const handleUpload = async (blobUrl) => {
        // Hàm này giờ chỉ tập trung xử lý một blob URL duy nhất
        if (!blobUrl || !blobUrl.startsWith("blob:")) {
            return blobUrl; // Nếu không phải blob, trả về chính nó (có thể là URL đã có sẵn)
        }

        try {
            // Lấy blob từ URL
            const blob = await fetch(blobUrl).then(res => res.blob());

            // Tạo FormData để gửi đi
            const formData = new FormData();
            // Gán tên file có đuôi rõ ràng, ví dụ "avatar.jpg"
            // Điều này giúp backend xác định được kiểu file
            formData.append("file", blob, "avatar.jpg");

            // Gọi API upload-file
            const response = await fetch("/api/uploads/upload-file", {
                method: "POST",
                body: formData, // Không cần set Content-Type, trình duyệt sẽ tự làm
            });

            const result = await response.json();

            if (result.success && result.data.savedFileUrl) {
                // Trả về URL đầy đủ của file đã được lưu trên server
                return result.data.savedFileUrl;
            } else {
                // Nếu có lỗi, ném ra để hàm handleSave có thể bắt được
                throw new Error(result.message || "Upload ảnh thất bại.");
            }
        } catch (error) {
            console.error("Lỗi khi upload ảnh:", error);
            // Ném lỗi ra ngoài
            throw error;
        }
    };


    // Hàm định dạng ngày tháng
    const formatDate = (date) => {
        if (!date) return '';

        if (date instanceof Date && !isNaN(date.getTime())) {
            const day = String(date.getDate()).padStart(2, '0');
            const month = String(date.getMonth() + 1).padStart(2, '0');
            const year = date.getFullYear();
            const hours = String(date.getHours()).padStart(2, '0');
            const minutes = String(date.getMinutes()).padStart(2, '0');
            const seconds = String(date.getSeconds()).padStart(2, '0');
            return `${day}/${month}/${year} ${hours}:${minutes}:${seconds}`;
        }

        const dateTimeRegex = /^(\d{2})\/(\d{2})\/(\d{4}) (\d{2}):(\d{2}):(\d{2})$/;
        const match = date.match(dateTimeRegex);
        if (!match) return '';

        const [, day, month, year, hours, minutes, seconds] = match;
        const parsedDate = new Date(year, month - 1, day, hours, minutes, seconds);

        if (isNaN(parsedDate.getTime())) return '';

        return `${day}/${month}/${year} ${hours}:${minutes}:${seconds}`;
    };

    // Hàm validate trường
    const validateField = (fieldName, value) => {
        const errors = {};
        switch (fieldName) {
            case 'fullName':
                if (!value) errors.fullName = 'Họ và tên không được để trống.';
                break;
            case 'email':
                if (!value) errors.email = 'Email không được để trống.';
                else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value)) errors.email = 'Email không đúng định dạng.';
                break;
            case 'mobile':
                if (!value) errors.mobile = 'Số điện thoại không được để trống.';
                else if (!/^\d{10,11}$/.test(value)) errors.mobile = 'Số điện thoại phải là 10 hoặc 11 chữ số.';
                break;
            case 'password':
                if (mode === 'add' && !value) {
                    errors.password = 'Mật khẩu không được để trống.';
                }
                break;
            case 'confirmPassword':
                if (formData.password && value !== formData.password) {
                    errors.confirmPassword = 'Mật khẩu và xác nhận mật khẩu không khớp.';
                }
                break;
            case 'roleID':
                if (!value) errors.roleID = 'Vui lòng chọn vai trò.';
                break;
            case 'departmentID':
                if (!value) errors.departmentID = 'Vui lòng chọn phòng ban.';
                break;
            case 'createdAt':
                if (value && value.trim()) {
                    const dateTimeRegex = /^\d{2}\/\d{2}\/\d{4} \d{2}:\d{2}:\d{2}$/;
                    if (!dateTimeRegex.test(value)) {
                        errors[fieldName] = 'Thời gian không đúng định dạng (dd/MM/yyyy HH:mm:ss).';
                    } else {
                        try {
                            const [datePart, timePart] = value.split(' ');
                            const [day, month, year] = datePart.split('/').map(Number);
                            const date = new Date(year, month - 1, day);
                            if (isNaN(date.getTime())) {
                                errors[fieldName] = 'Thời gian không hợp lệ.';
                            }
                        } catch (error) {
                            errors[fieldName] = 'Thời gian không đúng định dạng.';
                        }
                    }
                }
                break;
            default:
                break;
        }
        return errors;
    };

    // Hàm validate form
    const validateForm = () => {
        const errors = {};
        let hasError = false;
        Object.keys(formData).forEach(field => {
            const fieldErrors = validateField(field, formData[field]);
            if (Object.keys(fieldErrors).length > 0) {
                Object.assign(errors, fieldErrors);
                hasError = true;
            }
        });

        console.log("Validation Errors:", errors);
        setFormErrors(errors);
        return !hasError;
    };

    // Hàm thêm mới tài khoản
    const handleAdd = async (dataToSend) => {
        setIsLoading(true);
        try {
            const response = await axiosInstance.post('/users', dataToSend);
            if (response.data.success) {
                setMessage({ type: 'success', content: response.data.message || 'Thêm mới tài khoản thành công!' });
                navigate('/staff-list');
            } else {
                throw new Error(response.data.message || 'Thêm mới tài khoản thất bại.');
            }
        } catch (error) {
            setMessage({ type: 'error', content: error.response?.data?.message || 'Thêm mới tài khoản thất bại.' });
        } finally {
            setIsLoading(false);
        }
    };

    // Hàm cập nhật tài khoản
    const handleUpdate = async (dataToSend) => {
        setIsLoading(true);
        try {
            if (dataToSend.createdAt) {
                const dateTimeRegex = /^(\d{2})\/(\d{2})\/(\d{4}) (\d{2}):(\d{2}):(\d{2})$/;
                const match = dataToSend.createdAt.match(dateTimeRegex);
                if (match) {
                    const [, day, month, year, hours, minutes, seconds] = match;
                    const isoDate = new Date(year, month - 1, day, hours, minutes, seconds).toISOString();
                    dataToSend.createdAt = isoDate;
                }
            }

            const response = await axiosInstance.put(`/users/${id}`, dataToSend);
            if (response.data.success) {
                setMessage({ type: 'success', content: response.data.message || 'Cập nhật tài khoản thành công!' });
                navigate('/staff-list');
            } else {
                throw new Error(response.data.message || 'Cập nhật tài khoản thất bại.');
            }
        } catch (error) {
            setMessage({ type: 'error', content: error.response?.data?.message || 'Cập nhật tài khoản thất bại.' });
        } finally {
            setIsLoading(false);
        }
    };

    // Hàm xử lý lưu
    const handleSave = async () => {
        if (!isAuthenticated) {
            setWarningMessage('Vui lòng đăng nhập để tiếp tục.');
            setShowWarningModal(true);
            navigate('/sign-in');
            return;
        }

        if (user.RoleName === 'Nhân viên') {
            setWarningMessage('Bạn không có quyền thực hiện hành động này. Chỉ Giám đốc hoặc Trưởng phòng được phép.');
            setShowWarningModal(true);
            return;
        }

        if (!validateForm()) {
            setMessage({ type: 'error', content: 'Vui lòng sửa các lỗi trên form.' });
            return;
        }

        try {
            let finalAvatarUrl = formData.avatar;
            if (formData.avatar && formData.avatar.startsWith('blob:')) {
                finalAvatarUrl = await handleUpload(formData.avatar);
            }

            const dataToSend = {
                fullName: formData.fullName,
                email: formData.email,
                mobile: formData.mobile,
                address: formData.address,
                password: formData.password,
                roleID: formData.roleID,
                departmentID: formData.departmentID,
                status: formData.status,
                createdAt: formData.createdAt,
                notes: formData.notes,
                avatar: finalAvatarUrl
            };

            if (!dataToSend.password) {
                delete dataToSend.password;
            }

            if (mode === 'add') {
                await handleAdd(dataToSend);
            } else if (mode === 'edit') {
                if (user.RoleName === 'Trưởng phòng' && formData.departmentID != user.DepartmentID) {
                    setWarningMessage('Bạn chỉ có thể chỉnh sửa nhân viên trong phòng ban của mình.');
                    setShowWarningModal(true);
                    return;
                }
                await handleUpdate(dataToSend);
            }
        } catch (error) {
            setMessage({ type: 'error', content: error.message || `${mode === 'add' ? 'Thêm' : 'Cập nhật'} tài khoản thất bại.` });
        }
    };

    // Hàm điều hướng
    const handleNavigate = (path) => navigate(path);

    const handleEdit = () => {
        if (!isAuthenticated) {
            setWarningMessage('Vui lòng đăng nhập để chỉnh sửa nhân viên.');
            setShowWarningModal(true);
            return;
        }
        if (user.RoleName === 'Nhân viên') {
            setWarningMessage('Bạn không có quyền chỉnh sửa nhân viên. Chỉ Giám đốc hoặc Trưởng phòng được phép.');
            setShowWarningModal(true);
            return;
        }
        handleNavigate(`/staff-edit/${id}`);
    };

    const handleBack = () => handleNavigate('/staff-list');

    // Load dữ liệu ban đầu
    useEffect(() => {
        if (mode === 'add') {
            setMessage({ type: 'info', content: 'Mời nhập thông tin tài khoản mới. Mã nhân viên sẽ được tạo tự động.' });
            setFormData({
                fullName: '',
                email: '',
                mobile: '',
                address: '',
                password: '',
                confirmPassword: '',
                roleID: '',
                departmentID: '',
                status: true,
                createdAt: '',
                notes: '',
                avatar: ''
            });
        } else {
            loadUser();
        }
    }, [mode, id, loadUser]);



    return (
        <>
            <title>{mode === 'edit' ? 'Chỉnh sửa nhân viên' : mode === 'add' ? 'Thêm nhân viên' : 'Chi tiết nhân viên'}</title>
            <LayoutMain pageTitle={mode === 'edit' ? 'Chỉnh sửa nhân viên' : mode === 'add' ? 'Thêm nhân viên' : 'Chi tiết nhân viên'}>
                <Breadcrumb />
                <main className="content-area">
                    <div className="form-container">
                        <form id="createUserForm" onSubmit={(e) => e.preventDefault()}>
                            <div className="container-fluid">
                                <div className="row g-3">
                                    {/* Avatar Section */}
                                    <div className="col-12 col-md-4">
                                        <div className="form-group avatar-container">
                                            <label className="form-label" htmlFor="avatar-file-upload">
                                                <i className="ri-image-line"></i>
                                                Ảnh đại diện
                                            </label>
                                            <div className="avatar-upload">
                                                <div className="avatar-preview-container">
                                                    {formData.avatar ? (
                                                        <img
                                                            className="avatar-preview"
                                                            src={formData.avatar || 'man.jpg'}
                                                            alt="Avatar Preview"
                                                        />
                                                    ) : (
                                                        <i className="ri-user-line avatar-default-icon"></i>
                                                    )}
                                                    <label
                                                        htmlFor="avatar-file-upload"
                                                        className="avatar-upload-overlay"
                                                        title="Chọn ảnh"
                                                    >
                                                        <i className="ri-camera-line"></i>
                                                    </label>
                                                    <input
                                                        type="file"
                                                        id="avatar-file-upload"
                                                        accept="image/*"
                                                        className="avatar-file-upload"
                                                        onChange={(e) => setFormData({ ...formData, avatar: URL.createObjectURL(e.target.files[0]) })}
                                                    />
                                                </div>
                                                {!isStaff && (
                                                    <div className="avatar-actions">
                                                        <a
                                                            href="#"
                                                            className="avatar-remove btn btn-secondary"
                                                            onClick={(e) => {
                                                                e.preventDefault();
                                                                setFormData({ ...formData, avatar: '' });
                                                            }}
                                                        >
                                                            <i className="ri-delete-bin-line"></i>
                                                            Xóa ảnh
                                                        </a>
                                                    </div>
                                                )}
                                            </div>
                                            <div className="form-help">
                                                Chọn ảnh đại diện cho nhân viên (định dạng JPG, PNG,...)
                                            </div>
                                            <div className="form-group mt-3">
                                                <label className="form-label" htmlFor="avatarUrl">
                                                    <i className="ri-link-line"></i>
                                                    URL Ảnh đại diện
                                                </label>
                                                <textarea
                                                    id="avatarUrl"
                                                    name="avatar"
                                                    className={`form-textarea avatar-url-textarea ${formErrors.avatar ? 'is-invalid' : ''}`}
                                                    placeholder="Nhập URL ảnh..."
                                                    rows="2"
                                                    value={formData.avatar}
                                                    onChange={handleInputChange}
                                                    readOnly={mode === 'view'}
                                                ></textarea>
                                                {formErrors.avatar && <div className="invalid-feedback d-block">{formErrors.avatar}</div>}
                                            </div>
                                            <div className="form-group mt-3">
                                                <label className="form-label" htmlFor="roleId">
                                                    <i className="ri-user-star-line"></i>
                                                    Chức vụ <span className="required">*</span>
                                                </label>
                                                <select
                                                    id="roleID"
                                                    name="roleID"
                                                    className={`form-select ${formErrors.roleID ? 'is-invalid' : ''}`}
                                                    value={formData.roleID}
                                                    onChange={handleInputChange}
                                                    required
                                                    disabled={mode === 'view'}
                                                >
                                                    <option value="">-- Chọn vai trò --</option>
                                                    {roles.map((role) => (
                                                        <option key={role.roleID} value={role.roleID}>
                                                            {role.roleName}
                                                        </option>
                                                    ))}
                                                </select>
                                                {formErrors.roleID && <div className="invalid-feedback d-block">{formErrors.roleId}</div>}
                                            </div>
                                            <div className="form-group mt-3">
                                                <label className="form-label" htmlFor="createdAt">
                                                    <i className="ri-calendar-line"></i>
                                                    Ngày khởi tạo <span className="required">*</span>
                                                </label>
                                                <input
                                                    type="text"
                                                    id="createdAt"
                                                    name="createdAt"
                                                    value={formData.createdAt || ''}
                                                    readOnly={mode === 'view'}
                                                    className={`form-control date-time-mask ${formErrors.createdAt ? 'is-invalid' : ''}`}
                                                    placeholder="dd/mm/yyyy hh:mm:ss"
                                                    onChange={handleInputChange}
                                                />
                                                {formErrors.createdAt && <div className="invalid-feedback d-block">{formErrors.createdAt}</div>}
                                            </div>
                                        </div>
                                    </div>

                                    {/* Right column for other fields */}
                                    <div className="col-12 col-md-8">
                                        <div className="row g-3">
                                            {mode !== 'add' && (
                                                <div className="col-12 col-sm-6">
                                                    <div className="form-group">
                                                        <label className="form-label" htmlFor="userID">
                                                            <i className="ri-id-card-line"></i>
                                                            ID nhân viên
                                                        </label>
                                                        <input
                                                            type="text"
                                                            id="userID"
                                                            name="userID"
                                                            className="form-input"
                                                            value={formData.userID || ''}
                                                            readOnly // Luôn ở trạng thái chỉ đọc
                                                        />
                                                    </div>
                                                </div>
                                            )}
                                            <div className="col-12 col-sm-6">
                                                <div className="form-group">
                                                    <label className="form-label" htmlFor="fullName">
                                                        <i className="ri-user-line"></i>
                                                        Họ và Tên <span className="required">*</span>
                                                    </label>
                                                    <input
                                                        type="text"
                                                        id="fullName"
                                                        name="fullName"
                                                        className={`form-input ${formErrors.fullName ? 'is-invalid' : ''}`}
                                                        value={formData.fullName}
                                                        onChange={handleInputChange}
                                                        placeholder="Nhập họ và tên..."
                                                        required
                                                        readOnly={mode === 'view'}
                                                    />
                                                    {formErrors.fullName && <div className="invalid-feedback d-block">{formErrors.fullName}</div>}
                                                </div>
                                            </div>
                                            <div className="col-12 col-sm-6">
                                                <div className="form-group">
                                                    <label className="form-label" htmlFor="email">
                                                        <i className="ri-mail-line"></i>
                                                        Email <span className="required">*</span>
                                                    </label>
                                                    <input
                                                        type="email"
                                                        id="email"
                                                        name="email"
                                                        className={`form-input ${formErrors.email ? 'is-invalid' : ''}`}
                                                        value={formData.email}
                                                        onChange={handleInputChange}
                                                        placeholder="Nhập email..."
                                                        required
                                                        readOnly={mode === 'view'}
                                                    />
                                                    {formErrors.email && <div className="invalid-feedback d-block">{formErrors.email}</div>}
                                                </div>
                                            </div>
                                            <div className="col-12 col-sm-6">
                                                <div className="form-group">
                                                    <label className="form-label" htmlFor="mobile">
                                                        <i className="ri-phone-line"></i>
                                                        Điện thoại <span className="required">*</span>
                                                    </label>
                                                    <input
                                                        type="tel"
                                                        id="mobile"
                                                        name="mobile"
                                                        className={`form-input ${formErrors.mobile ? 'is-invalid' : ''}`}
                                                        value={formData.mobile}
                                                        onChange={handleInputChange}
                                                        placeholder="Nhập số điện thoại..."
                                                        required
                                                        readOnly={mode === 'view'}
                                                    />
                                                    {formErrors.mobile && <div className="invalid-feedback d-block">{formErrors.mobile}</div>}
                                                </div>
                                            </div>
                                            <div className="col-12">
                                                <div className="form-group">
                                                    <label className="form-label" htmlFor="address">
                                                        <i className="ri-home-line"></i>
                                                        Địa chỉ <span className="required">*</span>
                                                    </label>
                                                    <textarea
                                                        id="address"
                                                        name="address"
                                                        className={`form-textarea ${formErrors.address ? 'is-invalid' : ''}`}
                                                        value={formData.address}
                                                        onChange={handleInputChange}
                                                        placeholder="Nhập địa chỉ..."
                                                        rows="2"
                                                        required
                                                        readOnly={mode === 'view'}
                                                    ></textarea>
                                                    {formErrors.address && <div className="invalid-feedback d-block">{formErrors.address}</div>}
                                                </div>
                                            </div>
                                            <div className="col-12 col-sm-6">
                                                <div className="form-group">
                                                    <label className="form-label" htmlFor="password">
                                                        <i className="ri-lock-line"></i>
                                                        Mật khẩu <span className="required" style={{ display: mode === 'add' ? 'inline' : 'none' }}>*</span>
                                                    </label>
                                                    <input
                                                        type="password"
                                                        id="password"
                                                        name="password"
                                                        className={`form-input ${formErrors.password ? 'is-invalid' : ''}`}
                                                        value={formData.password}
                                                        onChange={handleInputChange}
                                                        placeholder="Nhập mật khẩu..."
                                                        required={mode === 'add'}
                                                        readOnly={mode === 'view'}
                                                    />
                                                    {formErrors.password && <div className="invalid-feedback d-block">{formErrors.password}</div>}
                                                </div>
                                            </div>
                                            <div className="col-12 col-sm-6">
                                                <div className="form-group">
                                                    <label className="form-label" htmlFor="confirmPassword">
                                                        <i className="ri-lock-line"></i>
                                                        Nhập lại mật khẩu <span className="required" style={{ display: mode === 'add' ? 'inline' : 'none' }}>*</span>
                                                    </label>
                                                    <input
                                                        type="password"
                                                        id="confirmPassword"
                                                        name="confirmPassword"
                                                        className={`form-input ${formErrors.confirmPassword ? 'is-invalid' : ''}`}
                                                        value={formData.confirmPassword}
                                                        onChange={handleInputChange}
                                                        placeholder="Xác nhận mật khẩu..."
                                                        required={mode === 'add'}
                                                        readOnly={mode === 'view'}
                                                    />
                                                    {formErrors.confirmPassword && <div className="invalid-feedback d-block">{formErrors.confirmPassword}</div>}
                                                </div>
                                            </div>
                                            <div className="col-12 col-sm-6">
                                                <div className="form-group">
                                                    <label className="form-label" htmlFor="departmentId">
                                                        <i className="ri-building-line"></i>
                                                        Phòng ban <span className="required">*</span>
                                                    </label>
                                                    <select
                                                        id="departmentID"
                                                        name="departmentID"
                                                        className={`form-select ${formErrors.departmentID ? 'is-invalid' : ''}`}
                                                        value={formData.departmentID}
                                                        onChange={handleInputChange}
                                                        required
                                                        disabled={mode === 'view'}
                                                    >
                                                        <option value="">-- Chọn phòng ban --</option>
                                                        {departments.map((dept) => (
                                                            <option key={dept.departmentID} value={dept.departmentID}>
                                                                {dept.departmentName}
                                                            </option>
                                                        ))}
                                                    </select>
                                                </div>
                                            </div>
                                            <div className="col-12 col-sm-6">
                                                <div className="form-group">
                                                    <label className="form-label" htmlFor="status">
                                                        <i className="ri-task-line"></i>
                                                        Trạng thái
                                                    </label>
                                                    <select
                                                        name="status"
                                                        value={formData.status ? "true" : "false"}
                                                        disabled={mode === 'view'}
                                                        className={`form-select ${formErrors.status ? 'is-invalid' : ''}`}
                                                        onChange={handleInputChange}
                                                    >
                                                        <option value="" disabled>Chọn trạng thái</option>
                                                        <option value="true">Hoạt động</option>
                                                        <option value="false">Ngừng hoạt động</option>
                                                    </select>
                                                    {formErrors.status && (
                                                        <div className="invalid-feedback d-block">{formErrors.status}</div>
                                                    )}
                                                </div>
                                            </div>

                                        </div>
                                    </div>
                                    <div className="col-12">
                                        <div className="form-group">
                                            <label className="form-label" htmlFor="notes">
                                                <i className="ri-file-text-line"></i>
                                                Ghi chú
                                            </label>
                                            <textarea
                                                id="notes"
                                                name="notes"
                                                className="form-textarea"
                                                value={formData.notes}
                                                onChange={handleInputChange}
                                                placeholder="Ghi chú thêm về nhân viên (tùy chọn)..."
                                                rows="3"
                                                readOnly={mode === 'view'}
                                            ></textarea>
                                        </div>
                                    </div>
                                    {/* Form Actions */}
                                    <div className="col-12">
                                        <div className="form-actions">
                                            {mode !== 'view' && (
                                                <button
                                                    type="button"
                                                    className="btn btn-primary"
                                                    onClick={handleSave}
                                                    disabled={isLoading}
                                                >
                                                    {isLoading ? <i className="spinner-border spinner-border-sm me-1" /> : <i className="ri-save-line me-1" />}
                                                    {mode === 'add' ? 'Thêm nhân viên' : 'Lưu thay đổi'}
                                                </button>
                                            )}
                                            {mode === 'view' && (
                                                <>
                                                    <button
                                                        type="button"
                                                        className="btn btn-primary"
                                                        onClick={handleEdit}
                                                        disabled={isStaff}
                                                    >
                                                        <i className="ri-edit-fill me-1" />
                                                        Chỉnh sửa
                                                    </button>
                                                </>
                                            )}
                                            <button
                                                type="button"
                                                className="btn btn-secondary"
                                                onClick={handleBack}
                                            >
                                                <i className="ri-arrow-go-back-line me-1" />
                                                Trở về
                                            </button>

                                        </div>
                                        {isStaff && (
                                            <small className="text-end text-danger d-block mt-2">
                                                Bạn không có quyền chỉnh sửa.Chỉ Giám đốc hoặc Trưởng phòng được phép.
                                            </small>
                                        )}
                                        <MessageBox
                                            type={message.type}
                                            message={message.content}
                                        />
                                    </div>
                                </div>
                            </div>
                        </form>
                    </div>
                </main>
            </LayoutMain>
        </>
    );
};

Detail.propTypes = {
    mode: PropTypes.oneOf(['add', 'view', 'edit']).isRequired,
};

export default Detail;