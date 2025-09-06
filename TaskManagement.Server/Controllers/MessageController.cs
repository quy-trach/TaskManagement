using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Microsoft.AspNetCore.SignalR;
using Microsoft.EntityFrameworkCore;
using System.Security.Claims;
using TaskManagement.Server.Models;
using TaskManagement.Server.ViewModels;
using TaskManagement.Server.Hubs;
using Microsoft.Data.SqlClient;

namespace TaskManagement.Server.Controllers
{
    [Route("api/messages")]
    [ApiController]
    public class MessageController : ControllerBase
    {
        private const int PAGE_SIZE = 20;
        private readonly DBContext db;
        private readonly IHubContext<MessageHub> hubContext;
        private readonly ILogger<MessageController> _logger;

        public MessageController(DBContext context, IHubContext<MessageHub> hubContext, ILogger<MessageController> logger)
        {
            db = context;
            this.hubContext = hubContext;
            _logger = logger;
        }

        private string GetCurrentUserRole()
        {
            return HttpContext.User.FindFirst(ClaimTypes.Role)?.Value ?? string.Empty;
        }

        private int GetCurrentUserId()
        {
            var userIdClaim = HttpContext.User.FindFirst(ClaimTypes.NameIdentifier)?.Value;
            return userIdClaim != null ? int.Parse(userIdClaim) : throw new UnauthorizedAccessException("User ID not found in token");
        }

        private int GetCurrentUserDepartmentId()
        {
            var departmentIdClaim = HttpContext.User.FindFirst("DepartmentID")?.Value;
            return departmentIdClaim != null ? int.Parse(departmentIdClaim) : throw new UnauthorizedAccessException("Department ID not found in token");
        }

        private async Task<Conversation?> GetConversationByIdAsync(int id)
        {
            return await db.Conversations
                .Include(c => c.Department)
                .Include(c => c.ConversationParticipants)
                .ThenInclude(cp => cp.User)
                .ThenInclude(u => u.Role)
                .AsSplitQuery()
                .FirstOrDefaultAsync(c => c.ConversationID == id);
        }

        private ConversationResponse? GetConversationResponse(Conversation? conversation, int currentUserId)
        {
            if (conversation == null)
            {
                return null;
            }

            var unreadCount = db.Messages
                .Count(m => m.ConversationID == conversation.ConversationID && !m.IsRead && (m.ReceiverID == currentUserId || m.ReceiverID == null));

            return new ConversationResponse
            {
                ConversationID = conversation.ConversationID,
                Title = conversation.Title ?? string.Empty,
                CreatedAt = conversation.CreatedAt.ToString("dd/MM/yyyy HH:mm:ss"),
                LastMessageAt = conversation.LastMessageAt?.ToString("dd/MM/yyyy HH:mm:ss") ?? string.Empty,
                DepartmentID = conversation.DepartmentID,
                DepartmentName = conversation.Department?.DepartmentName ?? "N/A",
                UnreadCount = unreadCount,
                Participants = conversation.ConversationParticipants?.Select(cp => new UserOptionResponse
                {
                    UserID = cp.User?.UserID ?? 0,
                    FullName = cp.User?.FullName ?? "Unknown User",
                    Avatar = cp.User?.Avatar ?? string.Empty,
                    RoleName = cp.User?.Role?.RoleName ?? "N/A",
                    DepartmentName = cp.User?.Department?.DepartmentName ?? "N/A"
                }).ToList() ?? new List<UserOptionResponse>()
            };
        }

        private MessageResponse? GetMessageResponse(Message? message)
        {
            if (message == null)
            {
                return null;
            }

            var sender = db.Users.FirstOrDefault(u => u.UserID == message.SenderID);
            var receiver = message.ReceiverID != null ? db.Users.FirstOrDefault(u => u.UserID == message.ReceiverID) : null;

            return new MessageResponse
            {
                MessageID = message.MessageID,
                ConversationID = message.ConversationID,
                SenderID = message.SenderID,
                SenderName = sender?.FullName ?? string.Empty,
                SenderAvatar = sender?.Avatar ?? string.Empty,
                ReceiverID = message.ReceiverID,
                ReceiverName = receiver?.FullName ?? string.Empty,
                Content = message.Content ?? string.Empty,
                SentAt = message.SentAt.ToString("dd/MM/yyyy HH:mm:ss"),
                IsRead = message.IsRead,
                Status = message.Status ?? string.Empty
            };
        }

