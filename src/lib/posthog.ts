import PostHog from 'posthog-react-native';
import { POSTHOG_KEY } from '@/constants/config';

let posthogInstance: PostHog | null = null;

export function getPostHog(): PostHog | null {
  if (!POSTHOG_KEY) {
    return null;
  }
  if (!posthogInstance) {
    posthogInstance = new PostHog(POSTHOG_KEY, {
      host: 'https://us.i.posthog.com',
    });
  }
  return posthogInstance;
}

export function captureEvent(event: string, properties?: Record<string, string | number | boolean | null | undefined>): void {
  const ph = getPostHog();
  if (ph) {
    ph.capture(event, properties);
  }
}

export function identifyUser(userId: string, properties?: Record<string, string | number | boolean | null | undefined>): void {
  const ph = getPostHog();
  if (ph) {
    ph.identify(userId, properties);
  }
}

export function resetUser(): void {
  const ph = getPostHog();
  if (ph) {
    ph.reset();
  }
}
