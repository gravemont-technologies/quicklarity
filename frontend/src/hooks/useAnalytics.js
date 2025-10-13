// PostHog analytics hook for frontend
import { useEffect } from 'react';
import posthog from 'posthog-js';

const POSTHOG_KEY = import.meta.env.VITE_POSTHOG_KEY;
const POSTHOG_HOST = import.meta.env.VITE_POSTHOG_HOST || 'https://app.posthog.com';

let initialized = false;

export function useAnalytics() {
  useEffect(() => {
    if (!initialized && POSTHOG_KEY) {
      posthog.init(POSTHOG_KEY, {
        api_host: POSTHOG_HOST,
        loaded: (posthog) => {
          if (import.meta.env.DEV) {
            posthog.debug();
          }
        },
      });
      initialized = true;
    }
  }, []);
  
  const trackEvent = (eventName, properties = {}) => {
    if (!POSTHOG_KEY) {
      console.log('PostHog not configured, skipping event:', eventName);
      return;
    }
    
    posthog.capture(eventName, properties);
  };
  
  const identifyUser = (userId, traits = {}) => {
    if (!POSTHOG_KEY) return;
    posthog.identify(userId, traits);
  };
  
  return { trackEvent, identifyUser };
}

