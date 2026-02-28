// /opt/gpti/gpti-site/integrations/slack-bot.ts
// @ts-nocheck

import { App } from '@slack/bolt';

const slackBotToken = process.env.SLACK_BOT_TOKEN || '';
const slackSigningSecret = process.env.SLACK_SIGNING_SECRET || '';
const copilotUrl = process.env.COPILOT_URL || 'http://localhost:3000';

if (!slackBotToken || !slackSigningSecret) {
  throw new Error('Missing Slack env vars: SLACK_BOT_TOKEN or SLACK_SIGNING_SECRET');
}

const app = new App({
  token: slackBotToken,
  signingSecret: slackSigningSecret,
});

app.message(/^!copilot\s+(.+)/, async ({ message, say }) => {
  const messageText = 'text' in message && typeof message.text === 'string' ? message.text : '';
  const text = messageText.replace(/^!copilot\s+/, '').trim();
  if (!text) return;

  const response = await fetch(`${copilotUrl}/api/admin/copilot/`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      message: text,
      agentMode: true,
    }),
  });

  const data = await response.json();

  await say({
    text: data.response || 'No response from Copilot',
  });
});

(async () => {
  const port = parseInt(process.env.SLACK_PORT || '3001', 10);
  await app.start(port);
  console.log(`Slack bot running on port ${port}`);
})();
