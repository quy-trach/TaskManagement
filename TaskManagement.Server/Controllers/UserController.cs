using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using System.Security.Claims;
using TaskManagement.Server.Models;
using TaskManagement.Server.ViewModels;

namespace TaskManagement.Server.Controllers
{
    [Route("api/users")]
    [ApiController]
    public class UserController : ControllerBase
    {
        #region Consts
        private const int PAGE_SIZE = 5;
        #endregion

        #region Variables
        private readonly DBContext db;
        #endregion

        #region Constructors+DI
        public UserController(DBContext context)
        {
            db = context;
        }
        #endregion

        #region Helpers
        /// <summary>
        /// Lấy thông tin người dùng theo ID (bao gồm Role và Department).
        /// </summary>
        /// <param name="id">ID của người dùng cần lấy.</param>
        /// <returns>User object hoặc null nếu không tìm thấy.</returns>
        private async Task<User?> GetUserByIdAsync(int id)
        {
            return await db.Users
                .Include(u => u.Role)
                .Include(u => u.Department)
                .FirstOrDefaultAsync(x => x.UserID == id);
        }

        /// <summary>
        /// Lấy ID của người dùng hiện tại từ JWT token.
        /// </summary>
        /// <returns>UserID của người dùng đã đăng nhập.</returns>
        /// <exception cref="UnauthorizedAccessException">Khi không tìm thấy UserID trong token.</exception>
        private int GetCurrentUserId()
        {
            var userIdClaim = HttpContext.User.FindFirst(ClaimTypes.NameIdentifier)?.Value;
            return userIdClaim != null ? int.Parse(userIdClaim) : throw new UnauthorizedAccessException("User ID not found in token");
        }

        /// <summary>
        /// Lấy vai trò (Role) của người dùng hiện tại từ JWT token.
        /// </summary>
        /// <returns>Tên vai trò hoặc null nếu không tìm thấy.</returns>
        private string? GetCurrentUserRole()
        {
            return HttpContext.User.FindFirst(ClaimTypes.Role)?.Value;
        }

        /// <summary>
        /// Chuyển đổi từ Models.User sang UserResponse để trả về client.
        /// </summary>
        /// <param name="user">Đối tượng User cần chuyển đổi.</param>
        /// <returns>UserResponse hoặc null nếu user là null.</returns>
        private UserResponse? GetUserResponse(User? user)
        {
            if (user == null)
            {
                return null;
            }

            return new UserResponse(
                user.UserID,
                user.FullName ?? string.Empty,
                user.Email ?? string.Empty,
                user.Mobile ?? string.Empty,
                user.Address ?? string.Empty,
                user.Password ?? string.Empty,
                user.RoleID,
                user.Role?.RoleName,
                user.DepartmentID,
                user.Department?.DepartmentName,
                user.Status,
                user.CreatedAt?.ToString("dd/MM/yyyy HH:mm:ss") ?? string.Empty,
                user.Avatar ?? string.Empty
            );
        }

        /// <summary>
        /// Hash mật khẩu sử dụng BCrypt.
        /// </summary>
        /// <param name="password">Mật khẩu cần hash.</param>
        /// <returns>Chuỗi đã hash hoặc string.Empty nếu password rỗng.</returns>
        private string HashPassword(string password)
        {
            if (string.IsNullOrEmpty(password))
                return string.Empty;

            return BCrypt.Net.BCrypt.HashPassword(password);
        }
        #endregion

        #region Endpoints
        /// <summary>
        /// Lấy danh sách tất cả người dùng (dạng rút gọn).
        /// </summary>
        /// <returns>
        /// - 200 OK: Danh sách người dùng.
        /// - 500 InternalServerError: Lỗi server.
        [HttpGet("all")]
        public async Task<IActionResult> GetAllUsers()
        {
            try
            {
                var users = await db.Users
                    .Select(u => new
                    {
                        UserID = u.UserID,
                        FullName = u.FullName,
                        Avatar = u.Avatar,
                        Role = u.Role != null ? new
                        {
                            RoleID = u.Role.RoleID,
                            RoleName = u.Role.RoleName
                        } : null,
                        Department = u.Department != null ? new
                        {
                            DepartmentID = u.Department.DepartmentID,
                            DepartmentName = u.Department.DepartmentName
                        } : null
                    })
                    .ToListAsync();

                return Ok(new ApiResponse
                {
                    Success = true,
                    Message = "Lấy danh sách người dùng thành công",
                    Data = users
                });
            }
            catch (Exception ex)
            {
                Console.WriteLine($"Error in GetAllUsers: {ex.Message}\n{ex.StackTrace}");
                return StatusCode(500, new ApiResponse
                {
                    Success = false,
                    Message = "Đã xảy ra lỗi trong khi lấy danh sách người dùng",
                    Data = new[] { ex.Message }
                });
            }
        }

