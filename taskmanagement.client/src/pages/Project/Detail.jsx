import React, { useState, useEffect, useCallback, useContext } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import PropTypes from 'prop-types';
import { AuthContext } from '../../context/AuthContext'; // Thêm AuthContext
import Breadcrumb from '../../components/Breadcrumb';
import MessageBox from '../../components/MessageBox/MessageBox';
import LayoutMain from '../../layouts/LayoutMain';
import axiosInstance from '../../api/axiosConfig'; // Thêm axiosInstance

const Detail = ({ mode }) => {
    const { id } = useParams();
    const navigate = useNavigate();
    const { user, isAuthenticated } = useContext(AuthContext); // Lấy user từ AuthContext

    // State
    const [departments, setDepartments] = useState([]);
    const [isLoading, setIsLoading] = useState(false);
    const [message, setMessage] = useState({ type: 'info', content: 'Mời nhập thông tin dự án' });
    const [formErrors, setFormErrors] = useState({});
    //state usersMap
    const [usersMap, setUsersMap] = useState(new Map());

    // Kiểm tra phân quyền
    const isStaff = user?.roleName === 'Nhân viên';
    const isManager = user?.roleName === 'Trưởng phòng';

    // Data State
    const [formData, setFormData] = useState({
        projectID: '',
        projectName: '',
        createdBy: '',
        createdAt: '',
        startDate: '',
        endDate: '',
        status: 'Đang thực hiện',
        description: ''
    });

    // Lấy danh sách phòng ban và người dùng từ API
    useEffect(() => {
        const fetchDepartmentsAndUsers = async () => {
            try {
                setIsLoading(true);
                // Lấy danh sách phòng ban
                const deptResponse = await axiosInstance.get('/users/departments');
                if (deptResponse.data.success) {
                    setDepartments(deptResponse.data.data || []);
                } else {
                    setMessage({ type: 'error', content: deptResponse.data.message || 'Lỗi khi lấy danh sách phòng ban' });
                }

                // Lấy danh sách người dùng để ánh xạ ID -> FullName
                const usersResponse = await axiosInstance.get('/users/all');
                if (usersResponse.data.success) {
                    const usersData = usersResponse.data.data || [];
                    const userMap = new Map(usersData.map(user => [user.userID, user.fullName]));
                    setUsersMap(userMap);
                    console.log('Users Map:', userMap); // Debug usersMap
                } else {
                    setMessage({ type: 'error', content: usersResponse.data.message || 'Lỗi khi lấy danh sách người dùng' });
                }
            } catch (error) {
                console.error('Error fetching departments or users:', error);
                setMessage({ type: 'error', content: `Không thể lấy dữ liệu: ${error.message}` });
            } finally {
                setIsLoading(false);
            }
        };

        fetchDepartmentsAndUsers();
    }, []);

    // Hàm định dạng ngày tháng
    const formatDate = (dateInput) => {
        if (!dateInput) return '';

        if (dateInput instanceof Date) {
            const year = dateInput.getFullYear();
            const month = String(dateInput.getMonth() + 1).padStart(2, '0');
            const day = String(dateInput.getDate()).padStart(2, '0');
            return `${year}-${month}-${day}`;
        }

        if (typeof dateInput === 'string') {
            if (/^\d{4}-\d{2}-\d{2}$/.test(dateInput)) {
                return dateInput;
            }

            const parts = dateInput.split(' ');
            if (parts.length > 0) {
                const dateParts = parts[0].split('/');
                if (dateParts.length === 3) {
                    const [day, month, year] = dateParts;
                    return `${year}-${month}-${day}`;
                }
            }
        }

        return '';
    };

    // Hàm tải dữ liệu dự án
    const loadProject = useCallback(async () => {
        if (!id || mode === 'add') return;

        try {
            setIsLoading(true);
            const response = await axiosInstance.get(`/projects/${id}`);
            console.log('Project API response:', response.data); // Debug response
            if (response.data.success) {
                const projectData = response.data.data;
                setFormData({
                    projectID: projectData.projectID || '',
                    projectName: projectData.projectName || '',
                    createdBy: projectData.createdByNavigation?.fullName ||
                        projectData.createdByNavigation?.FullName ||
                        usersMap.get(projectData.createdBy) ||
                        'Không rõ',
                    createdAt: projectData.createdAt ? formatDate(projectData.createdAt) : '',
                    startDate: projectData.startDate ? formatDate(projectData.startDate) : '',
                    endDate: projectData.endDate ? formatDate(projectData.endDate) : '',
                    status: projectData.status || 'Đang thực hiện',
                    description: projectData.description || ''
                });
            } else {
                setMessage({ type: 'error', content: response.data.message || 'Không tìm thấy dự án.' });
            }
        } catch (error) {
            console.error('Lỗi khi tải thông tin dự án:', error);
            setMessage({ type: 'error', content: 'Lỗi khi tải thông tin dự án.' });
        } finally {
            setIsLoading(false);
        }
    }, [id, mode, usersMap]);

    // Hàm xử lý thay đổi input
    const handleInputChange = (e) => {
        const { name, value } = e.target;
        setFormData((prevData) => ({
            ...prevData,
            [name]: value
        }));
    };

    // Hàm validate trường
    const validateField = (fieldName, value) => {
        const errors = {};
        switch (fieldName) {
            case 'projectName':
                if (!value) errors.projectName = 'Tên dự án không được để trống.';
                break;
            case 'createdAt':
                if (!value) errors.createdAt = 'Ngày tạo không được để trống.';
                else if (!/^\d{4}-\d{2}-\d{2}$/.test(value)) errors.createdAt = 'Ngày tạo không đúng định dạng (yyyy-MM-dd).';
                break;
            case 'startDate':
                if (!value) errors.startDate = 'Ngày bắt đầu không được để trống.';
                else if (!/^\d{4}-\d{2}-\d{2}$/.test(value)) errors.startDate = 'Ngày bắt đầu không đúng định dạng (yyyy-MM-dd).';
                break;
            case 'endDate':
                if (!value) errors.endDate = 'Ngày kết thúc không được để trống.';
                else if (!/^\d{4}-\d{2}-\d{2}$/.test(value)) errors.endDate = 'Ngày kết thúc không đúng định dạng (yyyy-MM-dd).';
                else if (formData.startDate && value < formData.startDate) errors.endDate = 'Ngày kết thúc phải sau ngày bắt đầu.';
                break;
            case 'status':
                if (!value) errors.status = 'Vui lòng chọn trạng thái.';
                else if (!['Đã hủy', 'Đang thực hiện', 'Hoàn thành'].includes(value)) errors.status = 'Trạng thái không hợp lệ.';
                break;
            case 'description':
                if (!value) errors.description = 'Mô tả không được để trống.';
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
            if (field === 'projectID' && mode === 'add') return;
            if (field === 'createdBy') return; // Bỏ validate createdBy
            const fieldErrors = validateField(field, formData[field]);
            if (Object.keys(fieldErrors).length > 0) {
                Object.assign(errors, fieldErrors);
                hasError = true;
            }
        });
        setFormErrors(errors);
        return !hasError;
    };

    // Hàm thêm mới dự án
    const handleAdd = async (formData) => {
        setIsLoading(true);
        try {
            const dataToSend = {
                projectName: formData.projectName,
                createdAt: formData.createdAt,
                startDate: formData.startDate,
                endDate: formData.endDate,
                status: formData.status,
                description: formData.description
            };

            if (!dataToSend.createdAt || !dataToSend.startDate || !dataToSend.endDate) {
                throw new Error('Các trường ngày không được để trống.');
            }

            const response = await axiosInstance.post('/projects', dataToSend);
            setMessage({ type: 'success', content: response.data.message || 'Thêm mới dự án thành công!' });
            navigate('/project-list');
        } catch (error) {
            console.error('Error in handleAdd:', error);
            const errorMessage = error.response?.status === 401
                ? error.response?.data?.message || 'CẢNH BÁO: Bạn không có quyền thêm dự án. Chỉ Giám đốc được phép.'
                : error.response?.data?.message || 'Thêm mới dự án thất bại.';
            setMessage({
                type: 'error',
                content: errorMessage
            });
        } finally {
            setIsLoading(false);
        }
    };

    // Hàm cập nhật dự án
    const handleUpdate = async (dataToSend) => {
        setIsLoading(true);
        try {
            const response = await axiosInstance.put(`/projects/${id}`, dataToSend);
            setMessage({ type: 'success', content: response.data.message || 'Cập nhật dự án thành công!' });
            navigate('/project-list');
        } catch (error) {
            console.error('Error in handleUpdate:', error);
            const errorMessage = error.response?.status === 401
                ? error.response?.data?.message || 'CẢNH BÁO: Bạn không có quyền cập nhật dự án. Chỉ Giám đốc được phép.'
                : error.response?.data?.message || 'Cập nhật dự án thất bại.';
            setMessage({
                type: 'error',
                content: errorMessage
            });
        } finally {
            setIsLoading(false);
        }
    };

    // Hàm xử lý lưu
    const handleSave = async () => {
        if (!isAuthenticated) {
            setMessage({ type: 'error', content: 'Vui lòng đăng nhập để tiếp tục.' });
            navigate('/sign-in');
            return;
        }

        if (!validateForm()) {
            setMessage({ type: 'error', content: 'Vui lòng sửa các lỗi trên form.' });
            return;
        }

        const dataToSend = {
            projectName: formData.projectName,
            createdAt: formData.createdAt,
            startDate: formData.startDate,
            endDate: formData.endDate,
            status: formData.status,
            description: formData.description
        };

        if (mode === 'add') {
            await handleAdd(dataToSend);
        } else if (mode === 'edit') {
            await handleUpdate(dataToSend);
        }
    };

    // Hàm điều hướng
    const handleEdit = () => navigate(`/project-edit/${id}`);
    const handleBack = () => navigate('/project-list');

    // Load dữ liệu ban đầu
    useEffect(() => {
        if (mode === 'add') {
            setMessage({ type: 'info', content: 'Mời nhập thông tin dự án mới. Mã dự án sẽ được tạo tự động.' });

            const today = new Date();
            const formattedToday = formatDate(today);

            setFormData({
                projectID: '',
                projectName: '',
                createdBy: user ? user.UserId : '', // Gán từ user.UserId
                createdAt: formattedToday,
                startDate: '',
                endDate: '',
                status: 'Đang thực hiện',
                description: ''
            });
        } else {
            loadProject();
        }
    }, [mode, id, loadProject, user]);

    return (
        <>
            <title>{mode === 'edit' ? 'Chỉnh sửa dự án' : mode === 'add' ? 'Thêm dự án' : 'Chi tiết dự án'}</title>
            <LayoutMain pageTitle={mode === 'edit' ? 'Chỉnh sửa dự án' : mode === 'add' ? 'Thêm dự án' : 'Chi tiết dự án'}>
                <Breadcrumb />
                <main className="content-area">
                    <div className="form-container">
                        <form id="createProjectForm" onSubmit={(e) => e.preventDefault()}>
                            <div className="form-grid">
                                <div className="row">
                                    {mode !== 'add' && (
                                        <div className="col-6 form-group">
                                            <label className="form-label" htmlFor="projectID">
                                                <i className="ri-clipboard-line"></i>
                                                Mã Dự án <span className="required">*</span>
                                            </label>
                                            <input
                                                type="text"
                                                id="projectID"
                                                name="projectID"
                                                className="form-input"
                                                value={formData.projectID}
                                                readOnly
                                            />
                                            <div className="form-help">
                                                Mã định danh dự án (tự động tạo)
                                            </div>
                                        </div>
                                    )}
                                    <div className="col-6 form-group">
                                        <label className="form-label" htmlFor="projectName">
                                            <i className="ri-user-line"></i>
                                            Tên dự án <span className="required">*</span>
                                        </label>
                                        <input
                                            type="text"
                                            id="projectName"
                                            name="projectName"
                                            className={`form-input ${formErrors.projectName ? 'is-invalid' : ''}`}
                                            value={formData.projectName}
                                            onChange={handleInputChange}
                                            placeholder="Nhập tên dự án..."
                                            required
                                            readOnly={mode === 'view'}
                                        />
                                        {formErrors.projectName && <div className="invalid-feedback d-block">{formErrors.projectName}</div>}
                                        <div className="form-help">
                                            Nhập tên dự án rõ ràng và dễ hiểu
                                        </div>
                                    </div>
                                </div>

                                <div className="row">
                                    <div className="col-6 form-group">
                                        <label className="form-label" htmlFor="createdBy">
                                            <i className="ri-user-line"></i>
                                            Tạo bởi <span className="required">*</span>
                                        </label>
                                        <input
                                            type="text"
                                            id="createdBy"
                                            name="createdBy"
                                            className="form-input"
                                            value={mode === 'add' ? (user ? user.FullName : 'Chưa đăng nhập') : formData.createdBy}
                                            readOnly
                                        />
                                        <div className="form-help">
                                            Người tạo dự án
                                        </div>
                                    </div>

                                    <div className="col-6 form-group">
                                        <label className="form-label" htmlFor="createdAt">
                                            <i className="ri-calendar-line"></i>
                                            Ngày tạo <span className="required">*</span>
                                        </label>
                                        <input
                                            type="date"
                                            id="createdAt"
                                            name="createdAt"
                                            className={`form-input ${formErrors.createdAt ? 'is-invalid' : ''}`}
                                            value={formData.createdAt}
                                            onChange={handleInputChange}
                                            required
                                            readOnly={mode === 'view'}
                                        />
                                        {formErrors.createdAt && <div className="invalid-feedback d-block">{formErrors.createdAt}</div>}
                                        <div className="form-help">
                                            Chọn ngày tạo dự án
                                        </div>
                                    </div>
                                </div>

                                <div className="row">
                                    <div className="col-6 form-group">
                                        <label className="form-label" htmlFor="startDate">
                                            <i className="ri-calendar-line"></i>
                                            Ngày bắt đầu <span className="required">*</span>
                                        </label>
                                        <input
                                            type="date"
                                            id="startDate"
                                            name="startDate"
                                            className={`form-input ${formErrors.startDate ? 'is-invalid' : ''}`}
                                            value={formData.startDate}
                                            onChange={handleInputChange}
                                            required
                                            readOnly={mode === 'view'}
                                        />
                                        {formErrors.startDate && <div className="invalid-feedback d-block">{formErrors.startDate}</div>}
                                        <div className="form-help">
                                            Chọn ngày bắt đầu dự án
                                        </div>
                                    </div>

                                    <div className="col-6 form-group">
                                        <label className="form-label" htmlFor="endDate">
                                            <i className="ri-calendar-line"></i>
                                            Ngày kết thúc <span className="required">*</span>
                                        </label>
                                        <input
                                            type="date"
                                            id="endDate"
                                            name="endDate"
                                            className={`form-input ${formErrors.endDate ? 'is-invalid' : ''}`}
                                            value={formData.endDate}
                                            onChange={handleInputChange}
                                            required
                                            readOnly={mode === 'view'}
                                        />
                                        {formErrors.endDate && <div className="invalid-feedback d-block">{formErrors.endDate}</div>}
                                        <div className="form-help">
                                            Chọn ngày kết thúc dự án
                                        </div>
                                    </div>
                                </div>

                                <div className="row">
                                    <div className="col-6 form-group">
                                        <label className="form-label" htmlFor="status">
                                            <i className="ri-task-line"></i>
                                            Tiến độ <span className="required">*</span>
                                        </label>
                                        <select
                                            id="status"
                                            name="status"
                                            className={`form-select ${formErrors.status ? 'is-invalid' : ''}`}
                                            value={formData.status}
                                            onChange={handleInputChange}
                                            required
                                            disabled={mode === 'view'}
                                        >
                                            <option value="">-- Chọn trạng thái --</option>
                                            <option value="Đã hủy">Đã hủy</option>
                                            <option value="Đang thực hiện">Đang thực hiện</option>
                                            <option value="Hoàn thành">Hoàn thành</option>
                                        </select>
                                        {formErrors.status && <div className="invalid-feedback d-block">{formErrors.status}</div>}
                                        <div className="form-help">
                                            Trạng thái hiện tại của dự án
                                        </div>
                                    </div>
                                </div>

                                <div className="row">
                                    <div className="col-12 form-group">
                                        <label className="form-label" htmlFor="description">
                                            <i className="ri-file-text-line"></i>
                                            Mô tả chi tiết dự án <span className="required">*</span>
                                        </label>
                                        <textarea
                                            id="description"
                                            name="description"
                                            className={`form-textarea ${formErrors.description ? 'is-invalid' : ''}`}
                                            value={formData.description}
                                            onChange={handleInputChange}
                                            placeholder="Mô tả chi tiết về dự án..."
                                            required
                                            readOnly={mode === 'view'}
                                        ></textarea>
                                        {formErrors.description && <div className="invalid-feedback d-block">{formErrors.description}</div>}
                                        <div className="form-help">
                                            Mô tả chi tiết về dự án
                                        </div>
                                    </div>
                                </div>

                                <div className="form-actions">
                                    {mode !== 'view' && (
                                        <button
                                            type="button"
                                            className="btn btn-primary"
                                            onClick={handleSave}
                                            disabled={isLoading || !isAuthenticated || isStaff}
                                        >
                                            {isLoading ? <i className="spinner-border spinner-border-sm me-1" /> : <i className="ri-save-line me-1" />}
                                            {mode === 'add' ? 'Thêm dự án' : 'Lưu thay đổi'}
                                        </button>
                                    )}
                                    {mode === 'view' && (
                                        <button
                                            type="button"
                                            className="btn btn-primary"
                                            onClick={handleEdit}
                                            disabled={isStaff || isManager}
                                        >
                                            <i className="ri-edit-fill me-1" />
                                            Chỉnh sửa
                                        </button>
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
                                {isStaff &&  (
                                    <small className="text-end text-danger d-block mt-2">
                                        Bạn không có quyền chỉnh sửa.Chỉ Giám đốc được phép.
                                    </small>
                                )}
                                {isManager && (
                                    <small className="text-end text-danger d-block mt-2">
                                        Bạn không có quyền chỉnh sửa.Chỉ Giám đốc được phép.
                                    </small>
                                )}
                                <MessageBox
                                    type={message.type}
                                    message={message.content}
                                />
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