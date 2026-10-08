import type { EmailRequest } from './schema';

export interface RenderedEmail {
  subject: string;
  text: string;
  html: string;
}

const escapeHtml = (value: string) =>
  value.replace(/[&<>"']/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' })[c]!);

const money = (cents: number) => `$${(cents / 100).toFixed(2)}`;

/** Pure rendering: easy to test, and user data is always HTML-escaped. */
export const renderEmail = (email: EmailRequest): RenderedEmail => {
  switch (email.type) {
    case 'welcome': {
      const name = escapeHtml(email.data.name);
      return {
        subject: `Welcome, ${email.data.name}!`,
        text: `Hi ${email.data.name},\n\nThanks for signing up.`,
        html: `<p>Hi ${name},</p><p>Thanks for signing up.</p>`,
      };
    }
    case 'order-confirmation': {
      const orderId = escapeHtml(email.data.orderId);
      return {
        subject: `Order ${email.data.orderId} confirmed`,
        text: `Your order ${email.data.orderId} (${money(email.data.totalCents)}) is confirmed.`,
        html: `<p>Your order <strong>${orderId}</strong> (${money(email.data.totalCents)}) is confirmed.</p>`,
      };
    }
  }
};
