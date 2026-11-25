/* Lightweight no-op stub: analytics, session replay, and hosted support chat
   are disabled for self-hosted deployments to keep the client bundle small. */
export const posthog = {
  capture: (..._args: unknown[]) => {},
  identify: (..._args: unknown[]) => {},
  reset: () => {},
  register: (..._args: unknown[]) => {},
  stopSessionRecording: () => {},
  startSessionRecording: () => {},
  conversations: {
    isAvailable: () => false,
    show: () => {},
    hide: () => {},
  },
}

export function syncReplayForUser(_email?: string | null) {}
export function suspendAnalyticsWhileImpersonating() {}
export function setSupportWidgetVisible(_visible: boolean) {}
export function openSupportChat() {}
