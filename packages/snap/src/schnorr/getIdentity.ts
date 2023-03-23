import { Wallet } from '@astrox/ord-snap-types';
import { SchnorrIdentity } from './identity';
import { getPrivateKeyFromWallet } from '../snap/base';
import { SnapsGlobalObject } from '@metamask/snaps-types';
import { NostrIdentity } from '../nostr/nostr_identity';

export async function getIdentity(wallet: SnapsGlobalObject, index?: number): Promise<string> {
  const privateKey = await getPrivateKeyFromWallet(wallet, undefined, index);

  const sk = SchnorrIdentity.fromSecretKey(privateKey.buffer);

  return JSON.stringify(sk.toJSON());
  // Now, you can ask the user to e.g. sign transactions!
}

export async function getNostr(wallet: SnapsGlobalObject, index?: number): Promise<NostrIdentity> {
  const id = await getIdentity(wallet);
  const nostr = NostrIdentity.fromSchnorr(wallet, SchnorrIdentity.fromJSON(id));
  return nostr;
  // Now, you can ask the user to e.g. sign transactions!
}
