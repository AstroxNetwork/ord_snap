import * as secp from '@noble/secp256k1';
import { getIdentity } from './getIdentity';
import browserifyCipher from 'browserify-cipher';
import { fromHexString, SchorrIdentity, toHexString } from './util';
import { EncryptMessageResponse } from '@astrox/ord-snap-types';
import { SnapsGlobalObject } from '@metamask/snaps-types';

export async function encryptMessage(wallet: SnapsGlobalObject, theirPublicKey: string, text: string): Promise<EncryptMessageResponse> {
  const identityString = await getIdentity(wallet);
  const identity = SchorrIdentity.fromJSON(identityString);
  let sharedPoint = toHexString(secp.getSharedSecret(toHexString(new Uint8Array(identity.getKeyPair().secretKey)), '02' + theirPublicKey));
  let sharedX = sharedPoint.substring(2, 64 + 2);

  let iv = crypto.getRandomValues(new Uint8Array(16));

  let cipher = browserifyCipher.createCipheriv('aes-256-cbc', new Uint8Array(fromHexString(sharedX)), iv);
  let encryptedMessage = cipher.update(text, 'utf8', 'base64');
  encryptedMessage += cipher.final('base64');
  let ivBase64 = Buffer.from(iv.buffer).toString('base64');

  return {
    pubkey: toHexString(identity.getPublicKey().toRaw()),
    created_at: Math.floor(Date.now() / 1000),
    kind: 4,
    tags: [['p', theirPublicKey]],
    content: encryptedMessage + '?iv=' + ivBase64,
  };
}
