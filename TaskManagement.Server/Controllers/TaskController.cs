using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using System.Security.Claims;
using TaskManagement.Server.Models;
using TaskManagement.Server.ViewModels;
using static Microsoft.EntityFrameworkCore.DbLoggerCategory;
using ModelsTask = TaskManagement.Server.Models.Task;

namespace TaskManagement.Server.Controllers
{
    [Route("api/tasks")]
    [ApiController]
    public class TaskController : ControllerBase
    {
        #region Consts
        private const int PAGE_SIZE = 5;
        #endregion

        #region Variables
        private readonly DBContext db;
        #endregion

        #region Constructors+DI
        public TaskController(DBContext context)
        {
            db = context;
        }
        #endregion

        #region Helpers
        /// <summary>
        /// Lấy thông tin công việc theo ID (bao gồm các thông tin liên quan: Creator, Department, Project, Status).
        /// </summary>
        /// <param name="id">ID của công việc cần lấy.</param>
        /// <returns>Task object hoặc null nếu không tìm thấy.</returns>
        private async Task<ModelsTask?> GetTaskByIdAsync(int id)
        {
            return await db.Tasks
                .Include(t => t.Creator)
                .Include(t => t.Department)
                .Include(t => t.Project)
                .Include(t => t.Status)
                .FirstOrDefaultAsync(x => x.TaskID == id);
        }

        /// <summary>
        /// Lấy thông tin công việc đơn giản (không include các quan hệ) dùng cho thao tác update.
        /// </summary>
        /// <param name="id">ID của công việc cần lấy.</param>
        /// <returns>Task object hoặc null nếu không tìm thấy.</returns>
        private async Task<ModelsTask?> GetTaskForUpdateAsync(int id)
        {
            return await db.Tasks.FirstOrDefaultAsync(x => x.TaskID == id);
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
        /// Chuyển đổi từ Models.Task sang TaskResponse để trả về client.
        /// </summary>
        /// <param name="task">Đối tượng Task cần chuyển đổi.</param>
        /// <returns>TaskResponse hoặc null nếu task là null.</returns>
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
                    DepartmentName = ta.Assignee?.Department?.DepartmentName ?? string.Empty,


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

        /// <summary>
        /// Lấy UserID của người dùng hiện tại từ JWT token
        /// </summary>
        /// <returns>UserID của người dùng đã đăng nhập</returns>
        /// <exception cref="UnauthorizedAccessException">Khi không tìm thấy UserID trong token</exception>
        private int GetCurrentUserId()
        {
            var userIdClaim = HttpContext.User.FindFirst(ClaimTypes.NameIdentifier)?.Value;
            return userIdClaim != null ? int.Parse(userIdClaim) : throw new UnauthorizedAccessException("User ID not found in token");
        }
        #endregion

        #region Endpoints

        /// <summary>
        /// Lấy danh sách công việc với phân trang và bộ lọc.
        /// </summary>
        /// <param name="request">Thông tin lọc và phân trang.</param>
        /// <returns>
        /// - 200 OK: Danh sách công việc đã lọc + phân trang.
        /// - 400 BadRequest: Dữ liệu đầu vào không hợp lệ.
        /// - 500 InternalServerError: Lỗi server.
        /// </returns>
        /// <remarks>
        /// Phân quyền tự động theo vai trò:
        /// - Nhân viên: Chỉ thấy task được giao hoặc tự tạo.
        /// - Trưởng phòng: Chỉ thấy task thuộc phòng ban mình quản lý.
        /// </remarks>
        [HttpGet]
        [Authorize]
        public async Task<IActionResult> GetTasks([FromQuery] FilterListRequest request)
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

                //Nếu là Trưởng phòng, chỉ lấy task của phòng ban mình quản lý
                if (currentUserRole == "Trưởng phòng")
                {
                    var departmentId = await db.Users
                        .Where(u => u.UserID == currentUserId)
                        .Select(u => u.DepartmentID)
                        .FirstOrDefaultAsync();
                    if (departmentId.HasValue)
                    {
                        query = query.Where(t => t.DepartmentID == departmentId.Value);
                    }
                }


                if (!string.IsNullOrEmpty(request.Department))
                {
                    if (int.TryParse(request.Department, out int departmentId))
                        query = query.Where(x => x.DepartmentID == departmentId);
                }

                if (!string.IsNullOrEmpty(request.Status))
                {
                    if (int.TryParse(request.Status, out int statusId))
                        query = query.Where(x => x.StatusID == statusId);
                }

                if (!string.IsNullOrEmpty(request.Keyword))
                {
                    query = query.Where(x => x.Title.ToLower().Contains(request.Keyword.ToLower()) ||
                                            x.Description.ToLower().Contains(request.Keyword.ToLower()));
                }

                int totalRecords = await query.CountAsync();

                query = query.OrderBy(x => x.Title);

                if (request.Page == null || request.Page < 1)
                {
                    request.Page = 1;
                }

                query = query.Skip((request.Page.Value - 1) * PAGE_SIZE).Take(PAGE_SIZE);

                var tasks = await query.ToListAsync();
                var data = tasks.Select(t => GetTaskResponse(t)).ToList();

                var response = new ApiResponse
                {
                    Success = true,
                    Message = "Lấy danh sách công việc thành công",
                    Data = new
                    {
                        Tasks = data,
                        TotalRecords = totalRecords,
                        CurrentPage = request.Page,
                        PageSize = PAGE_SIZE
                    }
                };

                return Ok(response);
            }
            catch (Exception ex)
            {
                Console.WriteLine($"Error in GetTasks: {ex.Message}\n{ex.StackTrace}");
                return StatusCode(500, new ApiResponse
                {
                    Success = false,
                    Message = "Đã xảy ra lỗi trong khi lấy dữ liệu",
                    Data = new[] { ex.Message }
                });
            }
        }