        private bool HasAccessToConversation(Conversation conversation, int userId, string userRole, int departmentId)
        {
            Console.WriteLine($"Checking access: UserID={userId}, Role={userRole}, DepartmentID={departmentId}, ConversationID={conversation.ConversationID}");

            var isParticipant = conversation.ConversationParticipants.Any(cp => cp.UserID == userId);
            if (isParticipant)
            {
                Console.WriteLine($"Access granted: UserID={userId} is a participant in ConversationID={conversation.ConversationID}");
                return true;
            }

            Console.WriteLine($"Access denied: UserID={userId} is not a participant in ConversationID={conversation.ConversationID}");
            return false;
        }

        [HttpGet("conversations")]
        [Authorize]
        public async Task<IActionResult> GetConversations([FromQuery] int? page)
        {
            try
            {
                var userId = GetCurrentUserId();
                var userRole = GetCurrentUserRole();
                var departmentId = GetCurrentUserDepartmentId();

                IQueryable<Conversation> query = db.Conversations
                    .Include(c => c.Department)
                    .Include(c => c.ConversationParticipants)
                    .ThenInclude(cp => cp.User)
                    .ThenInclude(u => u.Role)
                    .AsSplitQuery()
                    .Where(c => c.ConversationParticipants.Any(cp => cp.UserID == userId));

                int totalRecords = await query.CountAsync();

                if (page == null || page < 1)
                {
                    page = 1;
                }

                query = query.OrderByDescending(c => c.LastMessageAt ?? c.CreatedAt)
                             .Skip((page.Value - 1) * PAGE_SIZE)
                             .Take(PAGE_SIZE);

                var conversations = await query.ToListAsync();
                var data = conversations.Select(c => GetConversationResponse(c, userId)).ToList();

                return Ok(new ApiResponse
                {
                    Success = true,
                    Message = "Lấy danh sách cuộc trò chuyện thành công",
                    Data = new
                    {
                        Conversations = data,
                        TotalRecords = totalRecords,
                        CurrentPage = page,
                        PageSize = PAGE_SIZE
                    }
                });
            }
            catch (Exception ex)
            {
                return StatusCode(500, new ApiResponse
                {
                    Success = false,
                    Message = "Đã xảy ra lỗi trong khi lấy danh sách cuộc trò chuyện",
                    Data = new[] { ex.Message }
                });
            }
        }

        [HttpGet("conversations/{id}")]
        public async Task<IActionResult> GetConversation(int id, [FromQuery] int? page)
        {
            if (id <= 0)
            {
                return BadRequest(new ApiResponse
                {
                    Success = false,
                    Message = "Dữ liệu không hợp lệ",
                    Data = new[] { "ID không được để trống hoặc nhỏ hơn 1" }
                });
            }

            try
            {
                var userId = GetCurrentUserId();
                var userRole = GetCurrentUserRole();
                var departmentId = GetCurrentUserDepartmentId();

                var conversation = await GetConversationByIdAsync(id);
                if (conversation == null)
                {
                    return NotFound(new ApiResponse
                    {
                        Success = false,
                        Message = "Không tìm thấy cuộc trò chuyện",
                        Data = new[] { $"Không tìm thấy cuộc trò chuyện với ID = {id}" }
                    });
                }

                if (string.IsNullOrEmpty(userRole))
                {
                    return Unauthorized(new ApiResponse
                    {
                        Success = false,
                        Message = "Không xác định được vai trò người dùng",
                        Data = new[] { "Token không chứa thông tin vai trò" }
                    });
                }

                if (!HasAccessToConversation(conversation, userId, userRole, departmentId))
                {
                    return Unauthorized(new ApiResponse
                    {
                        Success = false,
                        Message = "CẢNH BÁO: Bạn không có quyền truy cập vào cuộc trò chuyện này",
                        Data = new[] { "Vui lòng kiểm tra quyền truy cập của bạn" }
                    });
                }

                if (page == null || page < 1)
                {
                    page = 1;
                }

                var messages = await db.Messages
                    .Where(m => m.ConversationID == id)
                    .OrderByDescending(m => m.SentAt)
                    .Skip((page.Value - 1) * PAGE_SIZE)
                    .Take(PAGE_SIZE)
                    .ToListAsync();

                var totalMessages = await db.Messages.CountAsync(m => m.ConversationID == id);

                return Ok(new ApiResponse
                {
                    Success = true,
                    Message = "Lấy chi tiết cuộc trò chuyện thành công",
                    Data = new
                    {
                        Conversation = GetConversationResponse(conversation, userId),
                        Messages = messages.Select(m => GetMessageResponse(m)).ToList(),
                        TotalMessages = totalMessages,
                        CurrentPage = page,
                        PageSize = PAGE_SIZE
                    }
                });
            }
            catch (Exception ex)
            {
                return StatusCode(500, new ApiResponse
                {
                    Success = false,
                    Message = "Đã xảy ra lỗi trong khi lấy chi tiết cuộc trò chuyện",
                    Data = new[] { ex.Message }
                });
            }
        }

