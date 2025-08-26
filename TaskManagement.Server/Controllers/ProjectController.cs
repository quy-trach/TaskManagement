using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using System.Security.Claims;
using TaskManagement.Server.Models;
using TaskManagement.Server.ViewModels;

namespace TaskManagement.Server.Controllers
{
    [Route("api/projects")]
    [ApiController]

    public class ProjectController : ControllerBase
    {
        #region Consts
        private const int PAGE_SIZE = 3;
        #endregion

        #region Variables
        private readonly DBContext db;
        #endregion

        #region Constructors+DI
        public ProjectController(DBContext context)
        {
            db = context;
        }
        #endregion

        #region Helpers
        /// <summary>
        /// Trả về một dự án có ID phù hợp. Nếu không tìm thấy, trả về null.
        /// </summary>
        /// <param name="id">ID của dự án cần lấy thông tin.</param>
        /// <returns>Trả về một dự án có ID phù hợp. Nếu không tìm thấy, trả về null.</returns>
        private async Task<Project?> GetProjectByIdAsync(int id)
        {
            return await db.Projects
                .Include(p => p.CreatedByNavigation)
                .FirstOrDefaultAsync(x => x.ProjectID == id);
        }

        /// <summary>
        /// Chuyển đổi một đối tượng Project sang kiểu ProjectResponse.
        /// </summary>
        /// <param name="project">Đối tượng chứa dữ liệu cần chuyển đổi.</param>
        /// <returns>Trả về một đối tượng có kiểu là ProjectResponse.</returns>
        private ProjectResponse? GetProjectResponse(Project? project)
        {
            if (project == null)
            {
                return null;
            }

            return new ProjectResponse(
                project.ProjectID,
                project.ProjectName ?? string.Empty,
                project.Description ?? string.Empty,
                project.StartDate?.ToString("dd/MM/yyyy HH:mm:ss") ?? string.Empty,
                project.EndDate?.ToString("dd/MM/yyyy HH:mm:ss") ?? string.Empty,
                project.Status ?? string.Empty,
                project.CreatedBy,
                project.CreatedByNavigation?.FullName ?? string.Empty,
                project.CreatedAt?.ToString("dd/MM/yyyy HH:mm:ss") ?? string.Empty
            );
        }


        /// <summary>
        /// Lấy vai trò của người dùng hiện tại từ token.
        /// </summary>
        /// <returns>
        /// Trả về vai trò của người dùng nếu có, hoặc null nếu không tìm thấy.
        /// </returns>
        private string? GetCurrentUserRole()
        {
            return HttpContext.User.FindFirst(ClaimTypes.Role)?.Value;
        }

        /// <summary>
        /// Lấy ID của người dùng hiện tại từ token.
        /// </summary>
        /// <returns>
        /// Trả về ID của người dùng nếu có, hoặc ném ra UnauthorizedAccessException nếu không tìm thấy.
        /// </returns>
        /// <exception cref="UnauthorizedAccessException">
        /// UnauthorizedAccessException nếu không tìm thấy ID người dùng trong token.
        /// </exception>
        private int GetCurrentUserId()
        {
            var userIdClaim = HttpContext.User.FindFirst(ClaimTypes.NameIdentifier)?.Value;
            return userIdClaim != null ? int.Parse(userIdClaim) : throw new UnauthorizedAccessException("User ID not found in token");
        }

        //Chưa dùng đến
        private int GetCurrentUserDepartmentId()
        {
            var departmentIdClaim = HttpContext.User.FindFirst("DepartmentID")?.Value;
            return departmentIdClaim != null ? int.Parse(departmentIdClaim) : throw new UnauthorizedAccessException("Department ID not found in token");
        }

        #endregion

        #region Endpoints
        /// <summary>
        /// Lấy danh sách dự án có phân trang và lọc.
        /// GET: /api/projects?department={department}&keyword={keyword}&status={status}&page={page}
        /// </summary>
        /// <param name="request">Đối tượng chứa các tham số lọc: department, keyword, status, page.</param>
        /// <returns>Trả về dữ liệu dự án kèm thông tin phân trang; nếu xảy ra lỗi, trả về thông báo lỗi.</returns>
        [HttpGet]
        public async Task<IActionResult> GetProjects([FromQuery] FilterListRequest request)
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
                IQueryable<Project> query = db.Projects
                    .Include(p => p.CreatedByNavigation);

