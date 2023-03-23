import * as secp from '@noble/secp256k1';
import { getIdentity } from '../schnorr/getIdentity';
import browserifyCipher from 'browserify-cipher';
import { fromHexString, toHexString } from '../snap/util';
import { EncryptMessageResponse } from '@astrox/ord-snap-types';
import { SnapsGlobalObject } from '@metamask/snaps-types';
import { SchnorrIdentity } from '../schnorr/identity';
import { NostrIdentity } from './nostr_identity';

export async function encryptMessage(wallet: SnapsGlobalObject, theirPublicKey: string, text: string): Promise<EncryptMessageResponse> {
  const identityString = await getIdentity(wallet);
  const identity = await NostrIdentity.fromSchnorr(wallet, NostrIdentity.fromJSON(identityString));
  return identity.encrypt(theirPublicKey, text);
}
