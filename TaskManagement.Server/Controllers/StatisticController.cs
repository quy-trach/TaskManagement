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
    [Route("api/statistics")]
    [ApiController]
    [Authorize]
    public class StatisticController : ControllerBase
    {
        #region Variables
        private readonly DBContext db;
        #endregion

        #region Constructors+DI
        public StatisticController(DBContext context)
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

        private IQueryable<ModelsTask> ApplyRoleFilter(IQueryable<ModelsTask> query)
        {
            var currentUserId = GetCurrentUserId();
            var currentUserRole = GetCurrentUserRole();

            if (currentUserRole == "Nhân viên")
            {
                query = query.Where(t =>
                    t.CreatorID == currentUserId ||
                    t.TaskAssignments.Any(a => a.AssigneeID == currentUserId)
                );
            }
            else if (currentUserRole == "Trưởng phòng")
            {
                var departmentId = db.Users
                    .Where(u => u.UserID == currentUserId)
                    .Select(u => u.DepartmentID)
                    .FirstOrDefault();
                if (departmentId.HasValue)
                {
                    query = query.Where(t => t.DepartmentID == departmentId.Value);
                }
                else
                {
                    // Trưởng phòng không có phòng ban thì không thấy task nào
                    query = query.Where(t => false);
                }
            }
            return query;
        }
        #endregion

        #region Endpoints

        /// <summary>
        /// Lấy thống kê tổng quan công việc theo trạng thái
        /// </summary>
        /// <returns>
        /// - 200 OK: Thống kê số lượng theo từng trạng thái
        /// - 500 InternalServerError: Lỗi server
        /// </returns>
        [HttpGet("overview")]
        public async Task<IActionResult> GetTaskOverview()
        {
            try
            {
                var query = db.Tasks.AsQueryable();
                query = ApplyRoleFilter(query);

                var statusStats = await query
                    .Include(t => t.Status)
                    .GroupBy(t => new { t.StatusID, t.Status.StatusName })
                    .Select(g => new
                    {
                        StatusID = g.Key.StatusID,
                        StatusName = g.Key.StatusName ?? "Không xác định",
                        Count = g.Count()
                    })
                    .OrderBy(s => s.StatusID)
                    .ToListAsync();

                // Tính tổng
                var total = statusStats.Sum(s => s.Count);

                // Tính toán quá hạn (task có EndDate < hiện tại và chưa hoàn thành)
                var overdueTasks = await query
                    .Where(t => t.EndDate.HasValue &&
                               t.EndDate < DateTime.UtcNow &&
                               t.Status.StatusName != "Hoàn thành")
                    .CountAsync();

                var result = new
                {
                    StatusStats = statusStats,
                    Total = total,
                    OverdueCount = overdueTasks
                };

                return Ok(new ApiResponse
                {
                    Success = true,
                    Message = "Lấy thống kê tổng quan thành công",
                    Data = result
                });
            }
            catch (Exception ex)
            {
                Console.WriteLine($"Error in GetTaskOverview: {ex.Message}\n{ex.StackTrace}");
                return StatusCode(500, new ApiResponse
                {
                    Success = false,
                    Message = "Đã xảy ra lỗi trong khi lấy thống kê tổng quan",
                    Data = new[] { ex.Message }
                });
            }
        }

        /// <summary>
        /// Lấy thống kê công việc theo phòng ban
        /// </summary>
        /// <returns>
        /// - 200 OK: Thống kê theo phòng ban với breakdown theo trạng thái
        /// - 500 InternalServerError: Lỗi server
        /// </returns>
        [HttpGet("department")]
        public async Task<IActionResult> GetDepartmentStatistics()
        {
            try
            {
                var query = db.Tasks.AsQueryable();
                query = ApplyRoleFilter(query);

                var departmentStats = await query
                    .Include(t => t.Department)
                    .Include(t => t.Status)
                    .GroupBy(t => new {
                        t.DepartmentID,
                        DepartmentName = t.Department.DepartmentName ?? "Không xác định"
                    })
                    .Select(g => new
                    {
                        DepartmentID = g.Key.DepartmentID,
                        DepartmentName = g.Key.DepartmentName,
                        Tasks = g.GroupBy(t => new { t.StatusID, t.Status.StatusName })
                                 .Select(sg => new
                                 {
                                     StatusID = sg.Key.StatusID,
                                     StatusName = sg.Key.StatusName ?? "Không xác định",
                                     Count = sg.Count()
                                 }).ToList(),
                        TotalTasks = g.Count(),
                        // Tính quá hạn cho từng phòng ban
                        OverdueTasks = g.Count(t => t.EndDate.HasValue &&
                                                  t.EndDate < DateTime.UtcNow &&
                                                  t.Status.StatusName != "Hoàn thành")
                    })
                    .OrderBy(d => d.DepartmentName)
                    .ToListAsync();

                return Ok(new ApiResponse
                {
                    Success = true,
                    Message = "Lấy thống kê theo phòng ban thành công",
                    Data = departmentStats
                });
            }
            catch (Exception ex)
            {
                Console.WriteLine($"Error in GetDepartmentStatistics: {ex.Message}\n{ex.StackTrace}");
                return StatusCode(500, new ApiResponse
                {
                    Success = false,
                    Message = "Đã xảy ra lỗi trong khi lấy thống kê theo phòng ban",
                    Data = new[] { ex.Message }
                });
            }
        }

        /// <summary>
        /// Lấy thống kê theo thời gian (7 ngày gần đây)
        /// </summary>
        /// <returns>
        /// - 200 OK: Thống kê số lượng task được tạo theo ngày
        /// - 500 InternalServerError: Lỗi server
        /// </returns>
        [HttpGet("timeline")]
        public async Task<IActionResult> GetTimelineStatistics()
        {
            try
            {
                var query = db.Tasks.AsQueryable();
                query = ApplyRoleFilter(query);

                var sevenDaysAgo = DateTime.UtcNow.AddDays(-7);

                var timelineStats = await query
                    .Where(t => t.CreatedAt.HasValue && t.CreatedAt >= sevenDaysAgo)
                    .GroupBy(t => t.CreatedAt.Value.Date)
                    .Select(g => new
                    {
                        Date = g.Key.ToString("dd/MM/yyyy"),
                        Count = g.Count()
                    })
                    .OrderBy(t => t.Date)
                    .ToListAsync();

                return Ok(new ApiResponse
                {
                    Success = true,
                    Message = "Lấy thống kê timeline thành công",
                    Data = timelineStats
                });
            }
            catch (Exception ex)
            {
                Console.WriteLine($"Error in GetTimelineStatistics: {ex.Message}\n{ex.StackTrace}");
                return StatusCode(500, new ApiResponse
                {
                    Success = false,
                    Message = "Đã xảy ra lỗi trong khi lấy thống kê timeline",
                    Data = new[] { ex.Message }
                });
            }
        }

        /// <summary>
        /// Lấy thống kê theo độ ưu tiên
        /// </summary>
        /// <returns>
        /// - 200 OK: Thống kê số lượng task theo độ ưu tiên
        /// - 500 InternalServerError: Lỗi server
        /// </returns>
        [HttpGet("priority")]
        public async Task<IActionResult> GetPriorityStatistics()
        {
            try
            {
                var query = db.Tasks.AsQueryable();
                query = ApplyRoleFilter(query);

                var priorityStats = await query
                    .GroupBy(t => t.Priority ?? "Không xác định")
                    .Select(g => new
                    {
                        Priority = g.Key,
                        Count = g.Count()
                    })
                    .OrderBy(p => p.Priority)
                    .ToListAsync();

                return Ok(new ApiResponse
                {
                    Success = true,
                    Message = "Lấy thống kê theo độ ưu tiên thành công",
                    Data = priorityStats
                });
            }
            catch (Exception ex)
            {
                Console.WriteLine($"Error in GetPriorityStatistics: {ex.Message}\n{ex.StackTrace}");
                return StatusCode(500, new ApiResponse
                {
                    Success = false,
                    Message = "Đã xảy ra lỗi trong khi lấy thống kê theo độ ưu tiên",
                    Data = new[] { ex.Message }
                });
            }
        }

        /// <summary>
        /// Lấy thống kê tổng hợp cho dashboard
        /// </summary>
        /// <returns>
        /// - 200 OK: Tất cả thống kê cần thiết cho trang thống kê
        /// - 500 InternalServerError: Lỗi server
        /// </returns>
        [HttpGet("dashboard")]
        public async Task<IActionResult> GetDashboardStatistics()
        {
            try
            {
                // Áp dụng bộ lọc quyền một lần duy nhất
                var baseQuery = db.Tasks.AsQueryable();
                var query = ApplyRoleFilter(baseQuery);

                // Thống kê tổng quan
                var overviewTask = query
                    .GroupBy(t => new { t.StatusID, t.Status.StatusName })
                    .Select(g => new
                    {
                        StatusID = g.Key.StatusID,
                        StatusName = g.Key.StatusName ?? "Không xác định",
                        Count = g.Count()
                    })
                    .OrderBy(s => s.StatusID)
                    .ToListAsync();

                // Thống kê theo phòng ban
                var departmentTask = query
                    .GroupBy(t => new {
                        t.DepartmentID,
                        DepartmentName = t.Department.DepartmentName ?? "Không xác định"
                    })
                    .Select(g => new
                    {
                        DepartmentID = g.Key.DepartmentID,
                        DepartmentName = g.Key.DepartmentName,
                        Tasks = g.GroupBy(t => new { t.StatusID, t.Status.StatusName })
                                 .Select(sg => new
                                 {
                                     StatusID = sg.Key.StatusID,
                                     StatusName = sg.Key.StatusName ?? "Không xác định",
                                     Count = sg.Count()
                                 }).ToList(),
                        TotalTasks = g.Count(),
                        OverdueTasks = g.Count(t => t.EndDate.HasValue &&
                                                  t.EndDate < DateTime.UtcNow &&
                                                  t.Status.StatusName != "Hoàn thành")
                    })
                    .OrderBy(d => d.DepartmentName)
                    .ToListAsync();

                // --- SỬA LỖI TẠI ĐÂY ---
                // Tính quá hạn tổng
                // Thêm .Include(t => t.Status) vào truy vấn này để có thể truy cập t.Status.StatusName
                var overdueTask = query
                    .Include(t => t.Status) // THÊM DÒNG NÀY
                    .Where(t => t.EndDate.HasValue &&
                               t.EndDate < DateTime.UtcNow &&
                               t.Status.StatusName != "Hoàn thành")
                    .CountAsync();

                // Sửa lại cú pháp await cho đúng
                await System.Threading.Tasks.Task.WhenAll(overviewTask, departmentTask, overdueTask);

                // Lấy kết quả sau khi tất cả đã hoàn thành
                var overview = await overviewTask;
                var department = await departmentTask;
                var overdue = await overdueTask;

                var result = new
                {
                    Overview = new
                    {
                        StatusStats = overview,
                        Total = overview.Sum(s => s.Count),
                        OverdueCount = overdue
                    },
                    Department = department
                };

                return Ok(new ApiResponse
                {
                    Success = true,
                    Message = "Lấy thống kê dashboard thành công",
                    Data = result
                });
            }
            catch (Exception ex)
            {
                // Ghi log chi tiết hơn để dễ debug trong tương lai
                Console.WriteLine($"Error in GetDashboardStatistics: {ex.Message}");
                if (ex.InnerException != null)
                {
                    Console.WriteLine($"--> Inner Exception: {ex.InnerException.Message}");
                }
                Console.WriteLine(ex.StackTrace);

                return StatusCode(500, new ApiResponse
                {
                    Success = false,
                    Message = "Đã xảy ra lỗi phía máy chủ khi lấy thống kê dashboard.",
                    Data = new[] { ex.Message }
                });
            }
        }

        #endregion
    }
}