        /// <summary>
        /// Lấy danh sách tùy chọn công việc (dùng cho dropdown).
        /// </summary>
        /// <returns>
        /// - 200 OK: Danh sách tùy chọn.
        /// - 500 InternalServerError: Lỗi server.
        [HttpGet("options")]
        public async Task<IActionResult> GetTaskOptions()
        {
            try
            {
                var data = await db.Tasks
                    .OrderBy(x => x.Title)
                    .Select(x => new OptionItemResponse
                    {
                        Value = x.TaskID.ToString(),
                        Text = x.Title,
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
                Console.WriteLine($"Error in GetTaskOptions: {ex.Message}\n{ex.StackTrace}");
                return StatusCode(500, new ApiResponse
                {
                    Success = false,
                    Message = "Đã xảy ra lỗi trong khi lấy dữ liệu",
                    Data = new[] { ex.Message }
                });
            }
        }

        /// <summary>
        /// Lấy thông tin chi tiết một công việc theo ID.
        /// </summary>
        /// <param name="id">ID công việc cần lấy.</param>
        /// <returns>
        /// - 200 OK: Thông tin công việc.
        /// - 400 BadRequest: ID không hợp lệ.
        /// - 404 NotFound: Không tìm thấy công việc.
        /// - 500 InternalServerError: Lỗi server.
        /// </returns>
        [HttpGet("{id}")]
        public async Task<IActionResult> GetTask(int id)
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
                var task = await GetTaskByIdAsync(id);

                if (task == null)
                {
                    return NotFound(new ApiResponse
                    {
                        Success = false,
                        Message = "Không tìm thấy công việc.",
                        Data = new[] { $"Không tìm thấy công việc với ID = {id}." }
                    });
                }

                return Ok(new ApiResponse
                {
                    Success = true,
                    Message = "Lấy thông tin công việc thành công.",
                    Data = GetTaskResponse(task)
                });
            }
            catch (Exception ex)
            {
                Console.WriteLine($"Error in GetTask: {ex.Message}\n{ex.StackTrace}");
                return StatusCode(500, new ApiResponse
                {
                    Success = false,
                    Message = "Đã xảy ra lỗi trong khi lấy dữ liệu",
                    Data = new[] { ex.Message }
                });
            }
        }

