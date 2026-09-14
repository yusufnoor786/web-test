'use client';

// Declare types for window analytics globals
declare global {
  interface Window {
    gtag?: (...args: unknown[]) => void;
    fbq?: (...args: unknown[]) => void;
  }
}

export interface AnalyticsItem {
  id: string;
  name: string;
  category?: string;
  price: number;
}

/**
 * Dispatches view_item event to GA4 and Meta Pixel (ViewContent).
 */
export function trackViewItem(item: AnalyticsItem) {
  if (typeof window === 'undefined') return;

  if (window.gtag) {
    window.gtag('event', 'view_item', {
      currency: 'INR',
      value: item.price,
      items: [
        {
          item_id: item.id,
          item_name: item.name,
          item_category: item.category,
          price: item.price,
        },
      ],
    });
  }

  if (window.fbq) {
    window.fbq('track', 'ViewContent', {
      content_name: item.name,
      content_ids: [item.id],
      content_type: 'product',
      value: item.price,
      currency: 'INR',
    });
  }
}

/**
 * Dispatches begin_checkout event to GA4 and Meta Pixel (InitiateCheckout).
 */
export function trackBeginCheckout(items: AnalyticsItem[], totalValue: number) {
  if (typeof window === 'undefined') return;

  if (window.gtag) {
    window.gtag('event', 'begin_checkout', {
      currency: 'INR',
      value: totalValue,
      items: items.map((it) => ({
        item_id: it.id,
        item_name: it.name,
        price: it.price,
      })),
    });
  }

  if (window.fbq) {
    window.fbq('track', 'InitiateCheckout', {
      content_ids: items.map((it) => it.id),
      contents: items.map((it) => ({ id: it.id, quantity: 1 })),
      value: totalValue,
      currency: 'INR',
      num_items: items.length,
    });
  }
}

/**
 * Dispatches purchase event to GA4 and Meta Pixel (Purchase).
 */
export function trackPurchase(orderNumber: string, items: AnalyticsItem[], totalValue: number) {
  if (typeof window === 'undefined') return;

  if (window.gtag) {
    window.gtag('event', 'purchase', {
      transaction_id: orderNumber,
      currency: 'INR',
      value: totalValue,
      items: items.map((it) => ({
        item_id: it.id,
        item_name: it.name,
        price: it.price,
      })),
    });
  }

  if (window.fbq) {
    window.fbq('track', 'Purchase', {
      content_type: 'product',
      contents: items.map((it) => ({ id: it.id, quantity: 1 })),
      value: totalValue,
      currency: 'INR',
      order_id: orderNumber,
    });
  }
}
