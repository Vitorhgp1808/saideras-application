export interface CustomError extends Error {
  info?: unknown;
  status?: number;
}