        /// <summary>
        /// Thêm mới một công việc.
        /// </summary>
        /// <param name="request">Thông tin công việc cần tạo.</param>
        /// <returns>
        /// - 200 OK: Tạo thành công + thông tin công việc.
        /// - 400 BadRequest: Dữ liệu không hợp lệ.
        /// - 401 Unauthorized: Nhân viên không có quyền thêm.
        /// - 500 InternalServerError: Lỗi server.
        /// </returns>
        [HttpPost]
        public async Task<IActionResult> AddTask([FromBody] TaskRequest request)
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
                var currentUserRole = GetCurrentUserRole();

                // Nếu là Nhân viên, chỉ lấy task được giao hoặc tự tạo
                if (currentUserRole == "Nhân viên")
                {
                    // Không cho phép Nhân viên thêm công việc mới
                    return Unauthorized(new ApiResponse
                    {
                        Success = false,
                        Message = "Bạn không có quyền thêm công việc mới."
                    });

                }
                if (string.IsNullOrEmpty(request.Title))
                    return BadRequest(new ApiResponse { Success = false, Message = "Tên công việc không được để trống." });
                if (request.DepartmentID == null)
                    return BadRequest(new ApiResponse { Success = false, Message = "Phòng ban không được để trống." });
                if (request.StartDate == null)
                    return BadRequest(new ApiResponse { Success = false, Message = "Ngày bắt đầu không được để trống." });
                if (request.EndDate == null)
                    return BadRequest(new ApiResponse { Success = false, Message = "Ngày kết thúc không được để trống." });
                if (request.StatusID == null)
                    return BadRequest(new ApiResponse { Success = false, Message = "Trạng thái không được để trống." });
                if (request.EndDate < request.StartDate)
                    return BadRequest(new ApiResponse { Success = false, Message = "Ngày kết thúc phải sau ngày bắt đầu." });
                if (request.AssignedUserIDs == null || !request.AssignedUserIDs.Any())
                    return BadRequest(new ApiResponse { Success = false, Message = "Phải có ít nhất một người phụ trách." });

                // Lấy CreatorID từ JWT token thay vì từ request
                var currentUserId = GetCurrentUserId();

                // Kiểm tra khóa ngoại
                if (!await db.Users.AnyAsync(u => u.UserID == currentUserId))
                    return BadRequest(new ApiResponse { Success = false, Message = $"Người tạo với ID = {currentUserId} không tồn tại." });
                if (request.DepartmentID.HasValue && !await db.Departments.AnyAsync(d => d.DepartmentID == request.DepartmentID))
                    return BadRequest(new ApiResponse { Success = false, Message = $"Phòng ban với ID = {request.DepartmentID.Value} không tồn tại." });
                if (request.ProjectID.HasValue && !await db.Projects.AnyAsync(p => p.ProjectID == request.ProjectID))
                    return BadRequest(new ApiResponse { Success = false, Message = $"Dự án với ID = {request.ProjectID.Value} không tồn tại." });
                if (request.StatusID.HasValue && !await db.TaskStatuses.AnyAsync(s => s.StatusID == request.StatusID))
                    return BadRequest(new ApiResponse { Success = false, Message = $"Trạng thái với ID = {request.StatusID.Value} không tồn tại." });
                var invalidAssignees = request.AssignedUserIDs.Where(userId => !db.Users.Any(u => u.UserID == userId)).ToList();
                if (invalidAssignees.Any())
                    return BadRequest(new ApiResponse { Success = false, Message = $"Người phụ trách với ID {string.Join(", ", invalidAssignees)} không tồn tại." });

