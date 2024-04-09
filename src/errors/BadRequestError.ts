import { CustomAPIError } from "./CustomAPIError";

export class BadRequestError extends CustomAPIError {
  statusCode: number = 400;
  constructor(message: string) {
    super(message);
    this.statusCode = 400;
  }
}
