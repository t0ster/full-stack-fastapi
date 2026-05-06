export class ForbiddenError extends Error {
  readonly status = 403

  constructor(message = "You do not have permission to access this page.") {
    super(message)
    this.name = "ForbiddenError"
    Object.setPrototypeOf(this, ForbiddenError.prototype)
  }
}
