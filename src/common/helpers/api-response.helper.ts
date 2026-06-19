export interface ApiSuccessResponse<T> {
  statusCode: number;
  timestamp: string;
  path: string;
  status: 'success';
  length: number;
  data: T;
}

function getDataLength(data: unknown): number {
  if (Array.isArray(data)) {
    return data.length;
  }

  if (data === null || data === undefined) {
    return 0;
  }

  return 1;
}

export function buildSuccessResponse<T>(
  data: T,
  statusCode: number,
  path: string,
): ApiSuccessResponse<T> {
  return {
    statusCode,
    timestamp: new Date().toISOString(),
    path,
    status: 'success',
    length: getDataLength(data),
    data,
  };
}