        [HttpPost("conversations")]
        [Authorize]
        public async Task<IActionResult> CreateConversation([FromBody] ConversationCreateRequest request)
        {
            if (!ModelState.IsValid)
            {
                return BadRequest(new ApiResponse
                {
                    Success = false,
                    Message = "Dữ liệu không hợp lệ",
                    Data = ModelState.Values.SelectMany(v => v.Errors).Select(e => e.ErrorMessage).ToArray()
                });
            }

            try
            {
                var userId = GetCurrentUserId();
                var userRole = GetCurrentUserRole();
                var departmentId = GetCurrentUserDepartmentId();

                if (request.ParticipantIds == null || request.ParticipantIds.Count != 1)
                {
                    return BadRequest(new ApiResponse
                    {
                        Success = false,
                        Message = "API hiện tại chỉ hỗ trợ tạo cuộc trò chuyện 1-1 (cần gửi lên đúng 1 ID người tham gia)."
                    });
                }

                var otherUserId = request.ParticipantIds.First();
                var otherUser = await db.Users.Include(u => u.Role).FirstOrDefaultAsync(u => u.UserID == otherUserId);
                if (otherUser == null)
                {
                    return BadRequest(new ApiResponse
                    {
                        Success = false,
                        Message = "Người tham gia không tồn tại",
                        Data = new[] { $"Không tìm thấy người dùng với ID = {otherUserId}" }
                    });
                }

                // Kiểm tra quyền tạo cuộc trò chuyện
                var otherUserRole = otherUser.Role?.RoleName ?? string.Empty;
                if (userRole == "Nhân viên" &&
                    !(otherUserRole == "Trưởng phòng" && otherUser.DepartmentID == departmentId ||
                      otherUserRole == "Nhân viên" && otherUser.DepartmentID == departmentId))
                {
                    return Unauthorized(new ApiResponse
                    {
                        Success = false,
                        Message = "CẢNH BÁO: Bạn chỉ có thể tạo cuộc trò chuyện với nhân viên hoặc trưởng phòng trong phòng ban của mình",
                        Data = new[] { $"UserID = {otherUserId} không hợp lệ" }
                    });
                }
                else if (userRole == "Trưởng phòng" &&
                         !(otherUserRole == "Nhân viên" && otherUser.DepartmentID == departmentId ||
                           otherUserRole == "Trưởng phòng" ||
                           otherUserRole == "Giám đốc"))
                {
                    return Unauthorized(new ApiResponse
                    {
                        Success = false,
                        Message = "CẢNH BÁO: Bạn chỉ có thể tạo cuộc trò chuyện với nhân viên trong phòng ban, các trưởng phòng khác, hoặc giám đốc",
                        Data = new[] { $"UserID = {otherUserId} không hợp lệ" }
                    });
                }

                var p_CurrentUserID = new SqlParameter("@CurrentUserID", userId);
                var p_OtherUserID = new SqlParameter("@OtherUserID", otherUserId);
                var p_Title = new SqlParameter("@Title", request.Title ?? $"Trò chuyện với người dùng #{otherUserId}");
                var p_DepartmentID = new SqlParameter("@DepartmentID", (object?)request.DepartmentID ?? DBNull.Value);
                var parameters = new[] { p_CurrentUserID, p_OtherUserID, p_Title, p_DepartmentID };

                // Bước 1: Thực thi SP và lấy toàn bộ kết quả về dưới dạng một danh sách
                var results = await db.Database
                    .SqlQueryRaw<ConversationIdResult>($"EXEC dbo.sp_CreateOrGetConversation @CurrentUserID, @OtherUserID, @Title, @DepartmentID", parameters)
                    .ToListAsync(); // <-- Đổi từ FirstOrDefaultAsync thành ToListAsync()

                // Bước 2: Lấy phần tử đầu tiên từ danh sách kết quả trong bộ nhớ
                var result = results.FirstOrDefault();

                if (result == null || result.ConversationID <= 0)
                {
                    return StatusCode(500, new ApiResponse
                    {
                        Success = false,
                        Message = "Không thể tạo hoặc lấy cuộc trò chuyện",
                        Data = new[] { "Stored procedure trả về ID không hợp lệ" }
                    });
                }

                return Ok(new ApiResponse
                {
                    Success = true,
                    Message = "Lấy hoặc tạo cuộc trò chuyện thành công.",
                    Data = new { ConversationID = result.ConversationID }
                });
            }
            catch (Exception ex)
            {
                Console.WriteLine($"CreateConversation Error: {ex.Message}");
                Console.WriteLine($"StackTrace: {ex.StackTrace}");
                return StatusCode(500, new ApiResponse
                {
                    Success = false,
                    Message = "Đã xảy ra lỗi phía máy chủ khi tạo cuộc trò chuyện.",
                    Data = new[] { ex.Message }
                });
            }
        }

