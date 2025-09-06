using TaskManagement.Server.ViewModels;
using Microsoft.AspNetCore.Mvc;

namespace TaskManagement.Server.Controllers
{
    [Route("api/uploads")]
    [ApiController]
    public class UploadController : ControllerBase
    {
        private readonly IWebHostEnvironment _environment;
        public UploadController(IWebHostEnvironment env)
        {
            _environment = env;
        }

        // Hàm tạo tên file mới không trùng
        private string GenerateSafeFileName(string originalFileName)
        {
            if (string.IsNullOrEmpty(originalFileName))
            {
                // Nếu không có tên file gốc, tạo một tên mặc định
                originalFileName = "file.dat";
            }

            // Lấy phần mở rộng một cách an toàn, nó sẽ trả về ".jpeg" hoặc ".png"
            string extension = Path.GetExtension(originalFileName);

            // Nếu không có phần mở rộng, gán một giá trị mặc định
            if (string.IsNullOrEmpty(extension))
            {
                extension = ".jpg"; // Mặc định là jpg nếu không xác định được
            }

            // Tạo GUID mới và kết hợp với phần mở rộng đã được làm sạch
            // Path.ChangeExtension sẽ tự xử lý dấu chấm
            string guidFileName = Path.ChangeExtension(Guid.NewGuid().ToString(), extension);

            return guidFileName;
        }

        /// <summary>
        /// Endpoint để upload file từ form-data
        /// </summary>
        [HttpPost("upload-file")]
        public async Task<IActionResult> UploadFile([FromForm] IFormFile file)
        {
            try
            {
                if (file == null || file.Length == 0)
                {
                    return Ok(new ApiResponse
                    {
                        Success = false,
                        Message = "Không có file nào được tải lên.",
                        Data = new
                        {
                            OriginalFileUrl = "",
                            SavedFileName = "",
                            SavedFileUrl = "",
                            SavedFileSize = "",
                            Error = "File không tồn tại hoặc rỗng."
                        }
                    });
                }

                // Lưu file và trả về thông tin
                var savedFileName = GenerateSafeFileName(file.FileName);
                var savedFileUrl = await SaveFileAsync(file.OpenReadStream(), savedFileName);

                return Ok(new ApiResponse
                {
                    Success = true,
                    Message = $"Upload file: {savedFileName} thành công. File đã lưu tại: {savedFileUrl}",
                    Data = new
                    {
                        OriginalFileUrl = file.FileName,
                        SavedFileName = savedFileName,
                        SavedFileUrl = savedFileUrl.SavedFileUrl,
                        SavedFileSize = savedFileUrl.SavedFileSize,
                        Error = ""
                    }
                });
            }
            catch (Exception ex)
            {
                return Ok(new ApiResponse
                {
                    Success = false,
                    Message = "Upload file không thành công.",
                    Data = new
                    {
                        OriginalFileUrl = file.FileName,
                        SavedFileName = "",
                        SavedFileUrl = "",
                        SavedFileSize = "",
                        Error = ex.Message
                    }
                });
            }
        }

        /// <summary>
        /// Endpoint để xử lý URL từ JSON body
        /// </summary>
        [HttpPost("upload-url")]
        public async Task<IActionResult> UploadUrl([FromBody] UploadRequest request)
        {
            try
            {
                if (request == null || string.IsNullOrEmpty(request.Url))
                {
                    return Ok(new ApiResponse
                    {
                        Success = false,
                        Message = "URL không được để trống.",
                        Data = new
                        {
                            OriginalFileUrl = "",
                            SavedFileName = "",
                            SavedFileUrl = "",
                            SavedFileSize = "",
                            Error = "URL không hợp lệ."
                        }
                    });
                }

                string originalFileUrl = request.Url;
                string savedFileName = "";
                string savedFileUrl = "";
                string savedFileSize = "";
                string errorMessage = "";

                if (originalFileUrl.StartsWith("http"))
                {
                    // Xử lý public internet file
                    using (var httpClient = new HttpClient())
                    {
                        var fileStream = await httpClient.GetStreamAsync(originalFileUrl); // Sử dụng await thay vì .Result
                        savedFileName = string.Format("{0}{1}", Guid.NewGuid().ToString(), Path.GetExtension(originalFileUrl));
                        var savedFile = await SaveFileAsync(fileStream, savedFileName);
                        savedFileUrl = savedFile.SavedFileUrl;
                        savedFileSize = savedFile.SavedFileSize;
                    }
                }
                else
                {
                    // Xử lý relative file
                    var filePath = Path.Combine(_environment.WebRootPath, originalFileUrl.TrimStart('/'));
                    if (System.IO.File.Exists(filePath))
                    {
                        savedFileName = Path.GetFileName(filePath);
                        savedFileUrl = $"/{originalFileUrl.TrimStart('/')}";
                        savedFileSize = new FileInfo(filePath).Length / 1024 + "kb";
                    }
                    else
                    {
                        errorMessage = "File không tồn tại trong thư mục.";
                    }
                }

                if (!string.IsNullOrEmpty(errorMessage))
                {
                    return Ok(new ApiResponse
                    {
                        Success = false,
                        Message = $"Upload file: {originalFileUrl} không thành công.",
                        Data = new
                        {
                            OriginalFileUrl = originalFileUrl,
                            SavedFileName = "",
                            SavedFileUrl = "",
                            SavedFileSize = "",
                            Error = errorMessage
                        }
                    });
                }

                return Ok(new ApiResponse
                {
                    Success = true,
                    Message = $"Upload file: {originalFileUrl} thành công. File đã lưu tại: {savedFileUrl}",
                    Data = new
                    {
                        OriginalFileUrl = originalFileUrl,
                        SavedFileName = savedFileName,
                        SavedFileUrl = savedFileUrl,
                        SavedFileSize = savedFileSize,
                        Error = ""
                    }
                });
            }
            catch (Exception ex)
            {
                return Ok(new ApiResponse
                {
                    Success = false,
                    Message = "Upload file không thành công.",
                    Data = new
                    {
                        OriginalFileUrl = "",
                        SavedFileName = "",
                        SavedFileUrl = "",
                        SavedFileSize = "",
                        Error = ex.Message
                    }
                });
            }
        }

        /// <summary>
        /// Hàm lưu file vào thư mục và trả về đường dẫn tương đối
        /// </summary>
        private async Task<(string SavedFileUrl, string SavedFileSize)> SaveFileAsync(Stream fileStream, string fileName)
        {
            var uploadsFolder = Path.Combine(_environment.WebRootPath, "FileUploads");
            if (!Directory.Exists(uploadsFolder))
            {
                Directory.CreateDirectory(uploadsFolder);
            }

            var filePath = Path.Combine(uploadsFolder, fileName);
            using (var fileStreamOutput = new FileStream(filePath, FileMode.Create))
            {
                await fileStream.CopyToAsync(fileStreamOutput); // Sử dụng CopyToAsync thay vì CopyTo
            }

            var fileSize = new FileInfo(filePath).Length / 1024 + "kb";
            return ($"https://localhost:7143/FileUploads/{fileName}", fileSize);
        }
    }
}