        /// <summary>
        /// Lấy danh sách người dùng với phân trang và bộ lọc.
        /// </summary>
        /// <param name="request">Thông tin lọc và phân trang.</param>
        /// <returns>
        /// - 200 OK: Danh sách người dùng đã lọc + phân trang.
        /// - 400 BadRequest: Dữ liệu đầu vào không hợp lệ.
        /// - 401 Unauthorized: Không có quyền truy cập.
        /// - 500 InternalServerError: Lỗi server.
        /// </returns>
        /// <remarks>
        /// Phân quyền tự động theo vai trò:
        /// - Giám đốc: Xem tất cả.
        /// - Trưởng phòng: Chỉ xem người cùng phòng ban.
        /// - Nhân viên: Chỉ xem thông tin bản thân.
        /// </remarks>
        [HttpGet]
        [Authorize]
        public async Task<IActionResult> GetUsers([FromQuery] FilterListRequest request)
        {
            if (!ModelState.IsValid)
            {
                return BadRequest(new ApiResponse
                {
                    Success = false,
                    Message = "Dữ liệu không hợp lệ",
                    Data = ModelState.Values.SelectMany(x => x.Errors).Select(x => x.ErrorMessage).ToArray()
                });
            }

            try
            {
                IQueryable<User> query = db.Users
                    .Include(u => u.Role)
                    .Include(u => u.Department);

                var currentUserId = GetCurrentUserId();
                var currentUserRole = GetCurrentUserRole();
                var currentUser = await db.Users.FindAsync(currentUserId);
                if (currentUser == null)
                {
                    return Unauthorized(new ApiResponse { Success = false, Message = "Người dùng không tồn tại hoặc token không hợp lệ." });
                }

                // Phân quyền
                if (currentUserRole != "Giám đốc")
                {
                    if (currentUserRole == "Trưởng phòng")
                    {
                        if (currentUser.DepartmentID.HasValue)
                        {
                            query = query.Where(u => u.DepartmentID == currentUser.DepartmentID);
                        }
                        else
                        {
                            query = query.Where(u => u.UserID == currentUserId);
                        }
                    }
                    else if (currentUserRole == "Nhân viên")
                    {
                        query = query.Where(u => u.UserID == currentUserId);
                    }
                    else
                    {
                        return Unauthorized(new ApiResponse { Success = false, Message = "Vai trò không hợp lệ." });
                    }
                }

                if (!string.IsNullOrEmpty(request.Role))
                {
                    if (int.TryParse(request.Role, out int roleId))
                        query = query.Where(x => x.RoleID == roleId);
                }

                if (!string.IsNullOrEmpty(request.Department))
                {
                    if (int.TryParse(request.Department, out int departmentId))
                        query = query.Where(x => x.DepartmentID == departmentId);
                }

                if (!string.IsNullOrEmpty(request.Keyword))
                {
                    query = query.Where(x => x.FullName.ToLower().Contains(request.Keyword.ToLower()) ||
                                            x.Email.ToLower().Contains(request.Keyword.ToLower()));
                }

                int totalRecords = await query.CountAsync();

                query = query.OrderBy(x => x.FullName);

                if (request.Page == null || request.Page < 1)
                {
                    request.Page = 1;
                }

                query = query.Skip((request.Page.Value - 1) * PAGE_SIZE).Take(PAGE_SIZE);

                var users = await query.ToListAsync();
                var data = users.Select(u => new UserResponse(
                    u.UserID,
                    u.FullName ?? string.Empty,
                    u.Email ?? string.Empty,
                    u.Mobile ?? string.Empty,
                    u.Address ?? string.Empty,
                    u.Password ?? string.Empty,
                    u.RoleID,
                    u.Role?.RoleName ?? string.Empty,
                    u.DepartmentID,
                    u.Department?.DepartmentName ?? string.Empty,
                    u.Status,
                    u.CreatedAt?.ToString("dd/MM/yyyy HH:mm:ss") ?? string.Empty,
                    u.Avatar ?? string.Empty
                )).ToList();

                return Ok(new ApiResponse
                {
                    Success = true,
                    Message = "Lấy danh sách dữ liệu thành công",
                    Data = new
                    {
                        Users = data,
                        TotalRecords = totalRecords,
                        CurrentPage = request.Page,
                        PageSize = PAGE_SIZE
                    }
                });
            }
            catch (Exception ex)
            {
                Console.WriteLine($"Error in GetUsers: {ex.Message}\n{ex.StackTrace}");
                return StatusCode(500, new ApiResponse
                {
                    Success = false,
                    Message = "Đã xảy ra lỗi trong khi lấy dữ liệu",
                    Data = new[] { ex.Message }
                });
            }
        }

