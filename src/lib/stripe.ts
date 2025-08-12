import { loadStripe } from '@stripe/stripe-js';

// Chave pública do Stripe (pode ser exposta no frontend)
const stripePublishableKey = 'pk_test_51RZdhFDGt0uIjeynvpHlPQDbHvN2MVQAaGItWmNdJO4Nh5re7AFvDuoT1nfixJl9cRsGtJLdEU264sMvRe3KRcgm00ziW9Ke01';

// Inicializar Stripe
export const stripe = loadStripe(stripePublishableKey);

export const STRIPE_CONFIG = {
  publishableKey: stripePublishableKey,
  currency: 'brl',
  country: 'BR',
};
