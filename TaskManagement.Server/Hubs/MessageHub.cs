using Microsoft.AspNetCore.SignalR;
using Microsoft.AspNetCore.Authorization;
using System.Security.Claims;
using Microsoft.Extensions.Logging;

namespace TaskManagement.Server.Hubs
{
    [Authorize]
    public class MessageHub : Hub
    {
        private readonly ILogger<MessageHub> _logger;

        public MessageHub(ILogger<MessageHub> logger)
        {
            _logger = logger;
        }

        public override async Task OnConnectedAsync()
        {
            try
            {
                var userId = Context.UserIdentifier ?? Context.User?.FindFirst(ClaimTypes.NameIdentifier)?.Value;
                var userEmail = Context.User?.FindFirst(ClaimTypes.Email)?.Value;
                var userName = Context.User?.FindFirst(ClaimTypes.Name)?.Value;

                if (string.IsNullOrEmpty(userId))
                {
                    _logger.LogWarning("User connected with missing UserID. Connection ID: {ConnectionId}", Context.ConnectionId);
                    throw new HubException("User ID not found in token.");
                }

                _logger.LogInformation("User connected: {UserName} ({UserEmail}) - ID: {UserId}, Connection ID: {ConnectionId}",
                    userName, userEmail, userId, Context.ConnectionId);

                var departmentId = Context.User?.FindFirst("DepartmentID")?.Value;
                if (!string.IsNullOrEmpty(departmentId))
                {
                    await Groups.AddToGroupAsync(Context.ConnectionId, $"Department_{departmentId}");
                    _logger.LogInformation("User {UserId} joined group Department_{DepartmentId}", userId, departmentId);
                }

                await base.OnConnectedAsync();
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Error in OnConnectedAsync for Connection ID: {ConnectionId}", Context.ConnectionId);
                throw;
            }
        }

        public override async Task OnDisconnectedAsync(Exception? exception)
        {
            try
            {
                var userId = Context.UserIdentifier ?? Context.User?.FindFirst(ClaimTypes.NameIdentifier)?.Value;
                var departmentId = Context.User?.FindFirst("DepartmentID")?.Value;

                _logger.LogInformation("User disconnected: {UserId}, Connection ID: {ConnectionId}", userId, Context.ConnectionId);

                if (!string.IsNullOrEmpty(departmentId))
                {
                    await Groups.RemoveFromGroupAsync(Context.ConnectionId, $"Department_{departmentId}");
                    _logger.LogInformation("User {UserId} left group Department_{DepartmentId}", userId, departmentId);
                }

                if (exception != null)
                {
                    _logger.LogError(exception, "Disconnection error for User {UserId}, Connection ID: {ConnectionId}", userId, Context.ConnectionId);
                }

                await base.OnDisconnectedAsync(exception);
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Error in OnDisconnectedAsync for Connection ID: {ConnectionId}", Context.ConnectionId);
                throw;
            }
        }

        public async Task SendMessage(string conversationId, string receiverId, string message)
        {
            try
            {
                if (string.IsNullOrEmpty(conversationId))
                {
                    _logger.LogWarning("SendMessage failed: Conversation ID is empty for Connection ID: {ConnectionId}", Context.ConnectionId);
                    throw new HubException("Conversation ID cannot be empty.");
                }

                var senderId = Context.UserIdentifier ?? Context.User?.FindFirst(ClaimTypes.NameIdentifier)?.Value;
                var senderName = Context.User?.FindFirst(ClaimTypes.Name)?.Value;

                if (string.IsNullOrEmpty(senderId))
                {
                    _logger.LogWarning("SendMessage failed: Sender ID not found for Connection ID: {ConnectionId}", Context.ConnectionId);
                    throw new HubException("Sender ID not found in token.");
                }

                var messagePayload = new
                {
                    SenderId = senderId,
                    SenderName = senderName,
                    Message = message,
                    Timestamp = DateTime.UtcNow.ToString("o"), // ISO 8601 format
                    ConversationId = conversationId
                };

                // Gửi tin nhắn tới nhóm conversation
                await Clients.Group($"Conversation_{conversationId}")
                    .SendAsync("ReceiveMessage", messagePayload);

                // Gửi xác nhận cho người gửi
                await Clients.Caller.SendAsync("MessageSent", new
                {
                    ReceiverId = receiverId,
                    Message = message,
                    Timestamp = DateTime.UtcNow.ToString("o"),
                    ConversationId = conversationId
                });

                _logger.LogInformation("Message sent from {SenderId} to Conversation_{ConversationId}: {Message}", senderId, conversationId, message);
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Error in SendMessage for Conversation ID: {ConversationId}, Connection ID: {ConnectionId}", conversationId, Context.ConnectionId);
                throw;
            }
        }

