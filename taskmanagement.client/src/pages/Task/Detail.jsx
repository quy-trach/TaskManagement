import React, { useState, useEffect, useCallback, useMemo } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import PropTypes from 'prop-types';
import { useAuth } from '../../context/AuthContext';
import Breadcrumb from '../../components/Breadcrumb';
import MessageBox from '../../components/MessageBox/MessageBox';
import LayoutMain from '../../layouts/LayoutMain';
import axiosInstance from '../../api/axiosConfig';

const Detail = ({ mode }) => {
    const { id } = useParams();
    const navigate = useNavigate();
    const { user, token } = useAuth();

    const [allUsers, setAllUsers] = useState([]);
    const [departments, setDepartments] = useState([]);
    const [projects, setProjects] = useState([]);
    const [taskStatuses, setTaskStatuses] = useState([]);
    const [isLoading, setIsLoading] = useState(false);
    const [message, setMessage] = useState({ type: 'info', content: 'Mời nhập thông tin công việc' });
    const [formErrors, setFormErrors] = useState({});
    const [showWarningModal, setShowWarningModal] = useState(false);
    const [warningMessage, setWarningMessage] = useState('');

    const [formData, setFormData] = useState({
        taskID: '',
        title: '',
        description: '',
        departmentID: '',
        projectID: '',
        startDate: '',
        endDate: '',
        priority: 'Trung bình',
        statusID: '',
        assigneeID: '',
        createdAt: ''
    });

    const isStaff= user?.roleName === 'Nhân viên';
    const isRestricted = mode === 'edit' && isStaff;

    const formatDate = (dateInput) => {
        if (!dateInput) return '';
        if (dateInput instanceof Date) return dateInput.toISOString().split('T')[0];
        if (typeof dateInput === 'string') {
            if (/^\d{4}-\d{2}-\d{2}$/.test(dateInput)) return dateInput;
            if (/^\d{2}\/\d{2}\/\d{4}/.test(dateInput)) {
                const [datePart] = dateInput.split(' ');
                const [day, month, year] = datePart.split('/');
                return `${year}-${month.padStart(2, '0')}-${day.padStart(2, '0')}`;
            }
            const date = new Date(dateInput);
            if (!isNaN(date)) return date.toISOString().split('T')[0];
        }
        return '';
    };

    useEffect(() => {
        const fetchInitialData = async () => {
            if (!token) {
                setMessage({ type: 'error', content: 'Vui lòng đăng nhập lại' });
                navigate('/login');
                return;
            }

            setIsLoading(true);
            try {
                const responses = await Promise.allSettled([
                    axiosInstance.get('/users/all'),
                    axiosInstance.get('/users/departments'),
                    axiosInstance.get('/projects/options'),
                    axiosInstance.get('/tasks/statuses')
                ]);

                if (responses[0].status === 'fulfilled' && responses[0].value.data.success) {
                    setAllUsers(responses[0].value.data.data || []);
                } else {
                    console.error('Failed to load users:', responses[0].reason || responses[0].value?.data?.message);
                    setAllUsers([]);
                }

                if (responses[1].status === 'fulfilled' && responses[1].value.data.success) {
                    setDepartments(responses[1].value.data.data || []);
                } else {
                    console.error('Failed to load departments:', responses[1].reason || responses[1].value?.data?.message);
                    setDepartments([]);
                }

                if (responses[2].status === 'fulfilled' && responses[2].value.data.success) {
                    setProjects(responses[2].value.data.data || []);
                } else {
                    console.error('Failed to load projects:', responses[2].reason || responses[2].value?.data?.message);
                    setProjects([]);
                }

                if (responses[3].status === 'fulfilled' && responses[3].value.data.success) {
                    setTaskStatuses(responses[3].value.data.data || []);
                } else {
                    console.error('Failed to load task statuses:', responses[3].reason || responses[3].value?.data?.message);
                    setTaskStatuses([]);
                }
            } catch (error) {
                console.error('Error loading initial data:', error);
                setMessage({ type: 'error', content: `Không thể tải dữ liệu cần thiết: ${error.message}` });
            } finally {
                setIsLoading(false);
            }
        };

        fetchInitialData();
    }, [token, navigate]);

    const availableAssignees = useMemo(() => {
        let filteredUsers = allUsers.filter(user => user.role?.roleName === 'Nhân viên');
        if (formData.departmentID) {
            filteredUsers = filteredUsers.filter(user =>
                user.department?.departmentID === Number(formData.departmentID)
            );
        }
        return filteredUsers;
    }, [allUsers, formData.departmentID]);

    const loadTask = useCallback(async () => {
        if (!id || mode === 'add') return;
        if (!token) {
            setMessage({ type: 'error', content: 'Vui lòng đăng nhập lại' });
            navigate('/login');
            return;
        }

        setIsLoading(true);
        try {
            const response = await axiosInstance.get(`/tasks/${id}`);
            const result = response.data;

            if (result.success) {
                const taskData = result.data;
                setFormData({
                    taskID: taskData.taskID || '',
                    title: taskData.title || '',
                    description: taskData.description || '',
                    departmentID: taskData.departmentID?.toString() || '',
                    projectID: taskData.projectID?.toString() || '',
                    startDate: formatDate(taskData.startDate),
                    endDate: formatDate(taskData.endDate),
                    priority: taskData.priority || 'Trung bình',
                    statusID: taskData.statusID?.toString() || '',
                    assigneeID: taskData.assignees && taskData.assignees.length > 0
                        ? taskData.assignees[0].userID?.toString() || ''
                        : '',
                    createdAt: formatDate(taskData.createdAt)
                });
                setMessage({ type: 'success', content: 'Tải thông tin công việc thành công' });
            } else {
                setMessage({ type: 'error', content: result.message || 'Không tìm thấy công việc.' });
            }
        } catch (error) {
            console.error('Error loading task:', error);
            setMessage({ type: 'error', content: `Lỗi khi tải thông tin công việc: ${error.response?.data?.message || error.message}` });
        } finally {
            setIsLoading(false);
        }
    }, [id, mode, token, navigate]);

    useEffect(() => {
        if (mode === 'add') {
            if (isStaff) {
                setWarningMessage('Bạn không có quyền thêm công việc mới.');
                setShowWarningModal(true);
                setTimeout(() => navigate('/task-list'), 1500);
                return;
            }
            setMessage({ type: 'info', content: 'Mời nhập thông tin công việc mới.' });
            setFormData({
                taskID: '',
                title: '',
                description: '',
                departmentID: '',
                projectID: '',
                startDate: '',
                endDate: '',
                priority: 'Trung bình',
                statusID: '',
                assigneeID: '',
                createdAt: formatDate(new Date())
            });
        } else {
            loadTask();
        }
    }, [mode, id, loadTask, navigate, isStaff]);

    const handleInputChange = (e) => {
        const { name, value } = e.target;
        if (isStaff && name !== 'statusID') {
            setWarningMessage('Bạn chỉ có quyền cập nhật trạng thái công việc.');
            setShowWarningModal(true);
            return;
        }
        setFormData(prev => ({ ...prev, [name]: value }));

        if (name === 'departmentID') {
            setFormData(prev => ({ ...prev, assigneeID: '' }));
        }

        if (formErrors[name]) {
            setFormErrors(prev => ({ ...prev, [name]: '' }));
        }
    };

    const validateForm = () => {
        const errors = {};

        // Trạng thái luôn bắt buộc cho tất cả role
        if (!formData.statusID) {
            errors.statusID = 'Vui lòng chọn trạng thái.';
        }

        // Chỉ validate các field khác nếu KHÔNG phải nhân viên
        if (!isStaff) {
            if (!formData.title?.trim()) {
                errors.title = 'Tên công việc không được để trống.';
            }
            if (!formData.departmentID) {
                errors.departmentID = 'Vui lòng chọn phòng ban.';
            }
            if (!formData.startDate) {
                errors.startDate = 'Ngày bắt đầu không được để trống.';
            } else if (isNaN(new Date(formData.startDate))) {
                errors.startDate = 'Ngày bắt đầu không hợp lệ.';
            }
            if (!formData.endDate) {
                errors.endDate = 'Ngày kết thúc không được để trống.';
            } else if (isNaN(new Date(formData.endDate))) {
                errors.endDate = 'Ngày kết thúc không hợp lệ.';
            } else if (formData.startDate && formData.endDate < formData.startDate) {
                errors.endDate = 'Ngày kết thúc phải sau ngày bắt đầu.';
            }
            if (!formData.assigneeID) {
                errors.assigneeID = 'Vui lòng chọn người phụ trách.';
            }
        }

        setFormErrors(errors);
        return Object.keys(errors).length === 0;
    };

    const handleSave = async () => {
        if (!token) {
            setMessage({ type: 'error', content: 'Vui lòng đăng nhập để thực hiện thao tác này.' });
            navigate('/login');
            return;
        }

        if (mode === 'add' && isStaff) {
            setWarningMessage('Bạn không có quyền thêm công việc mới.');
            setShowWarningModal(true);
            return;
        }

        if (!validateForm()) {
            setMessage({ type: 'error', content: 'Vui lòng sửa các lỗi trên form.' });
            return;
        }

        setIsLoading(true);
        try {
            let dataToSend;

            if (isStaff) {
                // Nhân viên chỉ gửi statusID
                dataToSend = {
                    statusID: Number(formData.statusID)
                };
            } else {
                // Các role khác gửi đầy đủ dữ liệu
                dataToSend = {
                    title: formData.title.trim(),
                    description: formData.description?.trim() || '',
                    departmentID: formData.departmentID ? Number(formData.departmentID) : null,
                    projectID: formData.projectID ? Number(formData.projectID) : null,
                    startDate: formData.startDate ? new Date(formData.startDate).toISOString() : null,
                    endDate: formData.endDate ? new Date(formData.endDate).toISOString() : null,
                    priority: formData.priority,
                    statusID: formData.statusID ? Number(formData.statusID) : null,
                    assignedUserIDs: formData.assigneeID ? [Number(formData.assigneeID)] : []
                };
            }

            console.log('Data to send:', dataToSend); // Debug log

            let response;
            if (mode === 'add') {
                response = await axiosInstance.post('/tasks', dataToSend);
            } else {
                response = await axiosInstance.put(`/tasks/${id}`, dataToSend);
            }

            const result = response.data;
            if (result.success) {
                const successMessage = isStaff ?
                    'Cập nhật trạng thái công việc thành công!' :
                    `${mode === 'add' ? 'Thêm' : 'Cập nhật'} công việc thành công!`;

                setMessage({
                    type: 'success',
                    content: successMessage
                });
                setTimeout(() => navigate('/task-list'), 1500);
            } else {
                throw new Error(result.message || result.data?.join(', ') || 'Có lỗi xảy ra');
            }
        } catch (error) {
            console.error('Error in handleSave:', error);
            const errorMessage = error.response?.data?.message ||
                error.response?.data?.data?.join(', ') ||
                error.message ||
                `Lỗi khi ${mode === 'add' ? 'thêm' : 'cập nhật'} công việc.`;
            setMessage({ type: 'error', content: errorMessage });
        } finally {
            setIsLoading(false);
        }
    };

    const handleEdit = () => {
        if (isStaff) {
            setWarningMessage('Bạn không có quyền chỉnh sửa toàn bộ thông tin công việc.');
            setShowWarningModal(true);
            return;
        }
        navigate(`/task-edit/${id}`);
    };

    return (
        <>
            <title>{mode === 'edit' ? 'Chỉnh sửa' : mode === 'add' ? 'Thêm' : 'Chi tiết'} công việc</title>
            <LayoutMain pageTitle={`${mode === 'edit' ? 'Chỉnh sửa' : mode === 'add' ? 'Thêm' : 'Chi tiết'} công việc`}>
                <Breadcrumb />
                <main className="content-area">
                    <div className="form-container">
                        <form id="taskForm" onSubmit={(e) => e.preventDefault()}>
                            <div className="form-grid">
                                <div className="row">
                                    <div className="col-6 form-group">
                                        <label className="form-label" htmlFor="title">
                                            Tên công việc <span className="required">*</span>
                                        </label>
                                        <input
                                            type="text"
                                            id="title"
                                            name="title"
                                            className={`form-input ${formErrors.title ? 'is-invalid' : ''}`}
                                            value={formData.title}
                                            onChange={handleInputChange}
                                            readOnly={mode === 'view' || isRestricted}
                                            placeholder="Nhập tên công việc..."
                                        />
                                        {formErrors.title && <div className="invalid-feedback d-block">{formErrors.title}</div>}
                                    </div>
                                    <div className="col-6 form-group">
                                        <label className="form-label" htmlFor="departmentID">
                                            Phòng ban <span className="required">*</span>
                                        </label>
                                        <select
                                            id="departmentID"
                                            name="departmentID"
                                            className={`form-select ${formErrors.departmentID ? 'is-invalid' : ''}`}
                                            value={formData.departmentID}
                                            onChange={handleInputChange}
                                            disabled={mode === 'view' || isRestricted}
                                            required
                                        >
                                            <option value="">-- Chọn phòng ban --</option>
                                            {departments.map(dept => (
                                                <option key={dept.departmentID} value={dept.departmentID}>
                                                    {dept.departmentName}
                                                </option>
                                            ))}
                                        </select>
                                        {formErrors.departmentID && <div className="invalid-feedback d-block">{formErrors.departmentID}</div>}
                                    </div>
                                </div>

                                <div className="row">
                                    <div className="col-6 form-group">
                                        <label className="form-label" htmlFor="assigneeID">
                                            Người phụ trách <span className="required">*</span>
                                        </label>
                                        <select
                                            id="assigneeID"
                                            name="assigneeID"
                                            className={`form-select ${formErrors.assigneeID ? 'is-invalid' : ''}`}
                                            value={formData.assigneeID}
                                            onChange={handleInputChange}
                                            disabled={mode === 'view' || !formData.departmentID || isRestricted}
                                            required
                                        >
                                            <option value="">-- Chọn người phụ trách --</option>
                                            {availableAssignees.map(user => (
                                                <option key={user.userID} value={user.userID}>
                                                    {user.fullName}
                                                </option>
                                            ))}
                                        </select>
                                        {!formData.departmentID && <div className="form-help">Vui lòng chọn phòng ban trước.</div>}
                                        {formErrors.assigneeID && <div className="invalid-feedback d-block">{formErrors.assigneeID}</div>}
                                    </div>
                                    <div className="col-6 form-group">
                                        <label className="form-label" htmlFor="priority">Mức độ ưu tiên</label>
                                        <select
                                            id="priority"
                                            name="priority"
                                            className="form-select"
                                            value={formData.priority}
                                            onChange={handleInputChange}
                                            disabled={mode === 'view' || isRestricted}
                                        >
                                            <option value="Thấp">Thấp</option>
                                            <option value="Trung bình">Trung bình</option>
                                            <option value="Cao">Cao</option>
                                            <option value="Khẩn cấp">Khẩn cấp</option>
                                        </select>
                                    </div>
                                </div>

                                <div className="row">
                                    <div className="col-6 form-group">
                                        <label className="form-label" htmlFor="startDate">
                                            Ngày bắt đầu <span className="required">*</span>
                                        </label>
                                        <input
                                            type="date"
                                            id="startDate"
                                            name="startDate"
                                            className={`form-input ${formErrors.startDate ? 'is-invalid' : ''}`}
                                            value={formData.startDate}
                                            onChange={handleInputChange}
                                            readOnly={mode === 'view' || isRestricted}
                                        />
                                        {formErrors.startDate && <div className="invalid-feedback d-block">{formErrors.startDate}</div>}
                                    </div>
                                    <div className="col-6 form-group">
                                        <label className="form-label" htmlFor="endDate">
                                            Ngày kết thúc <span className="required">*</span>
                                        </label>
                                        <input
                                            type="date"
                                            id="endDate"
                                            name="endDate"
                                            className={`form-input ${formErrors.endDate ? 'is-invalid' : ''}`}
                                            value={formData.endDate}
                                            onChange={handleInputChange}
                                            readOnly={mode === 'view' || isRestricted}
                                        />
                                        {formErrors.endDate && <div className="invalid-feedback d-block">{formErrors.endDate}</div>}
                                    </div>
                                </div>

                                <div className="row">
                                    <div className="col-6 form-group">
                                        <label className="form-label" htmlFor="projectID">Dự án</label>
                                        <select
                                            id="projectID"
                                            name="projectID"
                                            className="form-select"
                                            value={formData.projectID}
                                            onChange={handleInputChange}
                                            disabled={mode === 'view' || isRestricted}
                                        >
                                            <option value="">-- Chọn dự án (tùy chọn) --</option>
                                            {projects.map(proj => (
                                                <option key={proj.value} value={proj.value}>
                                                    {proj.text}
                                                </option>
                                            ))}
                                        </select>
                                    </div>
                                    <div className="col-6 form-group">
                                        <label className="form-label" htmlFor="statusID">
                                            Trạng thái <span className="required">*</span>
                                        </label>
                                        <select
                                            id="statusID"
                                            name="statusID"
                                            className={`form-select ${formErrors.statusID ? 'is-invalid' : ''}`}
                                            value={formData.statusID}
                                            onChange={handleInputChange}
                                            disabled={mode === 'view'}
                                            required
                                        >
                                            <option value="">-- Chọn trạng thái --</option>
                                            {taskStatuses.map(status => (
                                                <option
                                                    key={status.statusID || status.value}
                                                    value={status.statusID || status.value}
                                                >
                                                    {status.statusName || status.text}
                                                </option>
                                            ))}
                                        </select>
                                        {formErrors.statusID && <div className="invalid-feedback d-block">{formErrors.statusID}</div>}
                                    </div>
                                </div>

                                <div className="row">
                                    <div className="col-12 form-group">
                                        <label className="form-label" htmlFor="description">Mô tả công việc</label>
                                        <textarea
                                            id="description"
                                            name="description"
                                            className="form-textarea"
                                            value={formData.description}
                                            onChange={handleInputChange}
                                            readOnly={mode === 'view' || isRestricted}
                                            placeholder="Mô tả chi tiết về công việc..."
                                            rows="4"
                                        />
                                    </div>
                                </div>
                            </div>

                            <div className="form-actions">
                                {mode !== 'view' && (
                                    <button
                                        type="button"
                                        className="btn btn-primary"
                                        onClick={handleSave}
                                        disabled={isLoading}
                                    >
                                        {isLoading ? (
                                            <i className="spinner-border spinner-border-sm me-1" />
                                        ) : (
                                            <i className="ri-save-line me-1" />
                                        )}
                                        {mode === 'add' ? 'Tạo công việc' : isStaff ? 'Cập nhật trạng thái' : 'Lưu thay đổi'}
                                    </button>
                                )}

                                {mode === 'view' && !isStaff && (
                                    <button type="button" className="btn btn-primary" onClick={handleEdit}>
                                        <i className="ri-edit-fill me-1" /> Chỉnh sửa
                                    </button>
                                )}

                                <button type="button" className="btn btn-secondary" onClick={() => navigate('/task-list')}>
                                    <i className="ri-arrow-go-back-line me-1" /> Trở về
                                </button>
                            </div>
                            {isStaff && (
                                <small className="text-end text-danger d-block mt-2">
                                    Bạn chỉ được phép cập nhật tiến độ công việc, không thể chỉnh sửa thông tin khác.
                                </small>
                            )}
                            <MessageBox type={message.type} message={message.content} />

                            {showWarningModal && (
                                <div className="modal fade show d-block" tabIndex="-1" role="dialog">
                                    <div className="modal-dialog" role="document">
                                        <div className="modal-content">
                                            <div className="modal-header">
                                                <h5 className="modal-title">Cảnh báo</h5>
                                                <button
                                                    type="button"
                                                    className="btn-close"
                                                    onClick={() => setShowWarningModal(false)}
                                                ></button>
                                            </div>
                                            <div className="modal-body">
                                                <p>{warningMessage}</p>
                                            </div>
                                            <div className="modal-footer">
                                                <button
                                                    type="button"
                                                    className="btn btn-secondary"
                                                    onClick={() => setShowWarningModal(false)}
                                                >
                                                    Đóng
                                                </button>
                                            </div>
                                        </div>
                                    </div>
                                </div>
                            )}
                            {showWarningModal && <div className="modal-backdrop fade show"></div>}
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