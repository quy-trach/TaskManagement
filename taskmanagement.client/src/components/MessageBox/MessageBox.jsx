import React, { useState } from 'react';
import PropTypes from 'prop-types';

const MessageBox = ({ type, message }) => {
    // State để quản lý hiển thị alert
    const [isVisible, setIsVisible] = useState(true);

    // Nếu không có message hoặc không hiển thị, trả về null
    if (!isVisible || !message) return null;

    // Lấy class cho alert dựa trên type
    const getAlertClass = () => {
        switch (type) {
            case 'success':
                return 'alert-success';
            case 'error':
                return 'alert-danger';
            case 'warning':
                return 'alert-warning';
            default:
                return 'alert-primary';
        }
    };

    // Lấy class cho icon dựa trên type
    const getIconClass = () => {
        switch (type) {
            case 'success':
                return 'ri-check-line';
            case 'error':
                return 'ri-alert-line';
            case 'warning':
                return 'ri-alert-line';
            default:
                return 'ri-information-line';
        }
    };

    return (
        <div className="message-box mt-2">
            <div className={`alert ${getAlertClass()} alert-dismissible fade show`} role="alert">
                <div className="ms-1">
                    <i className={getIconClass()}></i>
                    <span>{message}</span>
                </div>
                <button
                    type="button"
                    className="btn-close"
                    data-bs-dismiss="alert"
                    aria-label="Close"
                    onClick={() => setIsVisible(false)}
                ></button>
            </div>
        </div>
    );
};

// Định nghĩa propTypes
MessageBox.propTypes = {
    type: PropTypes.oneOf(['success', 'error', 'warning', 'primary']),
    message: PropTypes.string,
};

// Giá trị mặc định
MessageBox.defaultProps = {
    type: 'primary',
    message: '',
};

export default MessageBox;