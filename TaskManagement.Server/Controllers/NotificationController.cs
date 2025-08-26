using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using System.Security.Claims;
using TaskManagement.Server.Models;
using TaskManagement.Server.ViewModels;

namespace TaskManagement.Server.Controllers
{
    [Route("api/notification")]
    [ApiController]
    [Authorize] 
    public class NotificationController : ControllerBase
    {
        private readonly DBContext _db;

        public NotificationController(DBContext context)
        {
            _db = context;
        }

        #region Helpers
        /// <summary>
        /// Lấy UserID của người dùng hiện tại từ JWT token.
        /// </summary>
        /// <returns>UserID của người dùng đã đăng nhập.</returns>
        /// <exception cref="UnauthorizedAccessException">Khi không tìm thấy UserID trong token.</exception>
        private int GetCurrentUserId()
        {
            var userIdClaim = HttpContext.User.FindFirst(ClaimTypes.NameIdentifier)?.Value;
            return userIdClaim != null ? int.Parse(userIdClaim) : throw new UnauthorizedAccessException("User ID not found in token");
        }

        /// <summary>
        /// Chuyển đổi một khoảng thời gian thành chuỗi dạng "x [đơn vị] trước".
        /// </summary>
        /// <param name="dateTime">Thời gian cần chuyển đổi.</param>
        /// <returns>Chuỗi biểu thị khoảng thời gian đã trôi qua.</returns>
        private static string GetTimeAgo(DateTime? dateTime)
        {
            if (!dateTime.HasValue)
            {
                return string.Empty;
            }

            var timeSpan = DateTime.UtcNow - dateTime.Value;

            if (timeSpan.TotalSeconds < 60)
                return $"{Math.Floor(timeSpan.TotalSeconds)} giây trước";
            if (timeSpan.TotalMinutes < 60)
                return $"{Math.Floor(timeSpan.TotalMinutes)} phút trước";
            if (timeSpan.TotalHours < 24)
                return $"{Math.Floor(timeSpan.TotalHours)} giờ trước";
            if (timeSpan.TotalDays < 30)
                return $"{Math.Floor(timeSpan.TotalDays)} ngày trước";
            if (timeSpan.TotalDays < 365)
                return $"{Math.Floor(timeSpan.TotalDays / 30)} tháng trước";

            return $"{Math.Floor(timeSpan.TotalDays / 365)} năm trước";
        }
        #endregion

        #region Endpoints
        /// <summary>
        /// Lấy danh sách thông báo cho người dùng đang đăng nhập.
        /// </summary>
        /// <param name="limit">Số lượng thông báo tối đa cần lấy (mặc định là 10).</param>
        /// <returns>
        /// - 200 OK: Danh sách thông báo và số lượng chưa đọc.
        /// - 401 Unauthorized: Chưa đăng nhập.
        /// - 500 InternalServerError: Lỗi server.
        /// </returns>
        [HttpGet]
        public async Task<IActionResult> GetMyNotifications([FromQuery] int limit = 10)
        {
            try
            {
                var currentUserId = GetCurrentUserId();
                var notifications = await _db.Notifications
                    .Where(n => n.UserID == currentUserId)
                    .OrderByDescending(n => n.CreatedAt)
                    .Take(limit)
                    .Select(n => new NotificationResponse
                    {
                        NotificationID = n.NotificationID,
                        Message = n.Message,
                        IsRead = n.IsRead ?? false,
                        CreatedAt = n.CreatedAt.HasValue ? n.CreatedAt.Value.ToString("dd/MM/yyyy HH:mm:ss") : string.Empty,
                        TimeAgo = GetTimeAgo(n.CreatedAt)
                    })
                    .ToListAsync();
                var unreadCount = await _db.Notifications
                    .CountAsync(n => n.UserID == currentUserId && (n.IsRead == null || n.IsRead == false));
                var responseData = new
                {
                    notifications = notifications, // Sử dụng chữ thường để khớp với frontend
                    unreadCount = unreadCount
                };
                return Ok(new ApiResponse
                {
                    Success = true,
                    Message = "Lấy danh sách thông báo thành công.",
                    Data = responseData
                });
            }
            catch (UnauthorizedAccessException ex)
            {
                return Unauthorized(new ApiResponse { Success = false, Message = ex.Message });
            }
            catch (Exception ex)
            {
                Console.WriteLine($"Error in GetMyNotifications: {ex.Message}\n{ex.StackTrace}");
                return StatusCode(500, new ApiResponse
                {
                    Success = false,
                    Message = "Đã xảy ra lỗi trong khi lấy danh sách thông báo.",
                    Data = new[] { ex.Message }
                });
            }
        }

        /// <summary>
        /// Đánh dấu tất cả thông báo của người dùng là đã đọc.
        /// </summary>
        /// <returns>
        /// - 200 OK: Đánh dấu thành công.
        /// - 401 Unauthorized: Chưa đăng nhập.
        /// - 500 InternalServerError: Lỗi server.
        /// </returns>
        [HttpPost("mark-all-as-read")]
        public async Task<IActionResult> MarkAllAsRead()
        {
            try
            {
                var currentUserId = GetCurrentUserId();

                // Sử dụng ExecuteUpdateAsync để cập nhật hàng loạt hiệu quả hơn
                await _db.Notifications
                    .Where(n => n.UserID == currentUserId && (n.IsRead == null || n.IsRead == false))
                    .ExecuteUpdateAsync(s => s.SetProperty(n => n.IsRead, true));

                return Ok(new ApiResponse
                {
                    Success = true,
                    Message = "Đã đánh dấu tất cả thông báo là đã đọc."
                });
            }
            catch (UnauthorizedAccessException ex)
            {
                return Unauthorized(new ApiResponse { Success = false, Message = ex.Message });
            }
            catch (Exception ex)
            {
                Console.WriteLine($"Error in MarkAllAsRead: {ex.Message}\n{ex.StackTrace}");
                return StatusCode(500, new ApiResponse
                {
                    Success = false,
                    Message = "Đã xảy ra lỗi khi đánh dấu thông báo.",
                    Data = new[] { ex.Message }
                });
            }
        }
        #endregion
    }
}
