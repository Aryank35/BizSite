import type { FieldErrors } from "@/lib/action-result";

export class AppError extends Error {
  constructor(
    message: string,
    readonly code: "NOT_FOUND" | "FORBIDDEN" | "VALIDATION" | "CONFLICT" | "RATE_LIMITED",
    readonly fieldErrors?: FieldErrors,
  ) {
    super(message);
    this.name = "AppError";
  }
}

/** Also used when a record exists but belongs to another tenant, so existence is not leaked. */
export class NotFoundError extends AppError {
  constructor(what = "Record") {
    super(`${what} not found`, "NOT_FOUND");
  }
}

export class ForbiddenError extends AppError {
  constructor(message = "You do not have permission to do that") {
    super(message, "FORBIDDEN");
  }
}

export class ValidationError extends AppError {
  constructor(message: string, fieldErrors?: FieldErrors) {
    super(message, "VALIDATION", fieldErrors);
  }
}

export class ConflictError extends AppError {
  constructor(message: string, fieldErrors?: FieldErrors) {
    super(message, "CONFLICT", fieldErrors);
  }
}

export class RateLimitError extends AppError {
  constructor(message = "Too many requests. Please wait a few minutes and try again.") {
    super(message, "RATE_LIMITED");
  }
}