        public class ConversationIdResult
        {
            public int ConversationID { get; set; }
        }

        /// <summary>
        /// Gửi tin nhắn trong cuộc trò chuyện
        /// </summary>
        /// <param name="request">
        /// Chứa ConversationID, ReceiverID (có thể null), Content
        /// </param>
        /// <returns>
        /// Trả về MessageID và SentAt nếu thành công
        /// </returns>
        [HttpPost]
        [Authorize]
        public async Task<IActionResult> SendMessage([FromBody] MessageCreateRequest request)
        {
            if (!ModelState.IsValid)
            {
                return BadRequest(new ApiResponse
                {
                    Success = false,
                    Message = "Dữ liệu không hợp lệ",
                    Data = ModelState.Values.SelectMany(v => v.Errors).Select(e => e.ErrorMessage).ToArray()
                });
            }

            int? userId = null;
            try
            {
                try
                {
                    userId = GetCurrentUserId();
                }
                catch (UnauthorizedAccessException ex)
                {
                    _logger.LogWarning("Failed to get user ID: {ErrorMessage}", ex.Message);
                    return Unauthorized(new ApiResponse
                    {
                        Success = false,
                        Message = "Không thể xác định người dùng",
                        Data = new[] { ex.Message }
                    });
                }

                var userRole = GetCurrentUserRole();
                var departmentId = GetCurrentUserDepartmentId();
                _logger.LogInformation("SendMessage: UserID={UserId}, Role={Role}, DepartmentID={DepartmentId}, Request={Request}",
                    userId, userRole, departmentId, Newtonsoft.Json.JsonConvert.SerializeObject(request));

                var user = await db.Users.FindAsync(userId);
                if (user == null)
                {
                    _logger.LogWarning("User not found: UserID={UserId}", userId);
                    return Unauthorized(new ApiResponse
                    {
                        Success = false,
                        Message = "CẢNH BÁO: Người dùng không tồn tại hoặc không hợp lệ",
                        Data = new[] { $"Không tìm thấy người dùng với ID = {userId}" }
                    });
                }

                var conversation = await GetConversationByIdAsync(request.ConversationID);
                if (conversation == null)
                {
                    _logger.LogWarning("Conversation not found: ConversationID={ConversationId}", request.ConversationID);
                    return NotFound(new ApiResponse
                    {
                        Success = false,
                        Message = "Không tìm thấy cuộc trò chuyện",
                        Data = new[] { $"Không tìm thấy cuộc trò chuyện với ID = {request.ConversationID}" }
                    });
                }

                if (string.IsNullOrEmpty(userRole))
                {
                    _logger.LogWarning("User role not found in token for UserID={UserId}", userId);
                    return Unauthorized(new ApiResponse
                    {
                        Success = false,
                        Message = "Không xác định được vai trò người dùng",
                        Data = new[] { "Token không chứa thông tin vai trò" }
                    });
                }

                if (!HasAccessToConversation(conversation, userId.Value, userRole, departmentId))
                {
                    _logger.LogWarning("Access denied: UserID={UserId}, ConversationID={ConversationId}", userId, request.ConversationID);
                    return Unauthorized(new ApiResponse
                    {
                        Success = false,
                        Message = "CẢNH BÁO: Bạn không có quyền gửi tin nhắn trong cuộc trò chuyện này",
                        Data = new[] { "Vui lòng kiểm tra quyền truy cập của bạn" }
                    });
                }

                if (request.ReceiverID != null)
                {
                    var receiver = await db.Users.Include(u => u.Role).FirstOrDefaultAsync(u => u.UserID == request.ReceiverID);
                    if (receiver == null)
                    {
                        _logger.LogWarning("Receiver not found: ReceiverID={ReceiverId}", request.ReceiverID);
                        return BadRequest(new ApiResponse
                        {
                            Success = false,
                            Message = "Người nhận không tồn tại",
                            Data = new[] { $"Không tìm thấy người dùng với ID = {request.ReceiverID}" }
                        });
                    }

                    var receiverRole = receiver.Role?.RoleName ?? string.Empty;
                    if (userRole == "Nhân viên" &&
                        !(receiverRole == "Trưởng phòng" && receiver.DepartmentID == departmentId ||
                          receiverRole == "Nhân viên" && receiver.DepartmentID == departmentId))
                    {
                        _logger.LogWarning("Access denied: Nhân viên (UserID={UserId}) cannot send to ReceiverID={ReceiverId}, ReceiverRole={ReceiverRole}, ReceiverDepartmentID={ReceiverDepartmentId}",
                            userId, request.ReceiverID, receiverRole, receiver.DepartmentID);
                        return Unauthorized(new ApiResponse
                        {
                            Success = false,
                            Message = "CẢNH BÁO: Bạn chỉ có thể gửi tin nhắn cho nhân viên hoặc trưởng phòng trong phòng ban của mình",
                            Data = new[] { $"UserID = {request.ReceiverID} không hợp lệ" }
                        });
                    }
                    else if (userRole == "Trưởng phòng" &&
                             !(receiverRole == "Nhân viên" && receiver.DepartmentID == departmentId ||
                               receiverRole == "Trưởng phòng" ||
                               receiverRole == "Giám đốc"))
                    {
                        _logger.LogWarning("Access denied: Trưởng phòng (UserID={UserId}) cannot send to ReceiverID={ReceiverId}, ReceiverRole={ReceiverRole}, ReceiverDepartmentID={ReceiverDepartmentId}",
                            userId, request.ReceiverID, receiverRole, receiver.DepartmentID);
                        return Unauthorized(new ApiResponse
                        {
                            Success = false,
                            Message = "CẢNH BÁO: Bạn chỉ có thể gửi tin nhắn cho nhân viên trong phòng ban, các trưởng phòng khác, hoặc giám đốc",
                            Data = new[] { $"UserID = {request.ReceiverID} không hợp lệ" }
                        });
                    }
                }

                DateTime now = DateTime.Now; // Sử dụng local time thay vì UTC

                var message = new Message
                {
                    ConversationID = request.ConversationID,
                    SenderID = userId.Value,
                    ReceiverID = request.ReceiverID,
                    Content = request.Content,
                    SentAt = now,
                    IsRead = false,
                    Status = "sent"
                };

                db.Messages.Add(message);
                conversation.LastMessageAt = now; // Consistent với message time
                await db.SaveChangesAsync();

                var messageResponse = GetMessageResponse(message);
                var notificationMessage = $"{user.FullName} đã gửi một tin nhắn mới";

                //  Chỉ gửi tin nhắn nếu messageResponse không null
                await hubContext.Clients.Group($"Conversation_{request.ConversationID}")
                    .SendAsync("ReceiveMessage", messageResponse);

                // Tạo và gửi thông báo cho người nhận
                var participants = db.ConversationParticipants
                    .Where(cp => cp.ConversationID == request.ConversationID && cp.UserID != userId)
                    .Select(cp => cp.UserID)
                    .ToList();

                foreach (var participantId in participants)
                {
                    var notification = new Notification
                    {
                        UserID = participantId,
                        Message = notificationMessage,
                        IsRead = false,
                        CreatedAt = now,
                        MessageID = message.MessageID
                    };
                    db.Notifications.Add(notification);
                }
                await db.SaveChangesAsync();

                // Gửi thông báo (KHÔNG gửi tin nhắn lần nữa)
                if (participants.Any())
                {
                    await hubContext.Clients.Group($"Conversation_{request.ConversationID}")
                        .SendAsync("ReceiveNotification", new NotificationResponse
                        {
                            NotificationID = db.Notifications.Max(n => n.NotificationID),
                            UserID = participants.First(),
                            Message = notificationMessage,
                            IsRead = false,
                            CreatedAt = now.ToString("dd/MM/yyyy HH:mm:ss"),
                            MessageID = message.MessageID
                        });
                }

                return Ok(new ApiResponse
                {
                    Success = true,
                    Message = "Gửi tin nhắn thành công",
                    Data = new
                    {
                        MessageID = message.MessageID,
                        SentAt = message.SentAt.ToString("dd/MM/yyyy HH:mm:ss")
                    }
                });
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Error in SendMessage for ConversationID={ConversationId}, UserID={UserId}", request.ConversationID, userId ?? 0);
                return StatusCode(500, new ApiResponse
                {
                    Success = false,
                    Message = "Đã xảy ra lỗi khi gửi tin nhắn",
                    Data = new[] { ex.Message }
                });
            }
        }

