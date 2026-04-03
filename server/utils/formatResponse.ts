import type { ApiResponse } from "#shared/types/api";

export const resFormatMethod = <T>(
  code: number,
  result: T | null = null,
  message: string,
): ApiResponse<T> => {
  return {
    code,
    result,
    message,
  };
};
