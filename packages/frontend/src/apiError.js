export class ApiError extends Error {
  constructor(status, message, details = []) {
    super(message);
    this.status = status;
    this.details = details; // list of validation problems from a 400 response
  }
}

export function errorMessages(error) {
  return error.details?.length ? error.details : [error.message];
}