        /// <summary>
        /// Thêm mới người dùng.
        /// </summary>
        /// <param name="request">Thông tin người dùng cần tạo.</param>
        /// <returns>
        /// - 200 OK: Tạo thành công + ID người dùng.
        /// - 400 BadRequest: Dữ liệu không hợp lệ/email trùng.
        /// - 401 Unauthorized: Không có quyền thêm.
        /// - 500 InternalServerError: Lỗi server.
        /// </returns>
        /// <remarks>
        /// Phân quyền:
        /// - Giám đốc/Trưởng phòng: Được thêm.
        /// - Trưởng phòng chỉ được thêm nhân viên vào phòng ban của mình.
        /// </remarks>
        [HttpPost]
        [Authorize]
        public async Task<IActionResult> AddUser([FromBody] UserRequest request)
        {
            if (!ModelState.IsValid)
            {
                return BadRequest(new ApiResponse
                {
                    Success = false,
                    Message = "Dữ liệu không hợp lệ.",
                    Data = ModelState.Values.SelectMany(v => v.Errors).Select(e => e.ErrorMessage).ToArray()
                });
            }

            try
            {
                var currentUserId = GetCurrentUserId();
                var currentUserRole = GetCurrentUserRole();
                var currentUser = await db.Users.FindAsync(currentUserId);
                if (currentUser == null)
                {
                    return Unauthorized(new ApiResponse { Success = false, Message = "Người dùng không tồn tại hoặc token không hợp lệ." });
                }

                // Kiểm tra quyền
                if (currentUserRole != "Giám đốc" && currentUserRole != "Trưởng phòng")
                {
                    return Unauthorized(new ApiResponse
                    {
                        Success = false,
                        Message = "Chỉ Giám đốc hoặc Trưởng phòng có quyền thêm người dùng."
                    });
                }

                // Trưởng phòng chỉ được thêm nhân viên vào phòng ban của mình
                if (currentUserRole == "Trưởng phòng")
                {
                    if (!currentUser.DepartmentID.HasValue || request.DepartmentID != currentUser.DepartmentID)
                    {
                        return Unauthorized(new ApiResponse
                        {
                            Success = false,
                            Message = "Bạn chỉ có thể thêm người dùng vào phòng ban của mình."
                        });
                    }
                    // Trưởng phòng không được thêm người dùng có vai trò Giám đốc hoặc Trưởng phòng
                    var role = await db.Roles.FindAsync(request.RoleID);
                    if (role != null && (role.RoleName == "Giám đốc" || role.RoleName == "Trưởng phòng"))
                    {
                        return Unauthorized(new ApiResponse
                        {
                            Success = false,
                            Message = "Trưởng phòng không được phép thêm người dùng với vai trò Giám đốc hoặc Trưởng phòng."
                        });
                    }
                }

                var existUser = await db.Users.FirstOrDefaultAsync(x => x.Email == request.Email);
                if (existUser != null)
                {
                    return BadRequest(new ApiResponse
                    {
                        Success = false,
                        Message = "Đã xảy ra lỗi khi thêm mới người dùng.",
                        Data = new[] { $"Email: '{request.Email}' đã tồn tại." }
                    });
                }

                string hashedPassword = HashPassword(request.Password);

                User user = new User
                {
                    FullName = request.FullName,
                    Email = request.Email,
                    Password = hashedPassword,
                    Avatar = request.Avatar,
                    Mobile = request.Mobile,
                    Address = request.Address,
                    RoleID = request.RoleID,
                    DepartmentID = request.DepartmentID,
                    Status = request.Status,
                    CreatedAt = DateTime.Now
                };

                db.Users.Add(user);
                await db.SaveChangesAsync();

                return Ok(new ApiResponse
                {
                    Success = true,
                    Message = "Thêm mới người dùng thành công.",
                    Data = new { user.UserID }
                });
            }
            catch (Exception ex)
            {
                Console.WriteLine($"Error in AddUser: {ex.Message}\n{ex.StackTrace}");
                return BadRequest(new ApiResponse
                {
                    Success = false,
                    Message = "Đã xảy ra lỗi khi thêm mới người dùng.",
                    Data = new[] { ex.Message }
                });
            }
        }

