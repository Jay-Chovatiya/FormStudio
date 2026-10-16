namespace FormStudio.Application.Common
{
    public class ApiResponse<T>
    {
        public int StatusCode { get; set; } = 200;
        public string Message { get; set; } = string.Empty;
        public T? Data { get; set; }
        public DateTime Timestamp { get; set; } = DateTime.Now;

        public static ApiResponse<T> Ok(T data, string message = "Operation successful", int statusCode = 200)
        {
            return new ApiResponse<T>
            {
                StatusCode = statusCode,
                Message = message,
                Data = data,
                Timestamp = DateTime.Now
            };
        }

        public static ApiResponse<T> SuccessResult(string message = "Operation successful", int statusCode = 200)
        {
            return new ApiResponse<T>
            {
                StatusCode = statusCode,
                Message = message,
                Data = default,
                Timestamp = DateTime.Now
            };
        }

        public static ApiResponse<T> Of(int statusCode, string message, T? data = default)
        {
            return new ApiResponse<T>
            {
                StatusCode = statusCode,
                Message = message,
                Data = data,
                Timestamp = DateTime.Now
            };
        }
    }
}
