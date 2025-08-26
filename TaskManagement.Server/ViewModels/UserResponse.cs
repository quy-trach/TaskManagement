using System.Text.Json.Serialization;

namespace TaskManagement.Server.ViewModels
{
    public class UserResponse
    {
        [JsonPropertyName("userID")]
        public int UserID { get; set; }

        [JsonPropertyName("fullName")]
        public string FullName { get; set; }

        [JsonPropertyName("email")]
        public string Email { get; set; }

        [JsonPropertyName("mobile")]
        public string Mobile { get; set; } 

        [JsonPropertyName("address")]

        public string Address { get; set; } 

        [JsonPropertyName("password")]
        public string Password { get; set; }

        [JsonPropertyName("roleID")]
        public int? RoleID { get; set; } // Trở lại nullable

        [JsonPropertyName("roleName")]
        public string? RoleName { get; set; } // Cho phép null

        [JsonPropertyName("departmentID")]
        public int? DepartmentID { get; set; } // Trở lại nullable

        [JsonPropertyName("departmentName")]
        public string? DepartmentName { get; set; } // Cho phép null

        [JsonPropertyName("status")]
        public bool? Status { get; set; }

        [JsonPropertyName("createdAt")]
        public string CreatedAt { get; set; }

        [JsonPropertyName("avatar")]
        public string Avatar { get; set; }

        // Constructor mặc định
        public UserResponse()
        {
            UserID = 0;
            FullName = string.Empty;
            Email = string.Empty;
            Mobile = string.Empty;
            Address = string.Empty;
            Password = string.Empty;
            RoleID = null;
            RoleName = null;
            DepartmentID = null;
            DepartmentName = null;
            Status = false;
            CreatedAt = string.Empty;
            Avatar = string.Empty;
        }

        // Constructor có tham số
        public UserResponse(
            int userID,
            string fullName,
            string email,
            string mobile,
            string address,
            string password,
            int? roleID, // Nullable
            string? roleName,
            int? departmentID, // Nullable
            string? departmentName,
            bool? status,
            string createdAt,
            string avatar)
        {
            UserID = userID;
            FullName = fullName ?? string.Empty;
            Email = email ?? string.Empty;
            Mobile = mobile ?? string.Empty;
            Address = address ?? string.Empty;
            Password = password ?? string.Empty;
            RoleID = roleID;
            RoleName = roleName;
            DepartmentID = departmentID;
            DepartmentName = departmentName;
            Status = status;
            CreatedAt = createdAt ?? string.Empty;
            Avatar = avatar ?? string.Empty;
        }
    }
}