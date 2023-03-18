import { Wallet } from '@astrox/ord-snap-types';
import { getIdentity } from './getIdentity';
import { SchorrIdentity } from './identity';
import { SnapsGlobalObject } from '@metamask/snaps-types';

export async function getPrincipal(wallet: SnapsGlobalObject): Promise<string> {
  const identityString = await getIdentity(wallet);
  const identity = SchorrIdentity.fromJSON(identityString);
  const principal = await identity.getPrincipal().toText();
  return principal;
}