                //Nếu người dùng là Giám đốc, lấy tất cả dự án
                if (GetCurrentUserRole() == "Giám đốc")
                {
                    // Không cần lọc theo phòng ban
                }



                if (!string.IsNullOrEmpty(request.Department))
                {
                    if (int.TryParse(request.Department, out int departmentId))
                        query = query.Where(p => p.CreatedByNavigation != null && p.CreatedByNavigation.DepartmentID == departmentId);
                }

                if (!string.IsNullOrEmpty(request.Keyword))
                {
                    query = query.Where(p => p.ProjectName.ToLower().Contains(request.Keyword.ToLower()) ||
                                            p.Description.ToLower().Contains(request.Keyword.ToLower()));
                }

                if (!string.IsNullOrEmpty(request.Status) && request.Status != "all")
                {

                    query = query.Where(p => p.Status == request.Status);
                }

                int totalRecords = await query.CountAsync();

                query = query.OrderBy(p => p.ProjectName);

                if (request.Page == null || request.Page < 1)
                {
                    request.Page = 1;
                }

                query = query.Skip((request.Page.Value - 1) * PAGE_SIZE).Take(PAGE_SIZE);

                var projects = await query.ToListAsync();
                var data = projects.Select(p => GetProjectResponse(p)).ToList();

                var response = new ApiResponse
                {
                    Success = true,
                    Message = "Lấy danh sách dự án thành công",
                    Data = new
                    {
                        Projects = data,
                        TotalRecords = totalRecords,
                        CurrentPage = request.Page,
                        PageSize = PAGE_SIZE
                    }
                };

