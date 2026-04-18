export class TtsResolveError extends Error {
  status: number

  constructor(message: string, status: number) {
    super(message)
    this.name = "TtsResolveError"
    this.status = status
  }
}
