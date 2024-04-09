export class UnauthorizedError extends Error {
  statusCode: number = 401;
  constructor(message: string) {
    super(message);
    this.statusCode = 401;
  }
}
