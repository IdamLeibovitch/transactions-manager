export type LoginRequest = {
  username: string
  password: string
}

export type LoginResponse = {
  accessToken: string
  expiresAtUtc: string
}

export type AuthSession = LoginResponse & {
  username: string
}
