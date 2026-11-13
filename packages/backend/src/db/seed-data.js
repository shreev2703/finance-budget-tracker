import bcrypt from 'bcrypt';
import { BCRYPT_ROUNDS } from '../domain/user.js';

export const DEMO_USER_EMAIL = 'demo@ledgerlogic.app';
export const DEMO_USER_PASSWORD = 'demo-password';
export const hashDemoPassword = () => bcrypt.hashSync(DEMO_USER_PASSWORD, BCRYPT_ROUNDS);

export function currentPeriod(now = new Date()) {
  return `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}`;
}
