import { createCipheriv, createDecipheriv, createHash, randomBytes } from 'node:crypto';
import { HttpError } from '../middleware/errorHandler.js';
import { toLedgerTransaction } from '../domain/bankImport.js';

const MAX_PAGES = 50; // a safety stop for one sync: 50 pages of 100 transactions

/**
 * Encrypts Plaid access tokens at rest with AES-256-GCM. The key comes from
 * PLAID_TOKEN_KEY, or from TOKEN_SECRET, never from the code. A token saved under
 * one key can't be read with another, so changing the key means reconnecting.
 */
export function createTokenBox(secret) {
  const key = createHash('sha256').update(`ledgerlogic-plaid:${secret}`).digest();
  return {
    seal(plain) {
      const iv = randomBytes(12);
      const cipher = createCipheriv('aes-256-gcm', key, iv);
      const data = Buffer.concat([cipher.update(plain, 'utf8'), cipher.final()]);
      return ['v1', iv, cipher.getAuthTag(), data].map((part) =>
        typeof part === 'string' ? part : part.toString('base64'),
      ).join(':');
    },
    open(sealed) {
      const [version, iv, tag, data] = sealed.split(':');
      if (version !== 'v1') throw new Error('Unknown token format');
      const decipher = createDecipheriv('aes-256-gcm', key, Buffer.from(iv, 'base64'));
      decipher.setAuthTag(Buffer.from(tag, 'base64'));
      return Buffer.concat([
        decipher.update(Buffer.from(data, 'base64')),
        decipher.final(),
      ]).toString('utf8');
    },
  };
}

/** Plaid errors carry tokens and request details: log only the code, show a plain message. */
function bankError(error) {
  const code = error?.body?.error_code ?? error?.statusCode ?? error?.message;
  console.error('Plaid request failed:', code);
  return new HttpError(502, 'We couldn’t reach your bank. Please try again.');
}

/** US-10: connect a bank through Plaid and import its transactions (#94). */
export function createPlaidService({ plaid, bank, categories, tokenSecret }) {
  const box = createTokenBox(tokenSecret);

  async function categoryId(userId, name, type, cache) {
    const key = `${type}:${name}`;
    if (!cache.has(key)) {
      const found = await categories.findByName(userId, name);
      cache.set(key, (found ?? (await categories.create(userId, name, type))).id);
    }
    return cache.get(key);
  }

  return {
    async status(userId) {
      return { enabled: true, connected: Boolean(await bank.findConnection(userId)) };
    },

    async createLinkToken(userId) {
      try {
        return { linkToken: await plaid.createLinkToken(userId) };
      } catch (error) {
        throw bankError(error);
      }
    },

    async connect(userId, { publicToken }) {
      if (typeof publicToken !== 'string' || publicToken === '') {
        throw new HttpError(400, 'publicToken is required');
      }
      let exchanged;
      try {
        exchanged = await plaid.exchangePublicToken(publicToken);
      } catch (error) {
        throw bankError(error);
      }
      await bank.saveConnection(userId, exchanged.itemId, box.seal(exchanged.accessToken));
      return { connected: true };
    },

    /** Imports everything new since the last sync. Safe to run again: nothing is imported twice. */
    async sync(userId) {
      const connection = await bank.findConnection(userId);
      if (!connection) throw new HttpError(404, 'Connect a bank first.');
      const accessToken = box.open(connection.accessTokenEnc);
      const cache = new Map();
      let cursor = connection.cursor;
      let imported = 0;
      let skipped = 0;
      for (let page = 0; page < MAX_PAGES; page++) {
        let result;
        try {
          result = await plaid.syncTransactions(accessToken, cursor);
        } catch (error) {
          throw bankError(error);
        }
        for (const plaidTx of result.added) {
          const tx = toLedgerTransaction(plaidTx);
          if (!tx) {
            skipped++;
            continue;
          }
          const id = await categoryId(userId, tx.categoryName, tx.type, cache);
          if (await bank.insertImported(userId, id, tx)) imported++;
          else skipped++;
        }
        cursor = result.nextCursor;
        await bank.saveCursor(userId, cursor);
        if (!result.hasMore) break;
      }
      return { imported, skipped };
    },
  };
}
