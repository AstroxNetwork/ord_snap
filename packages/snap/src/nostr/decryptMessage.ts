import { getIdentity } from '../schnorr/getIdentity';
import { EncryptMessageResponse } from '@astrox/ord-snap-types';
import { SnapsGlobalObject } from '@metamask/snaps-types';
import { NostrIdentity } from './nostr_identity';

export async function decryptMessage(wallet: SnapsGlobalObject, theirPublicKey: string, cipherText: string): Promise<string> {
  const identityString = await getIdentity(wallet);
  const identity = await NostrIdentity.fromSchnorr(wallet, NostrIdentity.fromJSON(identityString));
  return identity.decrypt(theirPublicKey, cipherText);
}
