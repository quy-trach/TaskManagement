using Microsoft.AspNetCore.Authentication.JwtBearer;
using Microsoft.IdentityModel.Tokens;
using TaskManagement.Server.Models;
using Microsoft.EntityFrameworkCore;
using Scalar.AspNetCore;
using System.Text;
using System.Security.Claims;

var builder = WebApplication.CreateBuilder(args);

// Cấu hình DI connection string cho DBContext
var connection = "Data Source=.; Initial Catalog = dbTask; TrustServerCertificate = True; Persist Security Info=True; User ID = sa; Password = 123456";
builder.Services.AddDbContext<DBContext>(option => option.UseSqlServer(connection));

// Cấu hình JSON
builder.Services.AddControllers().AddJsonOptions(options =>
{
    options.JsonSerializerOptions.ReferenceHandler = System.Text.Json.Serialization.ReferenceHandler.IgnoreCycles;
});

// Thêm OpenAPI
builder.Services.AddOpenApi();

// Kiểm tra JWT Secret trước khi sử dụng
var jwtSecret = builder.Configuration["JWT:Secret"];
if (string.IsNullOrEmpty(jwtSecret))
{
    throw new InvalidOperationException("JWT:Secret không được tìm thấy trong cấu hình. Vui lòng kiểm tra appsettings.json");
}

var jwtValidAudience = builder.Configuration["JWT:ValidAudience"];
if (string.IsNullOrEmpty(jwtValidAudience))
{
    throw new InvalidOperationException("JWT:ValidAudience không được tìm thấy trong cấu hình. Vui lòng kiểm tra appsettings.json");
}

var jwtValidIssuer = builder.Configuration["JWT:ValidIssuer"];
if (string.IsNullOrEmpty(jwtValidIssuer))
{
    throw new InvalidOperationException("JWT:ValidIssuer không được tìm thấy trong cấu hình. Vui lòng kiểm tra appsettings.json");
}

builder.Services.AddAuthorization(options =>
{
    // Policy cho từng role
    options.AddPolicy("GiamDoc", policy =>
        policy.RequireRole("Giám đốc"));

    options.AddPolicy("TruongPhong", policy =>
        policy.RequireRole("Trưởng phòng"));

    options.AddPolicy("NhanVien", policy =>
        policy.RequireRole("Nhân viên"));

    // Policy kết hợp
    options.AddPolicy("QuanLyCapCao", policy =>
        policy.RequireRole("Giám đốc", "Trưởng phòng"));
});

// Thêm dịch vụ Authentication
builder.Services.AddAuthentication(options =>
{
    options.DefaultAuthenticateScheme = JwtBearerDefaults.AuthenticationScheme;
    options.DefaultChallengeScheme = JwtBearerDefaults.AuthenticationScheme;
    options.DefaultScheme = JwtBearerDefaults.AuthenticationScheme;
})

.AddJwtBearer(options =>
{
    options.SaveToken = true;
    options.RequireHttpsMetadata = false; // Chỉ nên là false khi phát triển
    options.TokenValidationParameters = new TokenValidationParameters()
    {
        ValidateIssuer = true,
        ValidateAudience = true,
        ValidateLifetime = true,
        ValidateIssuerSigningKey = true,
        ValidAudience = jwtValidAudience,
        ValidIssuer = jwtValidIssuer,
        IssuerSigningKey = new SymmetricSecurityKey(Encoding.UTF8.GetBytes(jwtSecret)),
         RoleClaimType = ClaimTypes.Role
    };
});

// Thêm Authorization
builder.Services.AddAuthorization();

// Thêm CORS
builder.Services.AddCors(options =>
{
    options.AddPolicy("AllowOrigin", builder =>
    {
        builder.WithOrigins("https://localhost:61604") // Cho phép origin frontend
               .AllowAnyHeader()
               .AllowAnyMethod()
               .AllowCredentials(); // Nếu dùng cookie hoặc token
    });
});

var app = builder.Build();

// Cấu hình pipeline middleware
app.UseDefaultFiles();
app.UseStaticFiles();

app.UseHttpsRedirection();

app.UseRouting(); // Thêm UseRouting để hỗ trợ route-based middleware

app.UseCors("AllowOrigin"); // Đặt trước UseAuthentication để xử lý CORS

app.UseAuthentication(); // Xác thực token
app.UseAuthorization(); // Ủy quyền

// Cấu hình OpenAPI trong môi trường Development
if (app.Environment.IsDevelopment())
{
    app.MapOpenApi();
    app.MapScalarApiReference(options =>
    {
        options.WithTitle("SERVER API");
        options.WithSidebar(true);
        options.WithTheme(ScalarTheme.Default);
        options.DarkMode = false;
        options.ForceThemeMode = ThemeMode.Light;
    });
}

app.MapControllers(); // Xử lý các endpoint API
app.MapFallbackToFile("/index.html"); // Xử lý SPA fallback

app.Run();