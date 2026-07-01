export class OfflineError extends Error {
  constructor(message = 'Request blocked: device is offline') {
    super(message);
    this.name = 'OfflineError';
  }
}