        [HttpGet("users")]
        [Authorize]
        public async Task<IActionResult> GetUsers()
        {
            try
            {
                var currentUserId = GetCurrentUserId();
                var currentUserRole = GetCurrentUserRole();
                var currentUserDepartmentId = GetCurrentUserDepartmentId();

                IQueryable<User> query = db.Users
                    .Include(u => u.Role)
                    .Include(u => u.Department)
                    .Where(u => u.UserID != currentUserId);

                switch (currentUserRole)
                {
                    case "Giám đốc":
                        query = query.Where(u => u.Role.RoleName == "Trưởng phòng");
                        break;

                    case "Trưởng phòng":
                        query = query.Where(u =>
                            (u.DepartmentID == currentUserDepartmentId && u.Role.RoleName == "Nhân viên") ||
                            u.Role.RoleName == "Trưởng phòng" ||
                            u.Role.RoleName == "Giám đốc"
                        );
                        break;

                    case "Nhân viên":
                        query = query.Where(u =>
                            (u.DepartmentID == currentUserDepartmentId && (u.Role.RoleName == "Nhân viên" || u.Role.RoleName == "Trưởng phòng"))
                        );
                        break;

                    default:
                        query = query.Where(u => false);
                        break;
                }

                var users = await query.OrderBy(u => u.FullName).ToListAsync();

                return Ok(new ApiResponse
                {
                    Success = true,
                    Message = "Lấy danh sách người dùng thành công",
                    Data = users.Select(u => new UserOptionResponse
                    {
                        UserID = u.UserID,
                        FullName = u.FullName ?? string.Empty,
                        Avatar = u.Avatar ?? string.Empty,
                        RoleName = u.Role?.RoleName ?? string.Empty,
                        DepartmentName = u.Department?.DepartmentName ?? string.Empty
                    }).ToList()
                });
            }
            catch (Exception ex)
            {
                return StatusCode(500, new ApiResponse
                {
                    Success = false,
                    Message = "Đã xảy ra lỗi trong khi lấy danh sách người dùng",
                    Data = new[] { ex.Message }
                });
            }
        }

