import * as secp from '@noble/secp256k1';
import { getIdentity } from './getIdentity';
import browserifyCipher from 'browserify-cipher';
import { fromHexString, SchorrIdentity, toHexString } from './util';
import { EncryptMessageResponse } from '@astrox/ord-snap-types';
import { SnapsGlobalObject } from '@metamask/snaps-types';

export async function decryptMessage(wallet: SnapsGlobalObject, theirPublicKey: string, cipherText: string): Promise<EncryptMessageResponse> {
  const identityString = await getIdentity(wallet);
  const identity = SchorrIdentity.fromJSON(identityString);

  const [emsg, iv] = cipherText.split('?iv=');

  let sharedPoint = toHexString(secp.getSharedSecret(toHexString(new Uint8Array(identity.getKeyPair().secretKey)), '02' + theirPublicKey));
  let sharedX = sharedPoint.substring(2, 64 + 2);
  let deCipher = browserifyCipher.createDecipheriv('aes-256-cbc', new Uint8Array(fromHexString(sharedX)), new Uint8Array(Buffer.from(iv, 'base64')));
  let decryptedMessage = deCipher.update(emsg, 'base64');
  return decryptedMessage + deCipher.final('utf8');
}
