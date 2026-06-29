export class AppError extends Error {
  statusCode: number;
  constructor(message: string, statusCode = 500) {
    super(message);
    this.statusCode = statusCode;
    this.name = 'AppError';
  }
}

export function success<T>(data: T, message = 'Success', extra?: object) {
  return { success: true, message, data, ...extra };
}

export function paginated<T>(
  data: T[],
  total: number,
  page: number,
  limit: number,
  message = 'Success'
) {
  const totalPages = Math.ceil(total / limit);
  return {
    success: true,
    message,
    data,
    pagination: {
      page,
      limit,
      total,
      totalPages,
      hasNextPage: page < totalPages,
      hasPrevPage: page > 1,
    },
  };
}