        [HttpGet("notifications")]
        [Authorize]
        public async Task<IActionResult> GetNotifications([FromQuery] int? page)
        {
            try
            {
                var userId = GetCurrentUserId();

                IQueryable<Notification> query = db.Notifications
                    .Where(n => n.UserID == userId);

                int totalRecords = await query.CountAsync();

                if (page == null || page < 1)
                {
                    page = 1;
                }

                query = query.OrderByDescending(n => n.CreatedAt)
                             .Skip((page.Value - 1) * PAGE_SIZE)
                             .Take(PAGE_SIZE);

                var notifications = await query.ToListAsync();

                return Ok(new ApiResponse
                {
                    Success = true,
                    Message = "Lấy danh sách thông báo thành công",
                    Data = new
                    {
                        Notifications = notifications.Select(n => new NotificationResponse
                        {
                            NotificationID = n.NotificationID,
                            UserID = n.UserID ?? 0,
                            Message = n.Message ?? string.Empty,
                            IsRead = n.IsRead ?? false,
                            CreatedAt = n.CreatedAt != null ? n.CreatedAt.Value.ToString("dd/MM/yyyy HH:mm:ss") : string.Empty,
                            MessageID = n.MessageID
                        }).ToList(),
                        TotalRecords = totalRecords,
                        CurrentPage = page,
                        PageSize = PAGE_SIZE
                    }
                });
            }
            catch (Exception ex)
            {
                return StatusCode(500, new ApiResponse
                {
                    Success = false,
                    Message = "Đã xảy ra lỗi trong khi lấy danh sách thông báo",
                    Data = new[] { ex.Message }
                });
            }
        }

