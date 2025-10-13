// PostHog analytics client (server-side)
const { PostHog } = require('posthog-node');

const posthogApiKey = process.env.POSTHOG_API_KEY;
const posthogHost = process.env.POSTHOG_HOST || 'https://app.posthog.com';

let posthog = null;

if (posthogApiKey) {
  posthog = new PostHog(posthogApiKey, {
    host: posthogHost,
  });
  console.log('✓ PostHog analytics enabled');
} else {
  console.warn('⚠ PostHog API key not set, analytics disabled');
}

async function trackEvent({ distinctId, event, properties }) {
  if (!posthog) return;
  
  try {
    posthog.capture({
      distinctId,
      event,
      properties,
    });
  } catch (error) {
    console.error('PostHog tracking error:', error);
  }
}

// Flush events on shutdown
process.on('SIGTERM', async () => {
  if (posthog) {
    await posthog.shutdown();
  }
});

module.exports = { trackEvent, posthog };