        /// <summary>
        /// Cập nhật thông tin người dùng.
        /// </summary>
        /// <param name="id">ID người dùng cần cập nhật.</param>
        /// <param name="request">Thông tin cập nhật.</param>
        /// <returns>
        /// - 200 OK: Cập nhật thành công.
        /// - 400 BadRequest: Dữ liệu không hợp lệ.
        /// - 401 Unauthorized: Không có quyền chỉnh sửa.
        /// - 404 NotFound: Không tìm thấy người dùng.
        /// - 500 InternalServerError: Lỗi server.
        /// </returns>
        [HttpPut("{id}")]
        [Authorize]
        public async Task<IActionResult> UpdateUser(int id, [FromBody] UserRequest request)
        {
            if (id <= 0)
            {
                return BadRequest(new ApiResponse
                {
                    Success = false,
                    Message = "Dữ liệu không hợp lệ.",
                    Data = new[] { "ID không được để trống hoặc nhỏ hơn 1." }
                });
            }

            if (!ModelState.IsValid)
            {
                return BadRequest(new ApiResponse
                {
                    Success = false,
                    Message = "Dữ liệu không hợp lệ.",
                    Data = ModelState.Values.SelectMany(v => v.Errors).Select(e => e.ErrorMessage).ToArray()
                });
            }

            try
            {
                var user = await GetUserByIdAsync(id);
                if (user == null)
                {
                    return NotFound(new ApiResponse
                    {
                        Success = false,
                        Message = "Không tìm thấy người dùng.",
                        Data = new[] { $"Không tìm thấy người dùng với ID = {id}." }
                    });
                }

                var currentUserId = GetCurrentUserId();
                var currentUserRole = GetCurrentUserRole();
                var currentUser = await db.Users.FindAsync(currentUserId);
                if (currentUser == null)
                {
                    return Unauthorized(new ApiResponse { Success = false, Message = "Người dùng không tồn tại hoặc token không hợp lệ." });
                }

                // Kiểm tra quyền chỉnh sửa
                if (currentUserRole != "Giám đốc")
                {
                    if (currentUserRole == "Nhân viên")
                    {
                        return Unauthorized(new ApiResponse
                        {
                            Success = false,
                            Message = "Bạn không có quyền chỉnh sửa thông tin người dùng."
                        });
                    }
                    else if (currentUserRole == "Trưởng phòng")
                    {
                        if (!currentUser.DepartmentID.HasValue || user.DepartmentID != currentUser.DepartmentID)
                        {
                            return Unauthorized(new ApiResponse
                            {
                                Success = false,
                                Message = "Bạn chỉ có thể chỉnh sửa người dùng trong phòng ban của mình."
                            });
                        }
                    }
                    else
                    {
                        return Unauthorized(new ApiResponse { Success = false, Message = "Vai trò không hợp lệ." });
                    }
                }

                user.FullName = request.FullName;
                user.Email = request.Email;
                user.Avatar = request.Avatar;
                user.Mobile = request.Mobile;
                user.Address = request.Address;
                user.RoleID = request.RoleID;
                user.DepartmentID = request.DepartmentID;
                user.Status = request.Status;
                user.CreatedAt = DateTime.Now;

                if (!string.IsNullOrEmpty(request.Password))
                {
                    user.Password = HashPassword(request.Password);
                }

                await db.SaveChangesAsync();

                return Ok(new ApiResponse
                {
                    Success = true,
                    Message = "Cập nhật thông tin người dùng thành công.",
                    Data = new { user.UserID }
                });
            }
            catch (Exception ex)
            {
                Console.WriteLine($"Error in UpdateUser: {ex.Message}\n{ex.StackTrace}");
                return StatusCode(500, new ApiResponse
                {
                    Success = false,
                    Message = "Đã xảy ra lỗi khi cập nhật người dùng.",
                    Data = new[] { ex.Message }
                });
            }
        }

