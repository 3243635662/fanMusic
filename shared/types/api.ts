export interface ApiResponse<T> {
  code: number;

  result: T | null;

  message: string;
}
