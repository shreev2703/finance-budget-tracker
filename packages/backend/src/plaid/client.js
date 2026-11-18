import { PlaidClient, PlaidEnvironment } from 'plaid';

/**
 * The only three Plaid calls LedgerLogic makes, behind one small interface so the
 * services never import the SDK and tests can pass a fake instead.
 * Returns null when Plaid isn't configured, which hides bank connections everywhere.
 */
export function createPlaidClient(env = process.env) {
  if (!env.PLAID_CLIENT_ID || !env.PLAID_SECRET) return null;
  const environment =
    env.PLAID_ENV === 'production'
      ? PlaidEnvironment.Production
      : PlaidEnvironment.Sandbox;
  const plaid = new PlaidClient({
    environment,
    clientId: env.PLAID_CLIENT_ID,
    secret: env.PLAID_SECRET,
  });

  return {
    /** A short-lived token the website hands to Plaid Link. */
    async createLinkToken(userId) {
      const body = await plaid.link.createToken({
        client_name: 'LedgerLogic',
        user: { client_user_id: String(userId) },
        products: ['transactions'],
        country_codes: ['US'],
        language: 'en',
      });
      return body.link_token;
    },

    /** Swaps Link's one-time public token for a long-lived access token. */
    async exchangePublicToken(publicToken) {
      const body = await plaid.item.exchangePublicToken({
        public_token: publicToken,
      });
      return { accessToken: body.access_token, itemId: body.item_id };
    },

    /** One page of new transactions since `cursor` (null = from the start). */
    async syncTransactions(accessToken, cursor) {
      const body = await plaid.transactions.sync({
        access_token: accessToken,
        ...(cursor ? { cursor } : {}),
        count: 100,
      });
      return {
        added: body.added,
        nextCursor: body.next_cursor,
        hasMore: body.has_more,
      };
    },
  };
}
