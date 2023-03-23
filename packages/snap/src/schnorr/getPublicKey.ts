import { Wallet } from '@astrox/ord-snap-types';
import { getIdentity, getNostr } from './getIdentity';
import { SchnorrIdentity } from './identity';
import { SnapsGlobalObject } from '@metamask/snaps-types';
import { toHexString } from '../snap/util';
import { NostrIdentity } from '../nostr/nostr_identity';

export async function getRawPublicKey(wallet: SnapsGlobalObject): Promise<string> {
  const nostr = await getNostr(wallet);
  const rawPublicKey = nostr.getPublicKey().toRaw();
  return toHexString(rawPublicKey);
}