        [HttpPatch("notifications/{id}/read")]
        [Authorize]
        public async Task<IActionResult> MarkNotificationAsRead(int id)
        {
            if (id <= 0)
            {
                return BadRequest(new ApiResponse
                {
                    Success = false,
                    Message = "Dữ liệu không hợp lệ",
                    Data = new[] { "ID không được để trống hoặc nhỏ hơn 1" }
                });
            }

            try
            {
                var userId = GetCurrentUserId();

                var notification = await db.Notifications
                    .FirstOrDefaultAsync(n => n.NotificationID == id && n.UserID == userId);

                if (notification == null)
                {
                    return NotFound(new ApiResponse
                    {
                        Success = false,
                        Message = "Không tìm thấy thông báo",
                        Data = new[] { $"Không tìm thấy thông báo với ID = {id}" }
                    });
                }

                notification.IsRead = true;
                await db.SaveChangesAsync();

                await hubContext.Clients.User(userId.ToString())
                    .SendAsync("UpdateNotification", new NotificationResponse
                    {
                        NotificationID = notification.NotificationID,
                        UserID = notification.UserID ?? 0,
                        Message = notification.Message ?? string.Empty,
                        IsRead = notification.IsRead ?? false,
                        CreatedAt = notification.CreatedAt != null
                            ? notification.CreatedAt.Value.ToString("dd/MM/yyyy HH:mm:ss")
                            : string.Empty,
                        MessageID = notification.MessageID
                    });

                return Ok(new ApiResponse
                {
                    Success = true,
                    Message = "Đánh dấu thông báo là đã đọc thành công",
                    Data = new { notification.NotificationID }
                });
            }
            catch (Exception ex)
            {
                return StatusCode(500, new ApiResponse
                {
                    Success = false,
                    Message = "Đã xảy ra lỗi khi đánh dấu thông báo là đã đọc",
                    Data = new[] { ex.Message }
                });
            }
        }
    }
}