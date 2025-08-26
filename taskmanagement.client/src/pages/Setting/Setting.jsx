import React from 'react';
import Breadcrumb from '../../components/Breadcrumb';
import MessageBox from '../../components/MessageBox';
import LayoutMain from '../../layouts/LayoutMain';

const Setting = () => {
    return (
        <>
            <title>Quản lý dự án</title>
            <LayoutMain pageTitle="Cài đặt">
                <Breadcrumb />
                <main className="setting-content">
                    {/* Settings Page */}
                    <div className="settings-page">
                        <div className="settings-grid">
                            {/* Thông tin tài khoản */}
                            <div className="settings-section">
                                <div className="section-header">
                                    <h3 className="section-title">
                                        <i className="ri-user-line"></i>
                                        Thông tin tài khoản
                                    </h3>
                                </div>
                                <div className="section-content">
                                    <form id="account-form">
                                        <div className="form-row">
                                            <div className="form-group">
                                                <label className="form-label">Tên hiển thị</label>
                                                <input type="text" className="form-control" defaultValue="Nguyễn Văn A" required />
                                            </div>
                                            <div className="form-group">
                                                <label className="form-label">Số điện thoại</label>
                                                <input type="tel" className="form-control" defaultValue="0123456789" />
                                            </div>
                                        </div>
                                        <div className="form-group">
                                            <label className="form-label">Email</label>
                                            <input type="email" className="form-control" defaultValue="nguyenvana@email.com" required />
                                        </div>
                                        <div className="form-group">
                                            <label className="form-label">Chức vụ</label>
                                            <input type="text" className="form-control" defaultValue="Trưởng phòng IT" readOnly />
                                        </div>
                                        <div className="form-group">
                                            <label className="form-label">Ảnh đại diện</label>
                                            <div className="file-upload">
                                                <input type="file" accept="image/*" id="avatar-upload" />
                                                <div className="file-upload-label">
                                                    <i className="ri-upload-line"></i>
                                                    <span>Chọn ảnh mới</span>
                                                </div>
                                            </div>
                                        </div>
                                        <button type="submit" className="btn btn-primary">
                                            <i className="ri-save-line"></i> Lưu thông tin
                                        </button>
                                    </form>
                                </div>
                                {/* Message Box */}
                                <MessageBox />
                            </div>

                            {/* Đổi mật khẩu */}
                            <div className="settings-section">
                                <div className="section-header">
                                    <h3 className="section-title">
                                        <i className="ri-lock-line"></i>
                                        Bảo mật
                                    </h3>
                                </div>
                                <div className="section-content">
                                    <form id="password-form">
                                        <div className="form-group">
                                            <label className="form-label">Mật khẩu hiện tại</label>
                                            <input type="password" className="form-control" placeholder="Nhập mật khẩu hiện tại" required />
                                        </div>
                                        <div className="form-row">
                                            <div className="form-group">
                                                <label className="form-label">Mật khẩu mới</label>
                                                <input type="password" className="form-control" placeholder="Nhập mật khẩu mới" required />
                                            </div>
                                            <div className="form-group">
                                                <label className="form-label">Xác nhận mật khẩu</label>
                                                <input type="password" className="form-control" placeholder="Nhập lại mật khẩu mới" required />
                                            </div>
                                        </div>
                                        <div className="settings-item">
                                            <div className="settings-item-info">
                                                <h4>Xác thực 2 bước</h4>
                                                <p>Tăng cường bảo mật cho tài khoản của bạn</p>
                                            </div>
                                            <label className="toggle-switch">
                                                <input type="checkbox" id="two-factor" />
                                                <span className="slider"></span>
                                            </label>
                                        </div>
                                        <button type="submit" className="btn btn-primary mt-2">
                                            <i className="ri-shield-line"></i> Cập nhật mật khẩu
                                        </button>
                                    </form>
                                </div>
                                {/* Message Box */}
                                <MessageBox />
                            </div>

                            {/* Cài đặt thông báo */}
                            <div className="settings-section">
                                <div className="section-header">
                                    <h3 className="section-title">
                                        <i className="ri-notification-line"></i>
                                        Thông báo
                                    </h3>
                                </div>
                                <div className="section-content">
                                    <div className="settings-item">
                                        <div className="settings-item-info">
                                            <h4>Thông báo email</h4>
                                            <p>Nhận thông báo qua email khi có công việc mới</p>
                                        </div>
                                        <label className="toggle-switch">
                                            <input type="checkbox" id="email-notifications" defaultChecked />
                                            <span className="slider"></span>
                                        </label>
                                    </div>
                                    <div className="settings-item">
                                        <div className="settings-item-info">
                                            <h4>Thông báo đẩy</h4>
                                            <p>Nhận thông báo đẩy trên trình duyệt</p>
                                        </div>
                                        <label className="toggle-switch">
                                            <input type="checkbox" id="push-notifications" defaultChecked />
                                            <span className="slider"></span>
                                        </label>
                                    </div>
                                    <div className="settings-item">
                                        <div className="settings-item-info">
                                            <h4>Nhắc nhở deadline</h4>
                                            <p>Nhận thông báo trước khi công việc đến hạn</p>
                                        </div>
                                        <select className="form-control" style={{ width: '150px' }}>
                                            <option value="1">1 ngày trước</option>
                                            <option value="2" selected>2 ngày trước</option>
                                            <option value="3">3 ngày trước</option>
                                            <option value="7">1 tuần trước</option>
                                        </select>
                                    </div>
                                    <div className="settings-item">
                                        <div className="settings-item-info">
                                            <h4>Báo cáo tuần</h4>
                                            <p>Nhận báo cáo tổng kết công việc hàng tuần</p>
                                        </div>
                                        <label className="toggle-switch">
                                            <input type="checkbox" id="weekly-report" />
                                            <span className="slider"></span>
                                        </label>
                                    </div>
                                </div>
                            </div>

                            {/* Giao diện */}
                            <div className="settings-section">
                                <div className="section-header">
                                    <h3 className="section-title">
                                        <i className="ri-palette-line"></i>
                                        Giao diện
                                    </h3>
                                </div>
                                <div className="section-content">
                                    <div className="settings-item">
                                        <div className="settings-item-info">
                                            <h4>Chế độ tối</h4>
                                            <p>Chuyển sang giao diện tối để bảo vệ mắt</p>
                                        </div>
                                        <label className="toggle-switch">
                                            <input type="checkbox" id="dark-mode" />
                                            <span className="slider"></span>
                                        </label>
                                    </div>
                                    <div className="form-group">
                                        <label className="form-label">Màu chủ đạo</label>
                                        <div className="color-picker">
                                            <div className="color-option selected" style={{ background: '#007BFF' }} data-color="#007BFF"></div>
                                            <div className="color-option" style={{ background: '#28a745' }} data-color="#28a745"></div>
                                            <div className="color-option" style={{ background: '#dc3545' }} data-color="#dc3545"></div>
                                            <div className="color-option" style={{ background: '#ffc107' }} data-color="#ffc107"></div>
                                            <div className="color-option" style={{ background: '#6f42c1' }} data-color="#6f42c1"></div>
                                            <div className="color-option" style={{ background: '#fd7e14' }} data-color="#fd7e14"></div>
                                        </div>
                                    </div>
                                    <div className="form-group">
                                        <label className="form-label">Ngôn ngữ</label>
                                        <select className="form-control">
                                            <option value="vi" selected>Tiếng Việt</option>
                                            <option value="en">English</option>
                                            <option value="ja">日本語</option>
                                            <option value="ko">한국어</option>
                                        </select>
                                    </div>
                                </div>
                            </div>

                            {/* Cài đặt hệ thống */}
                            <div className="settings-section">
                                <div className="section-header">
                                    <h3 className="section-title">
                                        <i className="ri-settings-line"></i>
                                        Hệ thống
                                    </h3>
                                </div>
                                <div className="section-content">
                                    <div className="settings-item">
                                        <div className="settings-item-info">
                                            <h4>Tự động lưu</h4>
                                            <p>Tự động lưu thay đổi khi chỉnh sửa</p>
                                        </div>
                                        <label className="toggle-switch">
                                            <input type="checkbox" id="auto-save" defaultChecked />
                                            <span className="slider"></span>
                                        </label>
                                    </div>
                                    <div className="form-group">
                                        <label className="form-label">Múi giờ</label>
                                        <select className="form-control">
                                            <option value="Asia/Ho_Chi_Minh" selected>Việt Nam (GMT+7)</option>
                                            <option value="Asia/Tokyo">Tokyo (GMT+9)</option>
                                            <option value="America/New_York">New York (GMT-5)</option>
                                            <option value="Europe/London">London (GMT+0)</option>
                                        </select>
                                    </div>
                                    <div className="form-group">
                                        <label className="form-label">Định dạng ngày</label>
                                        <select className="form-control">
                                            <option value="dd/mm/yyyy" selected>DD/MM/YYYY</option>
                                            <option value="mm/dd/yyyy">MM/DD/YYYY</option>
                                            <option value="yyyy-mm-dd">YYYY-MM-DD</option>
                                        </select>
                                    </div>
                                    <div className="settings-item">
                                        <div className="settings-item-info">
                                            <h4>Sao lưu dữ liệu</h4>
                                            <p>Sao lưu dữ liệu định kỳ hàng ngày</p>
                                        </div>
                                        <button className="btn btn-secondary">
                                            <i className="ri-download-line"></i> Tải xuống
                                        </button>
                                    </div>
                                </div>
                            </div>

                            {/* Về chúng tôi */}
                            <div className="settings-section">
                                <div className="section-header">
                                    <h3 className="section-title">
                                        <i className="ri-information-line"></i>
                                        Thông tin ứng dụng
                                    </h3>
                                </div>
                                <div className="section-content">
                                    <div className="settings-item">
                                        <div className="settings-item-info">
                                            <h4>Phiên bản</h4>
                                            <p>TaskPro v2.1.0</p>
                                        </div>
                                        <button className="btn btn-secondary">
                                            <i className="ri-refresh-line"></i> Kiểm tra cập nhật
                                        </button>
                                    </div>
                                    <div className="settings-item">
                                        <div className="settings-item-info">
                                            <h4>Hỗ trợ</h4>
                                            <p>Liên hệ với đội ngũ hỗ trợ</p>
                                        </div>
                                        <button className="btn btn-primary">
                                            <i className="ri-headphone-line"></i> Liên hệ
                                        </button>
                                    </div>
                                    <div className="settings-item">
                                        <div className="settings-item-info">
                                            <h4>Điều khoản sử dụng</h4>
                                            <p>Xem điều khoản và chính sách bảo mật</p>
                                        </div>
                                        <button className="btn btn-secondary">
                                            <i className="ri-file-text-line"></i> Xem chi tiết
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

export default Setting;