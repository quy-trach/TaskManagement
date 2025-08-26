import PropTypes from 'prop-types';

const ActionMenu = ({
    isActive,
    onEdit,
    onView,
    onActivate,
    onDeactivate,
    onDelete
}) => {
    return (
        <div className="dropdown dropdown-action">
            <a
                href="#"
                className="btn btn-soft-primary btn-sm dropdown"
                data-bs-toggle="dropdown"
                aria-expanded="false"
            >
                <i class="ri-list-ordered-2"></i>
            </a>
            <ul className="dropdown-menu dropdown-menu-end">
                <li>
                    <a
                        href="#"
                        className="dropdown-item view-item-btn text-primary"
                        onClick={onView}
                    >
                        <i className="ri-eye-fill fs-16" />
                        Xem chi tiết
                    </a>
                </li>
                <li>
                    <a
                        href="#"
                        className="dropdown-item edit-item-btn text-warning"
                        onClick={onEdit}
                    >
                        <i className="ri-edit-fill fs-16" />
                        Chỉnh sửa
                    </a>
                </li>
                <li>
                    {!isActive && (
                        <a
                            href="#"
                            className="dropdown-item text-success"
                            onClick={onActivate}
                        >
                            <i className="ri-lock-unlock-fill fs-16" />
                           Hoạt động
                        </a>
                    )}
                </li>
                <li>
                    {isActive && (
                        <a
                            href="#"
                            className="dropdown-item text-body-tertiary"
                            onClick={onDeactivate}
                        >
                            <i className="ri-lock-fill fs-16" />
                            Ngừng hoạt động
                        </a>
                    )}
                </li>
                <li>
                    <a
                        href="#"
                        className="dropdown-item remove-item-btn text-danger"
                        onClick={onDelete}
                    >
                        <i className="ri-delete-bin-5-fill fs-16" />
                        Xóa bỏ
                    </a>
                </li>
            </ul>
        </div>
    );
};

// Định nghĩa propTypes
ActionMenu.propTypes = {
    isActive: PropTypes.bool.isRequired, // Trạng thái tài khoản (bắt buộc cần có để xử lý link trạng thái)
    onEdit: PropTypes.func,
    onView: PropTypes.func,
    onActivate: PropTypes.func,
    onDeactivate: PropTypes.func,
    onDelete: PropTypes.func,
};

export default ActionMenu;