        /// <summary>
        /// Xóa người dùng.
        /// </summary>
        /// <param name="id">ID người dùng cần xóa.</param>
        /// <returns>
        /// - 200 OK: Xóa thành công.
        /// - 400 BadRequest: ID không hợp lệ/không thể xóa (có ràng buộc).
        /// - 401 Unauthorized: Chỉ Giám đốc được xóa.
        /// - 404 NotFound: Không tìm thấy người dùng.
        /// - 500 InternalServerError: Lỗi server.
        /// </returns>
        [HttpDelete("{id}")]
        [Authorize]
        public async Task<IActionResult> DeleteUser(int id)
        {
            if (id <= 0)
            {
                return BadRequest(new ApiResponse
                {
                    Success = false,
                    Message = "Dữ liệu không hợp lệ.",
                    Data = new[] { "ID không được để trống hoặc nhỏ hơn 1." }
                });
            }

            try
            {
                var currentUserRole = GetCurrentUserRole();
                if (currentUserRole != "Giám đốc")
                {
                    return Unauthorized(new ApiResponse
                    {
                        Success = false,
                        Message = "Chỉ Giám đốc có quyền xóa người dùng."
                    });
                }

                var user = await GetUserByIdAsync(id);
                if (user == null)
                {
                    return NotFound(new ApiResponse
                    {
                        Success = false,
                        Message = "Không tìm thấy người dùng.",
                        Data = new[] { $"Không tìm thấy người dùng với ID = {id}." }
                    });
                }

                var hasCreatedProjects = await db.Projects.AnyAsync(p => p.CreatedBy == id);
                if (hasCreatedProjects)
                {
                    return BadRequest(new ApiResponse
                    {
                        Success = false,
                        Message = "Không thể xóa người dùng này vì đã tạo dự án.",
                        Data = new[] { $"Người dùng ID {id} đã tạo các dự án trong hệ thống." }
                    });
                }

                var hasCreatedTasks = await db.Tasks.AnyAsync(t => t.CreatorID == id);
                if (hasCreatedTasks)
                {
                    return BadRequest(new ApiResponse
                    {
                        Success = false,
                        Message = "Không thể xóa người dùng này vì đã tạo công việc.",
                        Data = new[] { $"Người dùng ID {id} đã tạo các công việc trong hệ thống." }
                    });
                }

                var hasAssignedTasks = await db.TaskAssignments.AnyAsync(ta => ta.AssigneeID == id);
                if (hasAssignedTasks)
                {
                    return BadRequest(new ApiResponse
                    {
                        Success = false,
                        Message = "Không thể xóa người dùng này vì đang được phân công công việc.",
                        Data = new[] { $"Người dùng ID {id} đang được phân công các công việc." }
                    });
                }

                var totalUsers = await db.Users.CountAsync();
                if (totalUsers <= 1)
                {
                    return BadRequest(new ApiResponse
                    {
                        Success = false,
                        Message = "Không thể xóa người dùng cuối cùng trong hệ thống.",
                        Data = new[] { "Hệ thống phải có ít nhất một người dùng." }
                    });
                }

                if (user.Role?.RoleName == "Admin")
                {
                    var adminCount = await db.Users.Where(u => u.Role.RoleName == "Admin").CountAsync();
                    if (adminCount <= 1)
                    {
                        return BadRequest(new ApiResponse
                        {
                            Success = false,
                            Message = "Không thể xóa Admin cuối cùng trong hệ thống.",
                            Data = new[] { "Hệ thống phải có ít nhất một quản trị viên." }
                        });
                    }
                }

                db.Users.Remove(user);
                await db.SaveChangesAsync();

                return Ok(new ApiResponse
                {
                    Success = true,
                    Message = "Xóa người dùng thành công.",
                    Data = new { user.UserID, DeletedAt = DateTime.UtcNow }
                });
            }
            catch (DbUpdateException ex)
            {
                Console.WriteLine($"DbUpdateError in DeleteUser: {ex.InnerException?.Message ?? ex.Message}\n{ex.StackTrace}");
                return StatusCode(500, new ApiResponse
                {
                    Success = false,
                    Message = "Không thể xóa người dùng do có ràng buộc dữ liệu trong cơ sở dữ liệu.",
                    Data = new[] { "Người dùng này có liên kết với dữ liệu khác trong hệ thống." }
                });
            }
            catch (Exception ex)
            {
                Console.WriteLine($"Error in DeleteUser: {ex.Message}\n{ex.StackTrace}");
                return StatusCode(500, new ApiResponse
                {
                    Success = false,
                    Message = "Đã xảy ra lỗi khi xóa người dùng.",
                    Data = new[] { ex.Message }
                });
            }
        }

