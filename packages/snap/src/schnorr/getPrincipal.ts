import { Wallet } from '@astrox/ord-snap-types';
import { getIdentity, getNostr } from './getIdentity';
import { SchnorrIdentity } from './identity';
import { SnapsGlobalObject } from '@metamask/snaps-types';

export async function getPrincipal(wallet: SnapsGlobalObject): Promise<string> {
  const nostr = await getNostr(wallet);

  const principal = nostr.getPrincipal().toText();
  return principal;
}
