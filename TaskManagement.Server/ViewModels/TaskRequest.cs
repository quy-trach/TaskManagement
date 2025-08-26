using System.Text.Json.Serialization;

namespace TaskManagement.Server.ViewModels
{
    public class TaskRequest
    {
        [JsonPropertyName("title")]
        public string Title { get; set; }

        [JsonPropertyName("description")]
        public string Description { get; set; }

        [JsonPropertyName("departmentID")]
        public int? DepartmentID { get; set; }


        [JsonPropertyName("startDate")]
        public DateTime? StartDate { get; set; }

        [JsonPropertyName("endDate")]
        public DateTime? EndDate { get; set; }

        [JsonPropertyName("priority")]
        public string Priority { get; set; }

        [JsonPropertyName("statusID")]
        public int? StatusID { get; set; }

        // CreatedAt thường được set ở server, nhưng vẫn giữ lại nếu client muốn gửi
        [JsonPropertyName("createdAt")]
        public DateTime? CreatedAt { get; set; }

        [JsonPropertyName("projectID")]
        public int? ProjectID { get; set; }

        // Thêm thuộc tính này để nhận danh sách ID người được giao việc từ client
        [JsonPropertyName("assignedUserIDs")]
        public List<int> AssignedUserIDs { get; set; }

        // Constructor mặc định (Default constructor)
        public TaskRequest()
        {
            Title = string.Empty;
            Description = string.Empty;
            DepartmentID = null;
            StartDate = null;
            EndDate = null;
            Priority = string.Empty;
            StatusID = null;
            CreatedAt = null;
            ProjectID = null;
            AssignedUserIDs = new List<int>();
        }

       
        public TaskRequest(
            string title,
            string description,
            int? departmentID,
            DateTime? startDate,
            DateTime? endDate,
            string priority,
            int? statusID,
            DateTime? createdAt,
            int? projectID,
            List<int> assignedUserIDs)
        {
            Title = title ?? string.Empty;
            Description = description ?? string.Empty;
            DepartmentID = departmentID;
            StartDate = startDate;
            EndDate = endDate;
            Priority = priority ?? string.Empty;
            StatusID = statusID;
            CreatedAt = createdAt;
            ProjectID = projectID;
            AssignedUserIDs = assignedUserIDs ?? new List<int>();
        }
    }
}
