using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using System;
using System.Linq;
using System.Security.Claims;
using System.Threading.Tasks;
using TaskManagement.Server.Models;
using TaskManagement.Server.ViewModels;
using ModelsTask = TaskManagement.Server.Models.Task;

namespace TaskManagement.Server.Controllers
{
    [Route("api/dashboard")]
    [ApiController]
    [Authorize]
    public class DashboardController : ControllerBase
    {
        #region Variables
        private readonly DBContext db;
        #endregion

        #region Constructors+DI
        public DashboardController(DBContext context)
        {
            db = context;
        }
        #endregion

        #region Helpers
        private string? GetCurrentUserRole()
        {
            return HttpContext.User.FindFirst(ClaimTypes.Role)?.Value;
        }

        private int GetCurrentUserId()
        {
            var userIdClaim = HttpContext.User.FindFirst(ClaimTypes.NameIdentifier)?.Value;
            return userIdClaim != null ? int.Parse(userIdClaim) : throw new UnauthorizedAccessException("User ID not found in token");
        }

        private TaskResponse? GetTaskResponse(ModelsTask? task)
        {
            if (task == null)
            {
                return null;
            }

            var assignees = db.TaskAssignments
                .Where(ta => ta.TaskID == task.TaskID)
                .Include(ta => ta.Assignee)
                    .ThenInclude(u => u.Role)
                .Include(ta => ta.Assignee)
                    .ThenInclude(u => u.Department)
                .ToList()
                .Select(ta => new UserResponse
                {
                    UserID = ta.AssigneeID ?? 0,
                    FullName = ta.Assignee?.FullName ?? string.Empty,
                    Avatar = ta.Assignee?.Avatar ?? string.Empty,
                    RoleID = ta.Assignee?.RoleID,
                    RoleName = ta.Assignee?.Role?.RoleName ?? string.Empty,
                    DepartmentID = ta.Assignee?.DepartmentID,
                    DepartmentName = ta.Assignee?.Department?.DepartmentName ?? string.Empty
                })
                .ToList();

            var creator = task.Creator ?? new User { FullName = string.Empty, Avatar = string.Empty };
            var department = task.Department ?? new Department { DepartmentName = string.Empty };
            var project = task.Project ?? new Project { ProjectName = string.Empty };
            var status = task.Status ?? new Models.TaskStatus { StatusName = string.Empty };

            return new TaskResponse(
                task.TaskID,
                task.Title ?? string.Empty,
                task.Description ?? string.Empty,
                task.CreatorID,
                creator.FullName,
                creator.Avatar,
                task.DepartmentID,
                department.DepartmentName,
                task.ProjectID,
                project.ProjectName,
                task.StartDate.HasValue ? task.StartDate.Value.ToString("dd/MM/yyyy HH:mm:ss") : string.Empty,
                task.EndDate.HasValue ? task.EndDate.Value.ToString("dd/MM/yyyy HH:mm:ss") : string.Empty,
                task.Priority ?? string.Empty,
                task.StatusID,
                status.StatusName,
                task.CreatedAt.HasValue ? task.CreatedAt.Value.ToString("dd/MM/yyyy HH:mm:ss") : string.Empty,
                assignees
            );
        }
        #endregion

        #region Endpoints
        /// <summary>
        /// Lấy danh sách 10 công việc gần đây nhất
        /// </summary>
        /// <returns>
        /// - 200 OK: Danh sách công việc
        /// - 500 InternalServerError: Lỗi server
        /// </returns>
        /// <remarks>
        /// Phân quyền tự động:
        /// - Nhân viên: Chỉ thấy task được giao hoặc tự tạo
        /// - Các vai trò khác: Thấy tất cả task
        /// </remarks>
        [HttpGet("recent-tasks")]
        public async Task<IActionResult> GetRecentTasks()
        {
            try
            {
                IQueryable<ModelsTask> query = db.Tasks
                    .Include(t => t.Creator)
                    .Include(t => t.Department)
                    .Include(t => t.Project)
                    .Include(t => t.Status);

                var currentUserId = GetCurrentUserId();
                var currentUserRole = GetCurrentUserRole();

                // Nếu là Nhân viên, chỉ lấy task được giao hoặc tự tạo
                if (currentUserRole == "Nhân viên")
                {
                    query = query.Where(t =>
                        t.CreatorID == currentUserId ||
                        t.TaskAssignments.Any(a => a.AssigneeID == currentUserId)
                    );
                }

                // Lấy 10 task mới nhất sử dụng query đã lọc
                var tasks = await query
                    .OrderByDescending(t => t.CreatedAt)
                    .Take(10)
                    .ToListAsync();

                var data = tasks.Select(t => GetTaskResponse(t)).Where(t => t != null).ToList();

                return Ok(new ApiResponse
                {
                    Success = true,
                    Message = "Lấy danh sách công việc gần đây thành công",
                    Data = data
                });
            }
            catch (Exception ex)
            {
                Console.WriteLine($"Error in GetRecentTasks: {ex.Message}\n{ex.StackTrace}");
                return StatusCode(500, new ApiResponse
                {
                    Success = false,
                    Message = "Đã xảy ra lỗi trong khi lấy danh sách công việc gần đây",
                    Data = new[] { ex.Message }
                });
            }
        }

