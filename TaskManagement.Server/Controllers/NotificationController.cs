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

    public class NotificationController : ControllerBase
    {
        private readonly DBContext _db;

        public NotificationController(DBContext context)
        {
            _db = context;
        }

        #region Helpers

        #endregion

        #region Endpoints
        [HttpGet("my-notifications")]
        [Authorize]
        public async Task<IActionResult> GetMyNotifications()
        {
            // Lấy userId từ Claims
            var userId = User.FindFirstValue(ClaimTypes.NameIdentifier);

            // Lấy role từ Claims
            var role = User.FindFirstValue(ClaimTypes.Role);

            // Kiểm tra nếu userId là null hoặc rỗng
            if (string.IsNullOrEmpty(userId))
            {
                return Unauthorized(new { message = "User ID not found in token." });
            }

            // Lấy danh sách thông báo của người dùng, bao gồm thông tin người gửi
            var notifications = await _db.Notifications
                .Where(n => n.UserID.ToString() == userId)
                .Include(n => n.MessageNavigation)
                    .ThenInclude(m => m.Sender) // Include Sender user details
                .OrderByDescending(n => n.CreatedAt)
                .ToListAsync();

            return Ok(notifications);
        }

        #endregion
    }
}