                var newTask = new ModelsTask
                {
                    Title = request.Title,
                    Description = request.Description,
                    CreatorID = currentUserId, // Sử dụng CreatorID từ JWT token
                    DepartmentID = request.DepartmentID,
                    ProjectID = request.ProjectID,
                    StartDate = request.StartDate,
                    EndDate = request.EndDate,
                    Priority = request.Priority,
                    StatusID = request.StatusID,
                    CreatedAt = DateTime.UtcNow
                };

                db.Tasks.Add(newTask);
                await db.SaveChangesAsync();
                Console.WriteLine($"Added new Task with TaskID={newTask.TaskID}");

                if (request.AssignedUserIDs != null && request.AssignedUserIDs.Any())
                {
                    foreach (var userId in request.AssignedUserIDs)
                    {
                        db.TaskAssignments.Add(new TaskAssignment
                        {
                            TaskID = newTask.TaskID,
                            AssigneeID = userId,
                            AssignedAt = DateTime.UtcNow
                        });
                    }
                    await db.SaveChangesAsync();
                    Console.WriteLine($"Added {request.AssignedUserIDs.Count} assignments for TaskID={newTask.TaskID}");
                }

                var taskResponse = await GetTaskByIdAsync(newTask.TaskID);
                return Ok(new ApiResponse
                {
                    Success = true,
                    Message = "Thêm công việc thành công.",
                    Data = GetTaskResponse(taskResponse)
                });
            }
            catch (DbUpdateException ex)
            {
                Console.WriteLine($"DbUpdateError in AddTask: {ex.InnerException?.Message ?? ex.Message}\n{ex.StackTrace}");
                return StatusCode(500, new ApiResponse
                {
                    Success = false,
                    Message = "Lỗi khi thêm cơ sở dữ liệu. Vui lòng kiểm tra ràng buộc khóa ngoại hoặc dữ liệu trùng lặp.",
                    Data = new[] { ex.InnerException?.Message ?? ex.Message }
                });
            }
            catch (Exception ex)
            {
                Console.WriteLine($"Error in AddTask: {ex.InnerException?.Message ?? ex.Message}\n{ex.StackTrace}");
                return StatusCode(500, new ApiResponse
                {
                    Success = false,
                    Message = "Đã xảy ra lỗi trong khi thêm công việc",
                    Data = new[] { ex.InnerException?.Message ?? ex.Message }
                });
            }
        }

        /// <summary>
        /// Cập nhật thông tin công việc.
        /// </summary>
        /// <param name="id">ID công việc cần cập nhật.</param>
        /// <param name="request">Thông tin cập nhật.</param>
        /// <returns>
        /// - 200 OK: Cập nhật thành công.
        /// - 400 BadRequest: Dữ liệu không hợp lệ.
        /// - 401 Unauthorized: Nhân viên chỉ được cập nhật trạng thái.
        /// - 404 NotFound: Không tìm thấy công việc.
        /// - 500 InternalServerError: Lỗi server.
        /// </returns>
        [HttpPut("{id}")]
        public async Task<IActionResult> UpdateTask(int id, [FromBody] TaskRequest request)
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
                var currentUserRole = GetCurrentUserRole();
                var currentUserId = GetCurrentUserId();

                // Tải công việc trước để kiểm tra
                var task = await GetTaskForUpdateAsync(id);
                if (task == null)
                    return NotFound(new ApiResponse { Success = false, Message = "Không tìm thấy công việc." });

                // Xử lý logic cho Nhân viên - chỉ được cập nhật trạng thái
                if (currentUserRole == "Nhân viên")
                {
                    // Kiểm tra StatusID có được gửi lên không
                    if (request.StatusID == null)
                    {
                        return BadRequest(new ApiResponse { Success = false, Message = "Trạng thái không được để trống." });
                    }

                    // Kiểm tra trạng thái có tồn tại không
                    if (!await db.TaskStatuses.AnyAsync(s => s.StatusID == request.StatusID.Value))
                        return BadRequest(new ApiResponse { Success = false, Message = $"Trạng thái với ID = {request.StatusID.Value} không tồn tại." });

                    // Chỉ cập nhật trạng thái
                    task.StatusID = request.StatusID;
                    db.Tasks.Update(task);
                    await db.SaveChangesAsync();

                    // Tải lại dữ liệu để trả về
                    var updatedTask = await GetTaskByIdAsync(id);
                    return Ok(new ApiResponse
                    {
                        Success = true,
                        Message = "Cập nhật trạng thái công việc thành công.",
                        Data = GetTaskResponse(updatedTask)
                    });
                }

                // Logic cho các role khác (Trưởng phòng, Admin) - cập nhật đầy đủ
                // Kiểm tra dữ liệu đầy đủ
                if (string.IsNullOrEmpty(request.Title))
                    return BadRequest(new ApiResponse { Success = false, Message = "Tên công việc không được để trống." });
                if (request.DepartmentID == null)
                    return BadRequest(new ApiResponse { Success = false, Message = "Phòng ban không được để trống." });
                if (request.StartDate == null)
                    return BadRequest(new ApiResponse { Success = false, Message = "Ngày bắt đầu không được để trống." });
                if (request.EndDate == null)
                    return BadRequest(new ApiResponse { Success = false, Message = "Ngày kết thúc không được để trống." });
                if (request.StatusID == null)
                    return BadRequest(new ApiResponse { Success = false, Message = "Trạng thái không được để trống." });
                if (request.EndDate < request.StartDate)
                    return BadRequest(new ApiResponse { Success = false, Message = "Ngày kết thúc phải sau ngày bắt đầu." });
                if (request.AssignedUserIDs == null || !request.AssignedUserIDs.Any())
                    return BadRequest(new ApiResponse { Success = false, Message = "Phải có ít nhất một người phụ trách." });

                // Kiểm tra khóa ngoại
                if (request.DepartmentID.HasValue && !await db.Departments.AnyAsync(d => d.DepartmentID == request.DepartmentID.Value))
                    return BadRequest(new ApiResponse { Success = false, Message = $"Phòng ban với ID = {request.DepartmentID.Value} không tồn tại." });
                if (request.ProjectID.HasValue && !await db.Projects.AnyAsync(p => p.ProjectID == request.ProjectID.Value))
                    return BadRequest(new ApiResponse { Success = false, Message = $"Dự án với ID = {request.ProjectID.Value} không tồn tại." });
                if (request.StatusID.HasValue && !await db.TaskStatuses.AnyAsync(s => s.StatusID == request.StatusID.Value))
                    return BadRequest(new ApiResponse { Success = false, Message = $"Trạng thái với ID = {request.StatusID.Value} không tồn tại." });
                var invalidAssignees = request.AssignedUserIDs.Where(userId => !db.Users.Any(u => u.UserID == userId)).ToList();
                if (invalidAssignees.Any())
                    return BadRequest(new ApiResponse { Success = false, Message = $"Người phụ trách với ID {string.Join(", ", invalidAssignees)} không tồn tại." });

                // Cập nhật Task đầy đủ
                task.Title = request.Title;
                task.Description = request.Description;
                task.DepartmentID = request.DepartmentID;
                task.ProjectID = request.ProjectID;
                task.StartDate = request.StartDate;
                task.EndDate = request.EndDate;
                task.Priority = request.Priority;
                task.StatusID = request.StatusID;

                db.Tasks.Update(task);
                await db.SaveChangesAsync();
                Console.WriteLine($"Updated TaskID={id} successfully.");

                // Cập nhật TaskAssignments
                var existingAssignments = await db.TaskAssignments
                    .Where(ta => ta.TaskID == id)
                    .ToListAsync();

                var assignmentsToRemove = existingAssignments
                    .Where(ea => !request.AssignedUserIDs.Contains(ea.AssigneeID ?? 0))
                    .ToList();
                if (assignmentsToRemove.Any())
                {
                    db.TaskAssignments.RemoveRange(assignmentsToRemove);
                    await db.SaveChangesAsync();
                    Console.WriteLine($"Removed {assignmentsToRemove.Count} old assignments for TaskID={id}");
                }

                var existingAssigneeIDs = existingAssignments.Select(ea => ea.AssigneeID ?? 0).ToList();
                var newAssigneeIDs = request.AssignedUserIDs
                    .Where(userId => !existingAssigneeIDs.Contains(userId))
                    .ToList();

                foreach (var userId in newAssigneeIDs)
                {
                    if (await db.TaskAssignments.AnyAsync(ta => ta.TaskID == id && ta.AssigneeID == userId))
                    {
                        Console.WriteLine($"TaskAssignment with TaskID={id} and AssigneeID={userId} already exists. Skipping.");
                        continue;
                    }
                    var newAssignment = new TaskAssignment
                    {
                        TaskID = id,
                        AssigneeID = userId,
                        AssignedAt = DateTime.UtcNow
                    };
                    db.TaskAssignments.Add(newAssignment);
                    Console.WriteLine($"Added new assignment: TaskID={id}, AssigneeID={userId}");
                }

                await db.SaveChangesAsync();
                Console.WriteLine($"Updated TaskAssignments for TaskID={id} successfully.");

                // Tải lại dữ liệu để trả về
                var updatedTaskFull = await GetTaskByIdAsync(id);
                if (updatedTaskFull == null)
                {
                    return NotFound(new ApiResponse
                    {
                        Success = false,
                        Message = "Không tìm thấy công việc sau khi cập nhật.",
                        Data = new[] { $"Không tìm thấy công việc với ID = {id}." }
                    });
                }

                var updatedTaskResponse = GetTaskResponse(updatedTaskFull);
                return Ok(new ApiResponse
                {
                    Success = true,
                    Message = "Cập nhật công việc thành công.",
                    Data = updatedTaskResponse
                });
            }
            catch (DbUpdateException ex)
            {
                Console.WriteLine($"DbUpdateError in UpdateTask: {ex.InnerException?.Message ?? ex.Message}\n{ex.StackTrace}");
                return StatusCode(500, new ApiResponse
                {
                    Success = false,
                    Message = "Lỗi khi cập nhật cơ sở dữ liệu. Vui lòng kiểm tra ràng buộc khóa ngoại hoặc dữ liệu trùng lặp.",
                    Data = new[] { ex.InnerException?.Message ?? ex.Message }
                });
            }
            catch (Exception ex)
            {
                Console.WriteLine($"Error in UpdateTask: {ex.InnerException?.Message ?? ex.Message}\n{ex.StackTrace}");
                return StatusCode(500, new ApiResponse
                {
                    Success = false,
                    Message = "Đã xảy ra lỗi trong khi cập nhật công việc",
                    Data = new[] { ex.InnerException?.Message ?? ex.Message }
                });
            }
        }

        /// <summary>
        /// Xóa một công việc.
        /// </summary>
        /// <param name="id">ID công việc cần xóa.</param>
        /// <returns>
        /// - 200 OK: Xóa thành công.
        /// - 400 BadRequest: ID không hợp lệ.
        /// - 401 Unauthorized: Không có quyền xóa.
        /// - 404 NotFound: Không tìm thấy công việc.
        /// - 500 InternalServerError: Lỗi server.
        /// </returns>
        /// <remarks>Chỉ người tạo công việc mới được xóa.</remarks>
        [HttpDelete("{id}")]
        public async Task<IActionResult> DeleteTask(int id)
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
                // Không cho phép Nhân viên xóa công việc
                if (currentUserRole == "Nhân viên")
                {
                    return Unauthorized(new ApiResponse
                    {
                        Success = false,
                        Message = "Bạn không có quyền xóa công việc này."
                    });
                }
                var task = await db.Tasks.FindAsync(id);
                if (task == null)
                {
                    return NotFound(new ApiResponse
                    {
                        Success = false,
                        Message = "Không tìm thấy công việc.",
                        Data = new[] { $"Không tìm thấy công việc với ID = {id}." }
                    });
                }

                // Lấy CreatorID từ JWT token
                var currentUserId = GetCurrentUserId();

                // Kiểm tra quyền: Chỉ người tạo mới được xóa task
                if (task.CreatorID != currentUserId)
                {
                    return Unauthorized(new ApiResponse
                    {
                        Success = false,
                        Message = "Bạn không phải người tạo và không thể xóa công việc này."
                    });
                }

                // Xóa các TaskAssignments liên quan trước
                var assignments = await db.TaskAssignments.Where(ta => ta.TaskID == id).ToListAsync();
                if (assignments.Any())
                {
                    db.TaskAssignments.RemoveRange(assignments);
                    await db.SaveChangesAsync();
                    Console.WriteLine($"Removed {assignments.Count} assignments for TaskID={id}");
                }

                // Xóa Task
                db.Tasks.Remove(task);
                await db.SaveChangesAsync();
                Console.WriteLine($"Deleted TaskID={id} successfully.");

                return Ok(new ApiResponse
                {
                    Success = true,
                    Message = "Xóa công việc thành công."
                });
            }
            catch (Exception ex)
            {
                Console.WriteLine($"Error in DeleteTask: {ex.Message}\n{ex.StackTrace}");
                return StatusCode(500, new ApiResponse
                {
                    Success = false,
                    Message = "Đã xảy ra lỗi trong khi xóa công việc",
                    Data = new[] { ex.Message }
                });
            }
        }

        /// <summary>
        /// Thống kê số lượng công việc theo trạng thái.
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
                var statusSummary = await db.Tasks
                    .Include(t => t.Status)
                    .GroupBy(t => new { t.StatusID, t.Status.StatusName })
                    .Select(g => new
                    {
                        StatusID = g.Key.StatusID,
                        StatusName = g.Key.StatusName ?? "Không xác định",
                        Count = g.Count()
                    })
                    .OrderBy(s => s.StatusName)
                    .ToListAsync();

                // Tính tổng số task
                var totalTasks = statusSummary.Sum(s => s.Count);

                var result = new
                {
                    Summary = statusSummary,
                    Total = totalTasks
                };

                return Ok(new ApiResponse
                {
                    Success = true,
                    Message = "Lấy tổng hợp trạng thái thành công",
                    Data = result
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
        /// Lấy danh sách trạng thái công việc (dùng cho dropdown).
        /// </summary>
        /// <returns>
        /// - 200 OK: Danh sách trạng thái.
        /// - 500 InternalServerError: Lỗi server.
        /// </returns>
        [HttpGet("statuses")]
        public async Task<IActionResult> GetTaskStatuses()
        {
            try
            {
                var data = await db.TaskStatuses
                    .OrderBy(x => x.StatusID)
                    .Select(x => new OptionItemResponse
                    {
                        Value = x.StatusID.ToString(),
                        Text = x.StatusName,
                        Selected = false
                    })
                    .ToListAsync();

                return Ok(new ApiResponse
                {
                    Success = true,
                    Message = "Lấy danh sách trạng thái thành công",
                    Data = data
                });
            }
            catch (Exception ex)
            {
                Console.WriteLine($"Error in GetTaskStatuses: {ex.Message}\n{ex.StackTrace}");
                return StatusCode(500, new ApiResponse
                {
                    Success = false,
                    Message = "Đã xảy ra lỗi trong khi lấy dữ liệu trạng thái",
                    Data = new[] { ex.Message }
                });
            }
        }



        #endregion
    }
}