        /// <summary>
        /// Lấy danh sách tùy chọn người dùng (dùng cho dropdown).
        /// </summary>
        /// <returns>
        /// - 200 OK: Danh sách tùy chọn.
        /// - 500 InternalServerError: Lỗi server.
        /// </returns>
        [HttpGet("options")]
        public async Task<IActionResult> GetUserOptions()
        {
            try
            {
                var data = await db.Users
                    .OrderBy(x => x.FullName)
                    .Select(x => new OptionItemResponse
                    {
                        Value = x.UserID.ToString(),
                        Text = x.FullName,
                        Selected = false
                    })
                    .ToListAsync();

                return Ok(new ApiResponse
                {
                    Success = true,
                    Message = "Lấy dữ liệu thành công",
                    Data = data
                });
            }
            catch (Exception ex)
            {
                Console.WriteLine($"Error in GetUserOptions: {ex.Message}\n{ex.StackTrace}");
                return StatusCode(500, new ApiResponse
                {
                    Success = false,
                    Message = "Đã xảy ra lỗi trong khi lấy dữ liệu",
                    Data = new[] { ex.Message }
                });
            }
        }

        /// <summary>
        /// Thống kê số lượng người dùng theo trạng thái hoạt động.
        /// </summary>
        /// <returns>
        /// - 200 OK: Thống kê thành công.
        /// - 500 InternalServerError: Lỗi server.
        /// </returns>
        [HttpGet("status-summary")]
        public async Task<IActionResult> GetStatusSummary()
        {
            try
            {
                var summary = await db.Users
                    .GroupBy(p => p.Status)
                    .Select(g => new
                    {
                        Status = g.Key,
                        Count = g.Count()
                    })
                    .ToListAsync();

                return Ok(new ApiResponse
                {
                    Success = true,
                    Message = "Lấy tổng hợp trạng thái thành công",
                    Data = summary.Select(s => new
                    {
                        status = s.Status.HasValue && s.Status.Value,
                        count = s.Count
                    }).ToList()
                });
            }
            catch (Exception ex)
            {
                Console.WriteLine($"Error in GetStatusSummary: {ex.Message}\n{ex.StackTrace}");
                return StatusCode(500, new ApiResponse
                {
                    Success = false,
                    Message = "Đã xảy ra lỗi trong khi lấy tổng hợp trạng thái",
                    Data = new[] { ex.Message }
                });
            }
        }

        /// <summary>
        /// Lấy thông tin chi tiết một người dùng theo ID.
        /// </summary>
        /// <param name="id">ID người dùng cần lấy.</param>
        /// <returns>
        /// - 200 OK: Thông tin người dùng.
        /// - 400 BadRequest: ID không hợp lệ.
        /// - 404 NotFound: Không tìm thấy người dùng.
        /// - 500 InternalServerError: Lỗi server.
        /// </returns>
        [HttpGet("{id}")]
        public async Task<IActionResult> GetUser(int id)
        {
            if (id <= 0)
            {
                return BadRequest(new ApiResponse
                {
                    Success = false,
                    Message = "Dữ liệu không hợp lệ.",
                    Data = new[] { "ID không được để trống hoặc nhỏ hơn 1." }
                });
            }

            try
            {
                var user = await GetUserByIdAsync(id);

                if (user == null)
                {
                    return NotFound(new ApiResponse
                    {
                        Success = false,
                        Message = "Không tìm thấy người dùng.",
                        Data = new[] { $"Không tìm thấy người dùng với ID = {id}." }
                    });
                }

                return Ok(new ApiResponse
                {
                    Success = true,
                    Message = "Lấy thông tin người dùng thành công.",
                    Data = GetUserResponse(user)
                });
            }
            catch (Exception ex)
            {
                Console.WriteLine($"Error in GetUser: {ex.Message}\n{ex.StackTrace}");
                return StatusCode(500, new ApiResponse
                {
                    Success = false,
                    Message = "Đã xảy ra lỗi trong khi lấy dữ liệu",
                    Data = new[] { ex.Message }
                });
            }
        }

