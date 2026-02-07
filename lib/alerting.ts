/**
 * Alerting utilities for critical errors
 */

interface SlackMessage {
  text: string;
  blocks?: Array<{
    type: string;
    text?: {
      type: string;
      text: string;
    };
    fields?: Array<{
      type: string;
      text: string;
    }>;
  }>;
}

/**
 * Send alert to Slack webhook
 */
export async function sendSlackAlert(
  title: string,
  message: string,
  severity: 'info' | 'warning' | 'error' | 'critical' = 'error',
  metadata?: Record<string, any>
): Promise<boolean> {
  const webhookUrl = process.env.SLACK_WEBHOOK_URL;
  
  if (!webhookUrl) {
    console.warn('[Alerting] SLACK_WEBHOOK_URL not configured');
    return false;
  }

  const emoji = {
    info: ':information_source:',
    warning: ':warning:',
    error: ':x:',
    critical: ':rotating_light:',
  }[severity];

  const color = {
    info: '#36a64f',
    warning: '#ff9800',
    error: '#f44336',
    critical: '#9c27b0',
  }[severity];

  const slackMessage: SlackMessage = {
    text: `${emoji} ${title}`,
    blocks: [
      {
        type: 'header',
        text: {
          type: 'plain_text',
          text: `${emoji} ${title}`,
        },
      },
      {
        type: 'section',
        text: {
          type: 'mrkdwn',
          text: message,
        },
      },
    ],
  };

  // Add metadata fields if provided
  if (metadata && Object.keys(metadata).length > 0) {
    const fields = Object.entries(metadata).map(([key, value]) => ({
      type: 'mrkdwn',
      text: `*${key}:*\n${JSON.stringify(value, null, 2)}`,
    }));

    slackMessage.blocks?.push({
      type: 'section',
      fields,
    });
  }

  try {
    const response = await fetch(webhookUrl, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(slackMessage),
    });

    if (!response.ok) {
      console.error('[Alerting] Failed to send Slack alert:', response.statusText);
      return false;
    }

    return true;
  } catch (error) {
    console.error('[Alerting] Error sending Slack alert:', error);
    return false;
  }
}

/**
 * Alert on data sync failures
 */
export async function alertDataSyncFailure(
  endpoint: string,
  error: string,
  attemptCount: number
): Promise<void> {
  await sendSlackAlert(
    'Data Sync Failure',
    `Failed to sync data from \`${endpoint}\` after ${attemptCount} attempts.`,
    attemptCount > 3 ? 'critical' : 'error',
    {
      endpoint,
      error,
      attempts: attemptCount,
      timestamp: new Date().toISOString(),
    }
  );
}

/**
 * Alert on API rate limit exhaustion
 */
export async function alertRateLimitExhausted(
  endpoint: string,
  ip: string
): Promise<void> {
  await sendSlackAlert(
    'Rate Limit Exhausted',
    `IP \`${ip}\` has exhausted rate limit for \`${endpoint}\`.`,
    'warning',
    {
      endpoint,
      ip,
      timestamp: new Date().toISOString(),
    }
  );
}

/**
 * Alert on MinIO connection failures
 */
export async function alertMinIOFailure(
  bucket: string,
  error: string
): Promise<void> {
  await sendSlackAlert(
    'MinIO Connection Failure',
    `Failed to connect to MinIO bucket \`${bucket}\`.`,
    'critical',
    {
      bucket,
      error,
      timestamp: new Date().toISOString(),
    }
  );
}

/**
 * Alert on stale data detection
 */
export async function alertStaleData(
  dataAge: number,
  maxAge: number
): Promise<void> {
  await sendSlackAlert(
    'Stale Data Detected',
    `Data is ${dataAge}ms old, exceeding max age of ${maxAge}ms.`,
    'warning',
    {
      dataAge,
      maxAge,
      ageHours: Math.round(dataAge / 1000 / 60 / 60),
      timestamp: new Date().toISOString(),
    }
  );
}