                return Ok(response);
            }
            catch (Exception ex)
            {
                return StatusCode(500, new ApiResponse
                {
                    Success = false,
                    Message = "Đã xảy ra lỗi trong khi lấy dữ liệu",
                    Data = new[] { ex.Message }
                });
            }
        }

        /// <summary>
        /// Lấy tổng hợp trạng thái dự án.
        /// GET: /api/projects/status-summary
        /// </summary>
        /// <returns>Trả về số lượng dự án theo từng trạng thái.</returns>
        [HttpGet("status-summary")]
        public async Task<IActionResult> GetStatusSummary()
        {
            try
            {
                var summary = await db.Projects
                    .GroupBy(p => p.Status)
                    .Select(g => new
                    {
                        Status = g.Key,
                        Count = g.Count()
                    })
                    .ToListAsync();

                var response = new ApiResponse
                {
                    Success = true,
                    Message = "Lấy tổng hợp trạng thái dự án thành công",
                    Data = summary.Select(s => new
                    {
                        Status = s.Status,
                        s.Count
                    }).ToList()
                };

                return Ok(response);
            }
            catch (Exception ex)
            {
                return StatusCode(500, new ApiResponse
                {
                    Success = false,
                    Message = "Đã xảy ra lỗi trong khi lấy tổng hợp trạng thái",
                    Data = new[] { ex.Message }
                });
            }
        }

        /// <summary>
        /// Lấy danh sách các tùy chọn dự án.
        /// GET: /api/projects/options
        /// </summary>
        /// <returns>Trả về danh sách các tùy chọn dự án (ProjectID và ProjectName).</returns>
        [HttpGet("options")]
        public async Task<IActionResult> GetProjectOptions()
        {
            try
            {
                var data = await db.Projects
                    .OrderBy(x => x.ProjectName)
                    .Select(x => new OptionItemResponse
                    {
                        Value = x.ProjectID.ToString(),
                        Text = x.ProjectName,
                        Selected = false
                    })
                    .ToListAsync();

                var response = new ApiResponse
                {
                    Success = true,
                    Message = "Lấy dữ liệu thành công",
                    Data = data
                };

                return Ok(response);
            }
            catch (Exception ex)
            {
                return StatusCode(500, new ApiResponse
                {
                    Success = false,
                    Message = "Đã xảy ra lỗi trong khi lấy dữ liệu",
                    Data = new[] { ex.Message }
                });
            }
        }

        /// <summary>
        /// Lấy thông tin chi tiết của một dự án.
        /// GET: /api/projects/{id}
        /// </summary>
        /// <param name="id">ID của dự án cần lấy thông tin.</param>
        /// <returns>Trả về thông tin chi tiết của dự án nếu tìm thấy; nếu không, trả về lỗi 404.</returns>
        [HttpGet("{id}")]
        public async Task<IActionResult> GetProject(int id)
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
                var project = await GetProjectByIdAsync(id);

                if (project == null)
                {
                    return NotFound(new ApiResponse
                    {
                        Success = false,
                        Message = "Không tìm thấy dự án.",
                        Data = new[] { $"Không tìm thấy dự án với ID = {id}." }
                    });
                }

                return Ok(new ApiResponse
                {
                    Success = true,
                    Message = "Lấy thông tin dự án thành công.",
                    Data = GetProjectResponse(project)
                });
            }
            catch (Exception ex)
            {
                return StatusCode(500, new ApiResponse
                {
                    Success = false,
                    Message = "Đã xảy ra lỗi trong khi lấy dữ liệu",
                    Data = new[] { ex.Message }
                });
            }
        }

        /// <summary>
        /// Thêm mới một dự án.
        /// POST: /api/projects
        /// </summary>
        /// <param name="request">Đối tượng chứa thông tin dự án cần thêm mới.</param>
        /// <returns>Trả về thông báo thành công và thông tin dự án vừa thêm nếu thành công.</returns>
        [HttpPost]
        [Authorize(Policy = "GiamDoc")]
        public async Task<IActionResult> AddProject([FromBody] ProjectRequest request)
        {
            // Kiểm tra vai trò ngay đầu để trả thông báo cảnh báo
            var userRole = GetCurrentUserRole();
            if (userRole != "Giám đốc")
            {
                return Unauthorized(new ApiResponse
                {
                    Success = false,
                    Message = "CẢNH BÁO: Bạn không có quyền tạo dự án. Chỉ Giám đốc được phép thực hiện hành động này.",
                    Data = new[] { "Vui lòng liên hệ Giám đốc để được hỗ trợ." }
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
                DateTime now = DateTime.Now;
                var userId = GetCurrentUserId();

                // Kiểm tra người dùng tồn tại trong database
                var user = await db.Users.FindAsync(userId);
                if (user == null)
                {
                    return Unauthorized(new ApiResponse
                    {
                        Success = false,
                        Message = "CẢNH BÁO: Người dùng không tồn tại hoặc không hợp lệ.",
                        Data = new[] { $"Không tìm thấy người dùng với ID = {userId}." }
                    });
                }

                Project project = new Project
                {
                    ProjectName = request.ProjectName,
                    Description = request.Description,
                    StartDate = request.StartDate,
                    EndDate = request.EndDate,
                    Status = request.Status,
                    CreatedBy = userId, // Lấy từ token
                    CreatedAt = now
                };

                db.Projects.Add(project);
                await db.SaveChangesAsync();

                return Ok(new ApiResponse
                {
                    Success = true,
                    Message = "Thêm mới dự án thành công.",
                    Data = new { project.ProjectID }
                });
            }
            catch (Exception ex)
            {
                return BadRequest(new ApiResponse
                {
                    Success = false,
                    Message = "Đã xảy ra lỗi khi thêm mới dự án.",
                    Data = new[] { ex.Message }
                });
            }
        }

        /// <summary>
        /// Cập nhật thông tin của một dự án.
        /// PUT: /api/projects/{id}
        /// </summary>
        /// <param name="id">ID của dự án cần cập nhật.</param>
        /// <param name="request">Đối tượng chứa thông tin cập nhật của dự án.</param>
        /// <returns>Trả về thông báo thành công nếu cập nhật thành công.</returns>
        [HttpPut("{id}")]
        [Authorize(Policy = "GiamDoc")]
        public async Task<IActionResult> UpdateProject(int id, [FromBody] ProjectRequest request)
        {
            // Kiểm tra vai trò ngay đầu để trả thông báo cảnh báo
            var userRole = GetCurrentUserRole();
            if (userRole != "Giám đốc")
            {
                return Unauthorized(new ApiResponse
                {
                    Success = false,
                    Message = "CẢNH BÁO: Bạn không có quyền cập nhật dự án. Chỉ Giám đốc được phép thực hiện hành động này.",
                    Data = new[] { "Vui lòng liên hệ Giám đốc để được hỗ trợ." }
                });
            }

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
                var project = await GetProjectByIdAsync(id);
                if (project == null)
                {
                    return NotFound(new ApiResponse
                    {
                        Success = false,
                        Message = "Không tìm thấy dự án.",
                        Data = new[] { $"Không tìm thấy dự án với ID = {id}." }
                    });
                }

                var userId = GetCurrentUserId();
                var user = await db.Users.FindAsync(userId);
                if (user == null)
                {
                    return Unauthorized(new ApiResponse
                    {
                        Success = false,
                        Message = "CẢNH BÁO: Người dùng không tồn tại hoặc không hợp lệ.",
                        Data = new[] { $"Không tìm thấy người dùng với ID = {userId}." }
                    });
                }

                project.ProjectName = request.ProjectName;
                project.Description = request.Description;
                project.StartDate = request.StartDate;
                project.EndDate = request.EndDate;
                project.Status = request.Status;
                project.CreatedBy = userId; // Lấy từ token
                project.CreatedAt = DateTime.Now;

                await db.SaveChangesAsync();

                return Ok(new ApiResponse
                {
                    Success = true,
                    Message = "Cập nhật thông tin dự án thành công.",
                    Data = new { project.ProjectID }
                });
            }
            catch (Exception ex)
            {
                return StatusCode(500, new ApiResponse
                {
                    Success = false,
                    Message = "Đã xảy ra lỗi khi cập nhật dự án.",
                    Data = new[] { ex.Message }
                });
            }
        }

        /// <summary>
        /// Xóa một dự án.
        /// DELETE: /api/projects/{id}
        /// </summary>
        /// <param name="id">ID của dự án cần xóa.</param>
        /// <returns>Trả về thông báo thành công nếu xóa thành công.</returns>
        [HttpDelete("{id}")]
        public async Task<IActionResult> DeleteProject(int id)
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
                var project = await GetProjectByIdAsync(id);
                if (project == null)
                {
                    return NotFound(new ApiResponse
                    {
                        Success = false,
                        Message = "Không tìm thấy dự án.",
                        Data = new[] { $"Không tìm thấy dự án với ID = {id}." }
                    });
                }

                // THÊM KIỂM TRA RÀNG BUỘC
                var hasActiveTasks = await db.Tasks // Thay "Tasks" bằng tên table thực tế
                    .AnyAsync(t => t.ProjectID == id); // Kiểm tra có task nào thuộc project này không

                if (hasActiveTasks)
                {
                    return BadRequest(new ApiResponse
                    {
                        Success = false,
                        Message = "Không thể xóa dự án này vì đang có công việc được giao cho nhân viên. Hãy xóa các công việc liên quan trước khi tiến hành xóa dự án",
                        Data = new[] { $"Dự án ID {id} đang có công việc liên quan." }
                    });
                }

                db.Projects.Remove(project);
                await db.SaveChangesAsync();
                return Ok(new ApiResponse
                {
                    Success = true,
                    Message = "Xóa dự án thành công.",
                    Data = new { project.ProjectID }
                });
            }
            catch (Exception ex)
            {
                return StatusCode(500, new ApiResponse
                {
                    Success = false,
                    Message = "Đã xảy ra lỗi khi xóa dự án.",
                    Data = new[] { ex.Message }
                });
            }
        }

        /// <summary>
        /// Cập nhật trạng thái của một dự án.
        /// PATCH: /api/projects/{id}/status
        /// </summary>
        /// <param name="id">ID của dự án cần cập nhật trạng thái.</param>
        /// <param name="request">Đối tượng chứa trạng thái mới (status).</param>
        /// <returns>Trả về thông báo thành công nếu cập nhật trạng thái thành công.</returns>
        [HttpPatch("{id}/status")]
        public async Task<IActionResult> UpdateProjectStatus(int id, [FromBody] StatusRequest request)
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
                var project = await GetProjectByIdAsync(id);
                if (project == null)
                {
                    return NotFound(new ApiResponse
                    {
                        Success = false,
                        Message = "Không tìm thấy dự án.",
                        Data = new[] { $"Không tìm thấy dự án với ID = {id}." }
                    });
                }

             ;

                await db.SaveChangesAsync();

                return Ok(new ApiResponse
                {
                    Success = true,
                    Message = "Cập nhật trạng thái dự án thành công.",
                    Data = new
                    {
                        project.ProjectID,
                        Status = project.Status
                    }
                });
            }
            catch (Exception ex)
            {
                return StatusCode(500, new ApiResponse
                {
                    Success = false,
                    Message = "Đã xảy ra lỗi khi cập nhật trạng thái dự án.",
                    Data = new[] { ex.Message }
                });
            }
        }
        #endregion
    }
}