        /// <summary>
        /// Cập nhật trạng thái hoạt động của người dùng.
        /// </summary>
        /// <param name="id">ID người dùng cần cập nhật.</param>
        /// <param name="request">Thông tin trạng thái mới.</param>
        /// <returns>
        /// - 200 OK: Cập nhật thành công.
        /// - 400 BadRequest: Dữ liệu không hợp lệ.
        /// - 401 Unauthorized: Không có quyền.
        /// - 404 NotFound: Không tìm thấy người dùng.
        /// - 500 InternalServerError: Lỗi server.
        /// </returns>
        [HttpPatch("{id}/status")]
        [Authorize]
        public async Task<IActionResult> UpdateUserStatus(int id, [FromBody] StatusRequest request)
        {
            if (id <= 0)
            {
                return BadRequest(new ApiResponse
                {
                    Success = false,
                    Message = "Dữ liệu không hợp lệ.",
                    Data = new[] { "ID không được để trống hoặc nhỏ hơn 1." }
                });
            }

            if (!ModelState.IsValid)
            {
                return BadRequest(new ApiResponse
                {
                    Success = false,
                    Message = "Dữ liệu không hợp lệ.",
                    Data = ModelState.Values.SelectMany(v => v.Errors).Select(e => e.ErrorMessage).ToArray()
                });
            }

            try
            {
                var user = await GetUserByIdAsync(id);
                if (user == null)
                {
                    return NotFound(new ApiResponse
                    {
                        Success = false,
                        Message = "Không tìm thấy người dùng.",
                        Data = new[] { $"Không tìm thấy người dùng với ID = {id}." }
                    });
                }

                var currentUserId = GetCurrentUserId();
                var currentUserRole = GetCurrentUserRole();
                var currentUser = await db.Users.FindAsync(currentUserId);
                if (currentUser == null)
                {
                    return Unauthorized(new ApiResponse { Success = false, Message = "Người dùng không tồn tại hoặc token không hợp lệ." });
                }

                // Kiểm tra quyền
                if (currentUserRole != "Giám đốc")
                {
                    if (currentUserRole == "Nhân viên")
                    {
                        return Unauthorized(new ApiResponse
                        {
                            Success = false,
                            Message = "Bạn không có quyền thay đổi trạng thái người dùng."
                        });
                    }
                    else if (currentUserRole == "Trưởng phòng")
                    {
                        if (!currentUser.DepartmentID.HasValue || user.DepartmentID != currentUser.DepartmentID)
                        {
                            return Unauthorized(new ApiResponse
                            {
                                Success = false,
                                Message = "Bạn chỉ có thể thay đổi trạng thái người dùng trong phòng ban của mình."
                            });
                        }
                    }
                    else
                    {
                        return Unauthorized(new ApiResponse { Success = false, Message = "Vai trò không hợp lệ." });
                    }
                }

                user.Status = request.Status;
                await db.SaveChangesAsync();

                return Ok(new ApiResponse
                {
                    Success = true,
                    Message = "Cập nhật trạng thái người dùng thành công.",
                    Data = new { user.UserID, user.Status }
                });
            }
            catch (Exception ex)
            {
                Console.WriteLine($"Error in UpdateUserStatus: {ex.Message}\n{ex.StackTrace}");
                return StatusCode(500, new ApiResponse
                {
                    Success = false,
                    Message = "Đã xảy ra lỗi khi cập nhật trạng thái người dùng.",
                    Data = new[] { ex.Message }
                });
            }
        }

