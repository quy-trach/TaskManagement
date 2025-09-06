import React, { useState, useEffect } from 'react';
import { HubConnectionBuilder, HttpTransportType } from '@microsoft/signalr';
import { useAuth } from '../../context/AuthContext';
import Breadcrumb from '../../components/Breadcrumb';
import LayoutMain from '../../layouts/LayoutMain';
import axiosInstance from '../../api/axiosConfig';

const Feedback = () => {
    const { token, user } = useAuth();
    const [users, setUsers] = useState([]);
    const [filteredUsers, setFilteredUsers] = useState([]);
    const [searchTerm, setSearchTerm] = useState('');
    const [selectedUser, setSelectedUser] = useState(null);
    const [messages, setMessages] = useState([]);
    const [newMessage, setNewMessage] = useState('');
    const [connection, setConnection] = useState(null);
    const [loading, setLoading] = useState(true);
    const [isSending, setIsSending] = useState(false);
    const [error, setError] = useState(null);
    const [conversationId, setConversationId] = useState(null);
    const [unreadCounts, setUnreadCounts] = useState({});

    const fetchUsers = async () => {
        setLoading(true);
        setError(null);
        try {
            // Lấy danh sách người dùng
            const userResponse = await axiosInstance.get('/messages/users');
            const userData = userResponse.data;

            if ((userData.Success || userData.success) && (userData.Data || userData.data)) {
                const users = userData.Data || userData.data;
                console.log('Fetched users:', users); // Log để kiểm tra
                setUsers(users);
                setFilteredUsers(users);

                // Lấy danh sách cuộc trò chuyện để tính unreadCount
                const conversationResponse = await axiosInstance.get('/messages/conversations?page=1');
                const convData = conversationResponse.data;
                console.log('Fetched conversations:', convData); // Log để kiểm tra

                if (convData?.Success || convData?.success) {
                    const conversations = convData.Data?.Conversations || convData.data?.conversations || [];
                    const unreadCountsMap = {};

                    conversations.forEach(conv => {
                        const otherParticipant = conv.Participants?.find(p => (p.UserID || p.userId) !== GetCurrentUserId());
                        if (otherParticipant) {
                            const userId = otherParticipant.UserID || otherParticipant.userId;
                            unreadCountsMap[userId] = conv.UnreadCount || 0;
                            console.log(`UserID: ${userId}, UnreadCount: ${conv.UnreadCount}`); // Log để debug
                        }
                    });

                    setUnreadCounts(unreadCountsMap);
                    console.log('Updated unreadCounts:', unreadCountsMap); // Log trạng thái cuối

                    if (users.length > 0) {
                        setSelectedUser(users[0]);
                        createConversation(users[0].UserID || users[0].userId);
                    } else {
                        setError('Không có người dùng nào phù hợp.');
                    }
                } else {
                    setError('Không thể lấy danh sách cuộc trò chuyện: ' + (convData.Message || convData.message || 'Lỗi không xác định'));
                }
            } else {
                setError((userData.Message || userData.message) || 'Không có dữ liệu người dùng từ server.');
            }
        } catch (err) {
            setError('Lỗi khi lấy danh sách người dùng: ' + (err.response?.data?.Message || err.response?.data?.message || err.message));
            console.error('Error fetching users:', err.response || err);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        setFilteredUsers(
            users.filter(u => (u.FullName || u.fullName || '').toLowerCase().includes(searchTerm.toLowerCase()))
        );
    }, [searchTerm, users]);

    const createConversation = async (userId) => {
        setLoading(true);
        setError(null);
        try {
            const existingConversations = await axiosInstance.get('/messages/conversations?page=1');
            if (existingConversations.data?.Success || existingConversations.data?.success) {
                const conversations = existingConversations.data.Data?.Conversations || existingConversations.data.data?.conversations || [];
                const existingConv = conversations.find(conv => {
                    const participants = conv.Participants || conv.participants || [];
                    return participants.length === 2 && participants.some(p => (p.UserID || p.userId) === userId);
                });

                if (existingConv) {
                    const selectedUserData = users.find(u => (u.UserID || u.userId) === userId);
                    setSelectedUser(selectedUserData);
                    const convId = existingConv.ConversationID || existingConv.conversationId;
                    setConversationId(convId);
                    await fetchMessages(convId);
                    if (connection && connection.state === 'Connected') {
                        await connection.invoke('JoinConversation', convId.toString());
                        console.log(`Đã tham gia nhóm conversation_${convId}`);
                    }
                    return;
                }
            }

            const selectedUserData = users.find(u => (u.UserID || u.userId) === userId);
            if (!selectedUserData) {
                setError('Không tìm thấy người dùng được chọn.');
                setLoading(false);
                return;
            }

            const request = {
                Title: `Chat với ${selectedUserData.FullName || selectedUserData.fullName || 'Người dùng'}`,
                ParticipantIds: [userId],
                DepartmentID: user?.DepartmentID || user?.departmentId || null
            };

            console.log('Creating conversation with request:', request);

            const response = await axiosInstance.post('/messages/conversations', request);
            const data = response.data;

            console.log('Create conversation response:', data);

            if (data.Success || data.success) {
                const convId = data.Data?.ConversationID || data.data?.conversationId;
                if (convId && convId > 0) {
                    setSelectedUser(selectedUserData);
                    setConversationId(convId);
                    await fetchMessages(convId);
                    if (connection && connection.state === 'Connected') {
                        await connection.invoke('JoinConversation', convId.toString());
                        console.log(`Đã tham gia nhóm conversation_${convId}`);
                    }
                } else {
                    setError('Không thể lấy ID cuộc trò chuyện hợp lệ từ server.');
                }
            } else {
                const errorMsg = data.Message || data.message || 'Tạo cuộc trò chuyện thất bại';
                const errorDetails = data.Data || data.data || [];
                setError(errorMsg + (errorDetails.length > 0 ? ': ' + errorDetails.join(', ') : ''));
            }
        } catch (err) {
            console.error('Create conversation error:', err);
            setError('Lỗi khi tạo cuộc trò chuyện: ' + (err.response?.data?.Message || err.response?.data?.message || err.message));
        } finally {
            setLoading(false);
        }
    };

    const fetchMessages = async (conversationId) => {
        if (!conversationId || conversationId <= 0) {
            setError('ID cuộc trò chuyện không hợp lệ: ' + conversationId);
            setLoading(false);
            return;
        }

        setLoading(true);
        setError(null);
        try {
            console.log('Fetching messages for conversation ID:', conversationId);
            const response = await axiosInstance.get(`/messages/conversations/${conversationId}?page=1`);
            const data = response.data;
            if ((data.Success || data.success) && (data.Data?.Messages || data.data?.messages)) {
                const fetchedMessages = data.Data?.Messages || data.data?.messages;
                // Sắp xếp tin nhắn theo thời gian gửi (SentAt hoặc sentAt)
                const sortedMessages = fetchedMessages.sort((a, b) => {
                    const dateA = new Date(a.SentAt || a.sentAt || 0);
                    const dateB = new Date(b.SentAt || b.sentAt || 0);
                    return dateA - dateB; 
                });
                setMessages(sortedMessages);
            } else {
                setError((data.Message || data.message) || 'Không có dữ liệu tin nhắn');
            }
        } catch (err) {
            console.error('Fetch messages error:', err.response?.data);
            setError('Lỗi khi lấy tin nhắn: ' + (err.response?.data?.Message || err.response?.data?.message || err.message));
        } finally {
            setLoading(false);
        }
    };

    const handleSendMessage = async () => {
        if (isSending) return;

        if (!newMessage.trim() || !selectedUser || !conversationId) {
            setError('Vui lòng chọn người dùng và đảm bảo cuộc trò chuyện đã được tạo.');
            return;
        }

        setIsSending(true);

        const request = {
            conversationId: conversationId,
            receiverId: selectedUser.UserID || selectedUser.userId,
            content: newMessage.trim()
        };

        try {
            const response = await axiosInstance.post('/messages', request);
            const data = response.data;

            if (!(data.Success || data.success)) {
                setError('Gửi tin nhắn thất bại: ' + (data.Message || data.message));
            } else {
                setNewMessage('');
                setError(null);

                // Làm mới unreadCounts
                const conversationResponse = await axiosInstance.get('/messages/conversations?page=1');
                if (conversationResponse.data?.Success || conversationResponse.data?.success) {
                    const conversations = conversationResponse.data.Data?.Conversations || conversationResponse.data.data?.conversations || [];
                    const unreadCountsMap = {};

                    conversations.forEach(conv => {
                        const otherParticipant = conv.Participants?.find(p => (p.UserID || p.userId) !== GetCurrentUserId());
                        if (otherParticipant) {
                            unreadCountsMap[otherParticipant.UserID || otherParticipant.userId] = conv.UnreadCount || 0;
                        }
                    });

                    setUnreadCounts(unreadCountsMap);
                }
            }
        } catch (err) {
            console.error('Send message error:', err);
            setError('Lỗi khi gửi tin nhắn: ' + (err.response?.data?.Message || err.response?.data?.message || err.message));
        } finally {
            setIsSending(false);
        }
    };

    useEffect(() => {
        if (!token) {
            setError('Không có token, vui lòng đăng nhập lại');
            return;
        }

        let signalRConnection = null;

        const startSignalRConnection = async () => {
            try {
                signalRConnection = new HubConnectionBuilder()
                    .withUrl('https://localhost:7143/messageHub', {
                        accessTokenFactory: () => token,
                        transport: HttpTransportType.WebSockets,
                        skipNegotiation: false
                    })
                    .withAutomaticReconnect([0, 2000, 10000, 30000])
                    .build();

                signalRConnection.on('ReceiveMessage', (message) => {
                    console.log('Tin nhắn mới từ server:', message);
                    const senderId = message.SenderID || message.senderId;
                    const currentUserId = GetCurrentUserId();
                    const convId = message.ConversationID || message.conversationId;

                    // Cập nhật tin nhắn nếu thuộc cuộc trò chuyện hiện tại
                    if (convId === conversationId) {
                        setMessages(prevMessages => {
                            const isDuplicate = prevMessages.some(
                                msg => (msg.MessageID || msg.messageId) === (message.MessageID || message.messageId)
                            );
                            if (isDuplicate) return prevMessages;

                            const updatedMessages = [...prevMessages, {
                                ...message,
                                SentAt: message.SentAt || message.sentAt || new Date().toISOString()
                            }];

                            return updatedMessages.sort((a, b) => {
                                const dateA = new Date(a.SentAt || a.sentAt || 0);
                                const dateB = new Date(b.SentAt || b.sentAt || 0);
                                return dateA - dateB;
                            });
                        });
                    }

                    // Cập nhật unreadCounts nếu tin nhắn không từ user hiện tại và không thuộc cuộc trò chuyện hiện tại
                    if (senderId !== currentUserId && convId !== conversationId) {
                        setUnreadCounts(prev => {
                            const newCounts = { ...prev, [senderId]: (prev[senderId] || 0) + 1 };
                            console.log('Updated unreadCounts (SignalR):', newCounts); // Log để debug
                            return newCounts;
                        });
                    }
                });

                signalRConnection.on('ReceiveNotification', (notification) => {
                    console.log('Thông báo mới:', notification);
                });

                signalRConnection.onclose(() => {
                    console.log('SignalR connection closed');
                });

                signalRConnection.onreconnecting(() => {
                    console.log('SignalR reconnecting...');
                });

                signalRConnection.onreconnected(() => {
                    console.log('SignalR reconnected');
                    if (conversationId) {
                        signalRConnection.invoke('JoinConversation', conversationId.toString())
                            .then(() => console.log(`Rejoined conversation_${conversationId}`))
                            .catch(err => console.error('Error rejoining conversation:', err));
                    }
                });

                await signalRConnection.start();
                console.log('Kết nối SignalR đã thành công và ổn định.');
                setConnection(signalRConnection);

                if (conversationId) {
                    await signalRConnection.invoke('JoinConversation', conversationId.toString());
                    console.log(`Đã tham gia nhóm conversation_${conversationId}`);
                }
            } catch (err) {
                console.error('Lỗi khi thiết lập kết nối SignalR:', err);
                setError('Không thể kết nối đến máy chủ chat: ' + err.message);
            }
        };

        startSignalRConnection();

        return () => {
            if (signalRConnection && signalRConnection.state === 'Connected') {
                console.log('Đang dừng kết nối SignalR...');
                signalRConnection.stop().catch(err => console.error('Lỗi khi dừng SignalR:', err));
            }
        };
    }, [token, conversationId]);

    const handleUserSelect = (userId) => {
        // Reset unread count cho user được chọn
        setUnreadCounts(prev => ({
            ...prev,
            [userId]: 0
        }));

        createConversation(userId);
    };
    useEffect(() => {
        const conversationPanel = document.querySelector('.conversation-panel');
        if (conversationPanel) {
            // Với column-reverse, scrollTop = 0 để xem tin nhắn mới nhất (ở trên cùng)
            conversationPanel.scrollTop = 0;
        }
    }, [messages]);

    useEffect(() => {
        fetchUsers();
    }, []);

    const GetCurrentUserId = () => user?.UserID || user?.userId || parseInt(localStorage.getItem('userId') || '0');

    return (
        <LayoutMain pageTitle="Phản hồi & Báo cáo">
            <Breadcrumb />
            <div className="feedback-page">
                <div className="feedback-container">
                    <aside className="feedback-sidebar">
                        <div className="sidebar-header">
                            <div className="search-bar">
                                <i className="ri-search-line"></i>
                                <input
                                    type="text"
                                    placeholder="Tìm kiếm người dùng..."
                                    value={searchTerm}
                                    onChange={(e) => setSearchTerm(e.target.value)}
                                />
                            </div>
                            <button className="new-feedback-btn" title="Tạo phản hồi mới" onClick={() => { }}>
                                <i className="ri-add-line"></i>
                            </button>
                        </div>
                        <div className="feedback-list">
                            {loading && <div>Đang tải...</div>}
                            {error && <div style={{ color: 'red' }}>{error}</div>}
                            {filteredUsers.length === 0 && !loading && !error && <div>Không có người dùng</div>}
                            {filteredUsers.map((userData) => (
                                <div
                                    key={userData.UserID || userData.userId}
                                    className={`feedback-item ${(selectedUser?.UserID || selectedUser?.userId) === (userData.UserID || userData.userId) ? 'active' : ''}`}
                                    onClick={() => handleUserSelect(userData.UserID || userData.userId)}
                                >
                                    <div className="item-avatar">
                                        <img src={userData.Avatar || userData.avatar || 'https://i.pravatar.cc/150'} alt="User Avatar" />
                                        {(userData.RoleName || userData.roleName) === 'Trưởng phòng' && <span className="status-dot online"></span>}
                                    </div>
                                    <div className="item-content">
                                        <div className="item-header">
                                            <span className="item-user">{userData.FullName || userData.fullName || 'Unknown'}</span>
                                            <span className="item-time">N/A</span>
                                        </div>
                                        <div className="item-body">
                                            <p className="item-subject">{userData.RoleName || userData.roleName}</p>
                                            <p className="item-preview">Bắt đầu trò chuyện</p>
                                        </div>
                                    </div>
                                    <div className="item-status">
                                        <span className="unread-count">
                                            {(unreadCounts[userData.UserID || userData.userId] || 0) > 0 ? unreadCounts[userData.UserID || userData.userId] : ''}
                                        </span>
                                    </div>
                                </div>
                            ))}
                        </div>
                    </aside>
                    <main className="feedback-main">
                        {selectedUser ? (
                            <>
                                <header className="main-header">
                                    <div className="header-info">
                                        <h3 className="subject-title">{`Chat với ${selectedUser.FullName || selectedUser.fullName || 'Người dùng'}`}</h3>
                                        <p className="task-link">
                                            <i className="ri-task-line"></i>
                                            Phòng ban: <span>{selectedUser.DepartmentName || selectedUser.departmentName || 'N/A'}</span>
                                        </p>
                                    </div>
                                    <div className="header-actions">
                                        <button title="Ghim báo cáo"><i className="ri-pushpin-line"></i></button>
                                        <button title="Xem thông tin"><i className="ri-information-line"></i></button>
                                    </div>
                                </header>
                                <div className="conversation-panel">
                                    {loading && <div>Đang tải...</div>}
                                    {error && <div style={{ color: 'red' }}>{error}</div>}
                                    {!loading && !error && messages.length === 0 && <div>Chưa có tin nhắn nào.</div>}

                                    {/* Hiển thị tin nhắn theo đúng thứ tự thời gian */}
                                    {messages.map((msg) => (
                                        <div
                                            key={msg.MessageID || msg.messageId || Date.now()}
                                            className={`message-group ${(msg.SenderID || msg.senderId) === GetCurrentUserId() ? 'from-me' : 'from-them'}`}
                                        >
                                            {(msg.SenderID || msg.senderId) !== GetCurrentUserId() && (
                                                <img
                                                    src={msg.SenderAvatar || msg.senderAvatar || 'https://i.pravatar.cc/150'}
                                                    alt="User Avatar"
                                                    className="message-avatar"
                                                />
                                            )}
                                            <div className="message-content">
                                                <div className="message-bubble">
                                                    <p>{msg.Content || msg.content || 'N/A'}</p>
                                                </div>
                                                <span className="message-time">
                                                    {msg.SenderName || msg.senderName || 'Unknown'} •
                                                    {(() => {
                                                        const sentAt = msg.SentAt || msg.sentAt;
                                                        if (!sentAt || sentAt === 'Invalid Date') return 'N/A';

                                                        try {
                                                            // Xử lý format dd/MM/yyyy HH:mm:ss từ backend
                                                            if (sentAt.includes('/')) {
                                                                const [datePart, timePart] = sentAt.split(' ');
                                                                const [day, month, year] = datePart.split('/');
                                                                const isoString = `${year}-${month}-${day}T${timePart}`;
                                                                return new Date(isoString).toLocaleTimeString();
                                                            }
                                                            // Format ISO từ frontend
                                                            return new Date(sentAt).toLocaleTimeString();
                                                        } catch {
                                                            return 'N/A';
                                                        }
                                                    })()}
                                                    {(msg.IsRead || msg.isRead) && <i className="ri-check-double-line seen"></i>}
                                                </span>
                                            </div>
                                        </div>
                                    ))}
                                </div>
                                <footer className="main-footer">
                                    <div className="chat-input-area">
                                        <button title="Đính kèm file"><i className="ri-attachment-2"></i></button>
                                        <input
                                            type="text"
                                            placeholder="Nhập nội dung phản hồi..."
                                            value={newMessage}
                                            onChange={(e) => setNewMessage(e.target.value)}
                                            onKeyPress={(e) => e.key === 'Enter' && handleSendMessage()}
                                        />
                                        <button className="send-btn" title="Gửi" onClick={handleSendMessage}>
                                            <i className="ri-send-plane-fill"></i>
                                        </button>
                                    </div>
                                </footer>
                            </>
                        ) : (
                            <div>Chọn một người dùng để bắt đầu trò chuyện.</div>
                        )}
                    </main>
                </div>
            </div>
        </LayoutMain>
    );
};

export default Feedback;