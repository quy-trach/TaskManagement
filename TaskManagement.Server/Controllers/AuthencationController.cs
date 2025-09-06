using Microsoft.AspNetCore.Mvc;
using TaskManagement.Server.ViewModels;
using TaskManagement.Server.Models;
using Microsoft.EntityFrameworkCore;
using System.Threading.Tasks;
using System.IdentityModel.Tokens.Jwt;
using System.Security.Claims;
using System.Text;
using Microsoft.IdentityModel.Tokens;
using Microsoft.Extensions.Configuration;

namespace TaskManagement.Server.Controllers
{
    [ApiController]
    [Route("api/[controller]")]
    public class AuthenticationController : ControllerBase
    {
        private readonly DBContext _db;
        private readonly IConfiguration _configuration;

        /// <summary>
        /// Khởi tạo controller với DBContext và cấu hình ứng dụng.
        /// </summary>
        /// <param name="db">DBContext để truy cập database.</param>
        /// <param name="configuration">Cấu hình ứng dụng (đọc settings từ appsettings.json).</param>
        /// <exception cref="ArgumentNullException">Nếu db hoặc configuration là null.</exception>
        public AuthenticationController(DBContext db, IConfiguration configuration)
        {
            _db = db ?? throw new ArgumentNullException(nameof(db));
            _configuration = configuration ?? throw new ArgumentNullException(nameof(configuration));
        }


        /// <summary>
        /// Xử lý yêu cầu đăng nhập và trả về JWT nếu thành công.
        /// </summary>
        /// <param name="request">Thông tin đăng nhập (email và mật khẩu).</param>
        /// <returns>
        /// - 200 OK + JWT nếu đăng nhập thành công.
        /// - 400 BadRequest nếu dữ liệu đầu vào không hợp lệ.
        /// - 401 Unauthorized nếu email/mật khẩu sai hoặc tài khoản bị vô hiệu hóa.
        /// - 500 InternalServerError nếu cấu hình JWT thiếu.
        /// </returns>
        [HttpPost("login")]
        public async Task<IActionResult> Login([FromBody] SignInRequest request)
        {
            if (!ModelState.IsValid)
            {
                return BadRequest(new SignInResponse
                {
                    Success = false,
                    Message = "Dữ liệu đầu vào không hợp lệ"
                });
            }

            // Kiểm tra người dùng trong database

            var user = await _db.Users
                .Include(u => u.Role)
                .FirstOrDefaultAsync(x => x.Email == request.Email && x.Status == true);

            if (user == null)
            {
                return Unauthorized(new SignInResponse
                {
                    Success = false,
                    Message = "Email hoặc mật khẩu không chính xác."
                });
            }

            // Xác thực mật khẩu
            bool isPasswordValid = BCrypt.Net.BCrypt.Verify(request.Password, user.Password);
            if (!isPasswordValid)
            {
                return Unauthorized(new SignInResponse
                {
                    Success = false,
                    Message = "Email hoặc mật khẩu không chính xác."
                });
            }

            // Tạo JWT
            var authClaims = new List<Claim>
            {
                new Claim(ClaimTypes.NameIdentifier, user.UserID.ToString()),
                new Claim(ClaimTypes.Email, user.Email),
                new Claim(ClaimTypes.Name, user.FullName ?? string.Empty),
                 new Claim(ClaimTypes.Role, user.Role?.RoleName ?? "Nhân viên"),
                new Claim(JwtRegisteredClaimNames.Jti, Guid.NewGuid().ToString()),
                 new Claim("DepartmentID", user.DepartmentID?.ToString() ?? string.Empty)
            };

            // Lấy khóa bí mật từ cấu hình, kiểm tra null
            var secret = _configuration["JWT:Secret"];
            if (string.IsNullOrEmpty(secret))
            {
                return StatusCode(500, new SignInResponse
                {
                    Success = false,
                    Message = "Lỗi cấu hình khóa bí mật JWT."
                });
            }

            var authSigningKey = new SymmetricSecurityKey(Encoding.UTF8.GetBytes(secret));
            var token = new JwtSecurityToken(
                issuer: _configuration["JWT:ValidIssuer"],
                audience: _configuration["JWT:ValidAudience"],
                expires: DateTime.Now.AddHours(3),
                claims: authClaims,
                signingCredentials: new SigningCredentials(authSigningKey, SecurityAlgorithms.HmacSha256)
            );

            var tokenString = new JwtSecurityTokenHandler().WriteToken(token);

            // Trả về phản hồi theo định nghĩa SignInResponse
            return Ok(new SignInResponse
            {
                Success = true,
                Message = "Đăng nhập thành công!",
                Token = tokenString,
                UserData = new UserData
                {
                    UserId = user.UserID,
                    FullName = user.FullName ?? "Unknown",
                    Email = user.Email,
                    Avatar = user.Avatar,
                    RoleID = user.RoleID,
                    RoleName = user.Role?.RoleName ?? ""

                }
            });
        }
    }
}