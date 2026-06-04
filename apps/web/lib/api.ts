import { MentisixClient } from '@mentisix/sdk';

const baseUrl = process.env.NEXT_PUBLIC_API_URL ?? 'http://localhost:4000';

export const client = new MentisixClient({ baseUrl });