        public async Task JoinConversation(string conversationId)
        {
            try
            {
                if (string.IsNullOrEmpty(conversationId))
                {
                    _logger.LogWarning("JoinConversation failed: Conversation ID is empty for Connection ID: {ConnectionId}", Context.ConnectionId);
                    throw new HubException("Conversation ID cannot be empty.");
                }

                await Groups.AddToGroupAsync(Context.ConnectionId, $"Conversation_{conversationId}");
                _logger.LogInformation("User {UserId} joined Conversation_{ConversationId}, Connection ID: {ConnectionId}",
                    Context.UserIdentifier, conversationId, Context.ConnectionId);

                // Thông báo client đã tham gia thành công
                await Clients.Caller.SendAsync("JoinedConversation", conversationId);
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Error in JoinConversation for Conversation ID: {ConversationId}, Connection ID: {ConnectionId}", conversationId, Context.ConnectionId);
                throw;
            }
        }

        public async Task LeaveConversation(string conversationId)
        {
            try
            {
                if (string.IsNullOrEmpty(conversationId))
                {
                    _logger.LogWarning("LeaveConversation failed: Conversation ID is empty for Connection ID: {ConnectionId}", Context.ConnectionId);
                    throw new HubException("Conversation ID cannot be empty.");
                }

                await Groups.RemoveFromGroupAsync(Context.ConnectionId, $"Conversation_{conversationId}");
                _logger.LogInformation("User {UserId} left Conversation_{ConversationId}, Connection ID: {ConnectionId}",
                    Context.UserIdentifier, conversationId, Context.ConnectionId);

                // Thông báo client đã rời thành công
                await Clients.Caller.SendAsync("LeftConversation", conversationId);
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Error in LeaveConversation for Conversation ID: {ConversationId}, Connection ID: {ConnectionId}", conversationId, Context.ConnectionId);
                throw;
            }
        }

        public async Task MarkMessageAsRead(string conversationId, string messageId)
        {
            try
            {
                if (string.IsNullOrEmpty(conversationId) || string.IsNullOrEmpty(messageId))
                {
                    _logger.LogWarning("MarkMessageAsRead failed: Invalid conversation ID or message ID for Connection ID: {ConnectionId}", Context.ConnectionId);
                    throw new HubException("Conversation ID and Message ID cannot be empty.");
                }

                var userId = Context.UserIdentifier ?? Context.User?.FindFirst(ClaimTypes.NameIdentifier)?.Value;
                await Clients.Group($"Conversation_{conversationId}")
                    .SendAsync("MessageRead", new
                    {
                        MessageId = messageId,
                        UserId = userId,
                        Timestamp = DateTime.UtcNow.ToString("o")
                    });

                _logger.LogInformation("Message {MessageId} marked as read by User {UserId} in Conversation_{ConversationId}", messageId, userId, conversationId);
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Error in MarkMessageAsRead for Message ID: {MessageId}, Conversation ID: {ConversationId}, Connection ID: {ConnectionId}",
                    messageId, conversationId, Context.ConnectionId);
                throw;
            }
        }
    }
}