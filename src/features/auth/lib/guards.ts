export const isAuthNavigationState = (state: unknown): state is { sessionExpired?: boolean } => {
  return typeof state === "object" && state !== null && "sessionExpired" in state;
};
