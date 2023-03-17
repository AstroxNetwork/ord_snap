import { Wallet } from '@astrox/ord-snap-types';
import { SchorrIdentity } from './util';
import { getPrivateKeyFromWallet } from './base';
import { SnapsGlobalObject } from '@metamask/snaps-types';

export async function getIdentity(wallet: SnapsGlobalObject, index?: number): Promise<string> {
  const privateKey = await getPrivateKeyFromWallet(wallet, index);

  const sk = SchorrIdentity.fromSecretKey(privateKey.buffer);

  return JSON.stringify(sk.toJSON());
  // Now, you can ask the user to e.g. sign transactions!
}
