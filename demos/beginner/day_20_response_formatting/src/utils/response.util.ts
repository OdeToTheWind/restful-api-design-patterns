export class ApiResponse {
  static success(res: any, data: any, message = "Success", statusCode = 200) {
    return res.status(statusCode).json({
      success: true,
      message,
      data,
      timestamp: new Date().toISOString()
    });
  }

  static error(res: any, message: string, statusCode = 400, errors?: any) {
    return res.status(statusCode).json({
      success: false,
      message,
      errors: errors || null,
      timestamp: new Date().toISOString()
    });
  }

  static paginated(res: any, data: any, pagination: any, message = "Success") {
    return res.status(200).json({
      success: true,
      message,
      data,
      pagination,
      timestamp: new Date().toISOString()
    });
  }
}