        /// <summary>
        /// Lấy danh sách vai trò (Role) trong hệ thống.
        /// </summary>
        /// <returns>
        /// - 200 OK: Danh sách vai trò.
        /// - 401 Unauthorized: Trưởng phòng chỉ xem được role Nhân viên.
        /// - 500 InternalServerError: Lỗi server.
        /// </returns>
        [HttpGet("roles")]
        public async Task<IActionResult> GetRoles()
        {
            try
            {
                //Trưởng phòng chỉ hiển thị các vai trò Nhân viên

                var currentUserRole = GetCurrentUserRole();
                if (currentUserRole == "Trưởng phòng")
                {
                    var currentUserId = GetCurrentUserId();
                    var currentUser = await db.Users.FindAsync(currentUserId);
                    if (currentUser == null || !currentUser.DepartmentID.HasValue)
                    {
                        return Unauthorized(new ApiResponse { Success = false, Message = "Người dùng không tồn tại hoặc token không hợp lệ." });
                    }
                    var roles = await db.Roles
                        .Where(r => r.RoleName == "Nhân viên")
                        .OrderBy(x => x.RoleName)
                        .Select(x => new
                        {
                            RoleID = x.RoleID.ToString(),
                            RoleName = x.RoleName
                        })
                        .ToListAsync();
                    return Ok(new ApiResponse
                    {
                        Success = true,
                        Message = "Lấy danh sách chức vụ thành công",
                        Data = roles
                    });
                }


                var data = await db.Roles
                    .OrderBy(x => x.RoleName)
                    .Select(x => new
                    {
                        RoleID = x.RoleID.ToString(),
                        RoleName = x.RoleName
                    })
                    .ToListAsync();

                return Ok(new ApiResponse
                {
                    Success = true,
                    Message = "Lấy danh sách chức vụ thành công",
                    Data = data
                });
            }
            catch (Exception ex)
            {
                Console.WriteLine($"Error in GetRoles: {ex.Message}\n{ex.StackTrace}");
                return StatusCode(500, new ApiResponse
                {
                    Success = false,
                    Message = "Đã xảy ra lỗi khi lấy danh sách chức vụ",
                    Data = new[] { ex.Message }
                });
            }
        }

        /// <summary>
        /// Lấy danh sách phòng ban (Department) trong hệ thống.
        /// </summary>
        /// <returns>
        /// - 200 OK: Danh sách phòng ban.
        /// - 401 Unauthorized: Trưởng phòng chỉ xem được phòng ban của mình.
        /// - 500 InternalServerError: Lỗi server.
        /// </returns>
        [HttpGet("departments")]
        public async Task<IActionResult> GetDepartments()
        {
            try
            {
                //Trưởng phòng chỉ hiển thị các phòng ban của mình
                var currentUserRole = GetCurrentUserRole();
                if (currentUserRole == "Trưởng phòng")
                {
                    var currentUserId = GetCurrentUserId();
                    var currentUser = await db.Users.FindAsync(currentUserId);
                    if (currentUser == null || !currentUser.DepartmentID.HasValue)
                    {
                        return Unauthorized(new ApiResponse { Success = false, Message = "Người dùng không tồn tại hoặc token không hợp lệ." });
                    }
                    var departments = await db.Departments
                        .Where(d => d.DepartmentID == currentUser.DepartmentID)
                        .OrderBy(x => x.DepartmentName)
                        .Select(x => new
                        {
                            DepartmentID = x.DepartmentID.ToString(),
                            DepartmentName = x.DepartmentName
                        })
                        .ToListAsync();
                    return Ok(new ApiResponse
                    {
                        Success = true,
                        Message = "Lấy danh sách phòng ban thành công",
                        Data = departments
                    });
                }

                var data = await db.Departments
                    .OrderBy(x => x.DepartmentName)
                    .Select(x => new
                    {
                        DepartmentID = x.DepartmentID.ToString(),
                        DepartmentName = x.DepartmentName
                    })
                    .ToListAsync();

                return Ok(new ApiResponse
                {
                    Success = true,
                    Message = "Lấy danh sách phòng ban thành công",
                    Data = data
                });
            }
            catch (Exception ex)
            {
                Console.WriteLine($"Error in GetDepartments: {ex.Message}\n{ex.StackTrace}");
                return StatusCode(500, new ApiResponse
                {
                    Success = false,
                    Message = "Đã xảy ra lỗi khi lấy danh sách phòng ban",
                    Data = new[] { ex.Message }
                });
            }
        } 
        #endregion
    }
}