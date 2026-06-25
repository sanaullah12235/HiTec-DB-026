export class AppError extends Error {
  public readonly statusCode: number;
  public readonly code: string;

  constructor(message: string, statusCode = 500, code = 'INTERNAL_ERROR') {
    super(message);
    this.name = this.constructor.name;
    this.statusCode = statusCode;
    this.code = code;
  }
}

export class DatabaseError extends AppError {
  public readonly pgCode?: string;
  public readonly pgMessage?: string;
  public readonly pgDetail?: string;
  public readonly pgHint?: string;

  constructor(
    message: string,
    pgCode?: string,
    pgMessage?: string,
    pgDetail?: string,
    pgHint?: string,
  ) {
    super(message, 500, 'DATABASE_ERROR');
    this.pgCode = pgCode;
    this.pgMessage = pgMessage;
    this.pgDetail = pgDetail;
    this.pgHint = pgHint;
  }
}

export class DeadlockError extends DatabaseError {
  constructor(message = 'Transaction aborted due to concurrent access. Please retry.') {
    super(message, '40001', 'serialization_failure');
  }
}

export class ConflictError extends DatabaseError {
  constructor(message = 'Resource already exists.', detail?: string) {
    super(message, '23505', 'unique_violation', detail);
  }
}

export class ForeignKeyError extends DatabaseError {
  constructor(message = 'Referenced resource not found.', detail?: string) {
    super(message, '23503', 'foreign_key_violation', detail);
  }
}

export class CheckViolationError extends DatabaseError {
  constructor(message = 'Check constraint violated.', detail?: string) {
    super(message, '23514', 'check_violation', detail);
  }
}

export class NotNullViolationError extends DatabaseError {
  constructor(message = 'Required field is null.', detail?: string) {
    super(message, '23502', 'not_null_violation', detail);
  }
}

export class RaiseExceptionError extends DatabaseError {
  constructor(message: string, hint?: string) {
    super(message, 'P0001', 'raise_exception', undefined, hint);
  }
}

export class QueryCanceledError extends DatabaseError {
  constructor(message = 'Query was canceled.') {
    super(message, '57014', 'query_canceled');
  }
}

export class NetworkError extends AppError {
  public readonly cause?: unknown;
  constructor(message = 'Network error communicating with the database.', cause?: unknown) {
    super(message, 503, 'NETWORK_ERROR');
    this.cause = cause;
  }
}

export class TimeoutError extends AppError {
  constructor(message = 'Database request timed out.') {
    super(message, 504, 'TIMEOUT');
  }
}

export class NotFoundError extends AppError {
  constructor(message = 'Resource not found.') {
    super(message, 404, 'NOT_FOUND');
  }
}

export class UnauthorizedError extends AppError {
  constructor(message = 'Unauthorized.') {
    super(message, 401, 'UNAUTHORIZED');
  }
}

export class ForbiddenError extends AppError {
  constructor(message = 'Forbidden.') {
    super(message, 403, 'FORBIDDEN');
  }
}

export class ValidationError extends AppError {
  constructor(message: string) {
    super(message, 400, 'VALIDATION_ERROR');
  }
}
