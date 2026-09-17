import { randomBytes } from 'node:crypto';
import { mkdirSync, existsSync, writeFileSync, readFileSync } from 'node:fs';
import { HDWallet, Roles } from '@midnight-ntwrk/wallet-sdk-hd';
import { createKeystore, PublicKey } from '@midnight-ntwrk/wallet-sdk-unshielded-wallet';

const file = '.private/preprod-wallet.json';
const publicFile = '.private/preprod-wallet-public.json';
if (existsSync(file)) {
  console.log('Dedicated wallet already exists; private material was not opened or replaced.');
  if (existsSync(publicFile)) console.log(readFileSync(publicFile, 'utf8'));
} else {
  mkdirSync('.private', { recursive: true, mode: 0o700 });
  const seed = randomBytes(32);
  const result = HDWallet.fromSeed(seed);
  if (result.type !== 'seedOk') throw new Error('Wallet initialization failed.');
  const keys = result.hdWallet.selectAccount(0).selectRoles([Roles.NightExternal]).deriveKeysAt(0);
  if (keys.type !== 'keysDerived') throw new Error('Wallet derivation failed.');
  const keystore = createKeystore(keys.keys[Roles.NightExternal], 'preprod');
  const publicInfo = { network: 'preprod', accountIndex: 0, address: PublicKey.fromKeyStore(keystore).address };
  writeFileSync(file, JSON.stringify({ seed: seed.toString('hex'), payrollSecret: randomBytes(32).toString('hex'), storagePassword: randomBytes(32).toString('base64url') }), { flag: 'wx', mode: 0o600 });
  writeFileSync(publicFile, JSON.stringify(publicInfo, null, 2), { flag: 'wx', mode: 0o600 });
  result.hdWallet.clear(); seed.fill(0);
  console.log('Dedicated Preprod wallet created. Secrets remain in the ignored, owner-readable project directory.');
  console.log(JSON.stringify(publicInfo));
}
