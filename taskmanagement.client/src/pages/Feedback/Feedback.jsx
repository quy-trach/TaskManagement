// src/pages/Feedback/FeedbackPage.jsx
import React from 'react';
import Breadcrumb from '../../components/Breadcrumb';
import LayoutMain from '../../layouts/LayoutMain';

const Feedback = () => {
    return (
        <LayoutMain pageTitle="Phản hồi & Báo cáo">
            <Breadcrumb />
            {/* Class "feedback-page" được thêm vào để tuân thủ quy tắc chung */}
            <div className="feedback-page">
                <div className="feedback-container">
                    {/* CỘT 1: DANH SÁCH PHẢN HỒI */}
                    <aside className="feedback-sidebar">
                        <div className="sidebar-header">
                            <div className="search-bar">
                                <i className="ri-search-line"></i>
                                <input type="text" placeholder="Tìm kiếm phản hồi..." />
                            </div>
                            <button className="new-feedback-btn" title="Tạo phản hồi mới">
                                <i className="ri-add-line"></i>
                            </button>
                        </div>

                        <div className="feedback-list">
                            {/* Mục phản hồi 1 (Đang được chọn) */}
                            <div className="feedback-item active">
                                <div className="item-avatar">
                                    <img src="https://i.pravatar.cc/150?u=user1" alt="User Avatar" />
                                    <span className="status-dot online"></span>
                                </div>
                                <div className="item-content">
                                    <div className="item-header">
                                        <span className="item-user">Nguyễn Thị Hoa</span>
                                        <span className="item-time">10:30 AM</span>
                                    </div>
                                    <div className="item-body">
                                        <p className="item-subject">Thắc mắc về tính năng báo cáo</p>
                                        <p className="item-preview">Em cần hỗ trợ về cách tạo báo cáo tự động...</p>
                                    </div>
                                </div>
                                <div className="item-status">
                                    <span className="unread-count">1</span>
                                </div>
                            </div>

                            {/* Mục phản hồi 2 */}
                            <div className="feedback-item">
                                <div className="item-avatar">
                                    <img src="https://i.pravatar.cc/150?u=user2" alt="User Avatar" />
                                </div>
                                <div className="item-content">
                                    <div className="item-header">
                                        <span className="item-user">Lê Văn Tùng</span>
                                        <span className="item-time">Hôm qua</span>
                                    </div>
                                    <div className="item-body">
                                        <p className="item-subject">Xin gia hạn deadline</p>
                                        <p className="item-preview"><i className="ri-check-double-line seen"></i>Bạn: Được, anh có thể gia hạn...</p>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </aside>

                    {/* CỘT 2: KHUNG CHAT CHI TIẾT */}
                    <main className="feedback-main">
                        <header className="main-header">
                            <div className="header-info">
                                <h3 className="subject-title">Thắc mắc về tính năng báo cáo</h3>
                                <p className="task-link">
                                    <i className="ri-task-line"></i>
                                    Liên quan đến task: <span>Cập nhật hệ thống CRM</span>
                                </p>
                            </div>
                            <div className="header-actions">
                                <button title="Ghim báo cáo"><i className="ri-pushpin-line"></i></button>
                                <button title="Xem thông tin"><i className="ri-information-line"></i></button>
                            </div>
                        </header>

                        <div className="conversation-panel">
                            {/* Tin nhắn từ người gửi */}
                            <div className="message-group from-them">
                                <img src="https://i.pravatar.cc/150?u=user1" alt="User Avatar" className="message-avatar" />
                                <div className="message-content">
                                    <div className="message-bubble">
                                        <p>Chào anh, em cần hỗ trợ về cách tạo báo cáo tự động trong hệ thống mới. Hiện tại em chưa rõ cách cấu hình các thông số.</p>
                                    </div>
                                    <span className="message-time">Nguyễn Thị Hoa • 10:30 AM</span>
                                </div>
                            </div>

                            {/* Tin nhắn từ bạn (người quản lý ) */}
                            <div className="message-group from-me">
                                <div className="message-content">
                                    <div className="message-bubble">
                                        <p>Chào em, em có thể tham khảo tài liệu anh đã đính kèm trong task nhé. Nếu vẫn còn vướng mắc, em ghi lại các câu hỏi cụ thể để team hỗ trợ.</p>
                                    </div>
                                    <span className="message-time">Bạn • 10:35 AM • <i className="ri-check-double-line seen"></i></span>
                                </div>
                            </div>
                        </div>

                        <footer className="main-footer">
                            <div className="chat-input-area">
                                <button title="Đính kèm file"><i className="ri-attachment-2"></i></button>
                                <input type="text" placeholder="Nhập nội dung phản hồi..." />
                                <button className="send-btn" title="Gửi">
                                    <i className="ri-send-plane-fill"></i>
                                </button>
                            </div>
                        </footer>
                    </main>
                </div>
            </div>
        </LayoutMain>
    );
};

export default Feedback;
