export function jsonError(message: string, status: number) {
  return Response.json({ error: message }, { status })
}

export function getBearerToken(request: Request) {
  const authorization = request.headers.get("authorization")

  if (!authorization?.startsWith("Bearer ")) {
    return null
  }

  return authorization.slice("Bearer ".length).trim() || null
}