        /// <summary>
        /// Lấy danh sách các deadline sắp tới (10 task gần deadline nhất)
        /// </summary>
        /// <returns>
        /// - 200 OK: Danh sách thông báo deadline
        /// - 500 InternalServerError: Lỗi server
        /// </returns>
        /// <remarks>
        /// Mỗi thông báo bao gồm:
        /// - Thông tin task
        /// - Số ngày còn lại đến deadline
        /// - Message cảnh báo
        /// Phân quyền tự động:
        /// - Nhân viên: Chỉ thấy task được giao hoặc tự tạo
        /// - Các vai trò khác: Thấy tất cả task
        /// </remarks>
        [HttpGet("upcoming-deadlines")]
        public async Task<IActionResult> GetUpcomingDeadlines()
        {
            try
            {
                IQueryable<ModelsTask> query = db.Tasks
                    .Include(t => t.Creator)
                    .Include(t => t.Department)
                    .Include(t => t.Project)
                    .Include(t => t.Status)
                    .Where(t => t.EndDate.HasValue && // Có deadline
                               t.EndDate >= DateTime.UtcNow); // Chưa quá hạn

                var currentUserId = GetCurrentUserId();
                var currentUserRole = GetCurrentUserRole();

                // Nếu là Nhân viên, chỉ lấy task được giao hoặc tự tạo
                if (currentUserRole == "Nhân viên")
                {
                    query = query.Where(t =>
                        t.CreatorID == currentUserId ||
                        t.TaskAssignments.Any(a => a.AssigneeID == currentUserId)
                    );
                }

                var tasks = await query
                    .OrderBy(t => t.EndDate)
                    .Take(10)
                    .ToListAsync();

                var notifications = tasks.Select(t =>
                {
                    var taskResponse = GetTaskResponse(t);
                    var daysUntilDue = Math.Max(0, (t.EndDate!.Value.Date - DateTime.UtcNow.Date).Days);

                    string message = daysUntilDue == 0
                        ? $"Công việc \"{t.Title}\" đến hạn hôm nay!"
                        : $"Công việc \"{t.Title}\" sẽ đến hạn trong {daysUntilDue} ngày";

                    return new
                    {
                        TaskID = t.TaskID,
                        Title = t.Title ?? string.Empty,
                        Message = message,
                        DaysUntilDue = daysUntilDue,
                        EndDate = t.EndDate.Value.ToString("dd/MM/yyyy HH:mm:ss"),
                        Task = taskResponse
                    };
                }).ToList();

                return Ok(new ApiResponse
                {
                    Success = true,
                    Message = "Lấy danh sách thông báo thành công",
                    Data = notifications
                });
            }
            catch (Exception ex)
            {
                Console.WriteLine($"Error in GetUpcomingDeadlines: {ex.Message}\n{ex.StackTrace}");
                return StatusCode(500, new ApiResponse
                {
                    Success = false,
                    Message = "Đã xảy ra lỗi trong khi lấy danh sách thông báo",
                    Data = new[] { ex.Message }
                });
            }
        }


        [HttpGet("total-summary")]  // Sửa "toltal" thành "total"
        public async Task<IActionResult> GetTotalSummary()  // Sửa tên method
        {
            try
            {
                var currentUserId = GetCurrentUserId();
                var currentUserRole = GetCurrentUserRole();

                // Query tất cả tasks (không filter theo deadline)
                IQueryable<ModelsTask> baseQuery = db.Tasks
                    .Include(t => t.Creator)
                    .Include(t => t.Department)
                    .Include(t => t.Project)
                    .Include(t => t.Status);

                // Phân quyền
                if (currentUserRole == "Nhân viên")
                {
                    baseQuery = baseQuery.Where(t =>
                        t.CreatorID == currentUserId ||
                        t.TaskAssignments.Any(a => a.AssigneeID == currentUserId)
                    );
                }

                var allTasks = await baseQuery.ToListAsync();

                // Tính toán thống kê
                var totalTasks = allTasks.Count;
                var inProgressTasks = allTasks.Count(t => t.Status?.StatusName == "Đang thực hiện");
                var completedTasks = allTasks.Count(t => t.Status?.StatusName == "Hoàn thành");
                var overdueTasks = allTasks.Count(t =>
                    t.EndDate.HasValue &&
                    t.EndDate < DateTime.UtcNow &&
                    t.Status?.StatusName != "Hoàn thành"
                );

                return Ok(new ApiResponse
                {
                    Success = true,
                    Message = "Lấy tổng quan thành công",
                    Data = new
                    {
                        TotalTasks = totalTasks,
                        InProgressTasks = inProgressTasks,
                        CompletedTasks = completedTasks,
                        OverdueTasks = overdueTasks
                    }
                });
            }
            catch (Exception ex)
            {
                Console.WriteLine($"Error in GetTotalSummary: {ex.Message}\n{ex.StackTrace}");
                return StatusCode(500, new ApiResponse
                {
                    Success = false,
                    Message = "Đã xảy ra lỗi trong khi lấy tổng quan",
                    Data = new[] { ex.Message }
                });
            }
        }



        #endregion
    }
}