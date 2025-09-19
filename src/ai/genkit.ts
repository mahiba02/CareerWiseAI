import { genkit } from 'genkit';
import { googleAI } from '@genkit-ai/googleai';
import { enableGoogleCloudTelemetry } from '@genkit-ai/google-cloud';

// Initialize Google Cloud telemetry (non-blocking)
enableGoogleCloudTelemetry({
  projectId: process.env.GOOGLE_CLOUD_PROJECT,
}).catch(() => {
  // ignore telemetry init errors in local/dev
});

export const ai = genkit({
  plugins: [googleAI()],
  model: 'googleai/gemini-2.5-flash',
});
