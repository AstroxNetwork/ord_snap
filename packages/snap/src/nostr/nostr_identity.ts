import { SchnorrIdentity } from '../schnorr/identity';
import { getEventHash, nip19, nip26, signEvent, UnsignedEvent } from 'nostr-tools';
import { toHexString } from '../snap/util';
import { ProfilePointer } from 'nostr-tools/lib/nip19';
import { fromHexString } from '@dfinity/candid';

import * as secp from '@noble/secp256k1';
import { getIdentity } from '../schnorr/getIdentity';
import browserifyCipher from 'browserify-cipher';
import { EncryptMessageResponse } from '@astrox/ord-snap-types';
import { SnapsGlobalObject } from '@metamask/snaps-types';
import { StorageService } from '../snap/storage';

export class NostrIdentity extends SchnorrIdentity {
  public storage: StorageService;
  constructor(snap: SnapsGlobalObject, schnorr: SchnorrIdentity) {
    const kp = schnorr.getKeyPair();
    super(schnorr.getPublicKey(), kp.secretKey);
    this.storage = new StorageService(snap, 'nostr');
  }

  static async fromSchnorr(snap: SnapsGlobalObject, schnorr: SchnorrIdentity): Promise<NostrIdentity> {
    const id = new NostrIdentity(snap, schnorr);
    const relays = await id.loadRelays();
    id.addRelays(relays ?? []);
    return id;
  }

  public relays: string[] = [];

  private get pk(): string {
    return toHexString(this.getPublicKey().toRaw());
  }

  public get npub(): string {
    return nip19.npubEncode(this.pk);
  }

  public async addRelays(newRelays: string[]): Promise<string[]> {
    const arr = [...new Set([...this.relays, ...newRelays])];
    await this.storage.setData<string[]>(arr);
    return arr;
  }

  public async getRelays(): Promise<string[]> {
    return this.relays;
  }

  public async loadRelays(): Promise<string[]> {
    return await this.storage.getData<string[]>();
  }

  public get nprofile(): string {
    return nip19.nprofileEncode({ pubkey: this.pk, relays: this.relays });
  }

  public async delegate(other: string): Promise<nip26.Delegation> {
    const otherPk = this.decodeString(other);
    return await this.createDelegation({
      pubkey: otherPk,
      kind: 1,
      since: Math.round(Date.now() / 1000),
      until: Math.round(Date.now() / 1000) + 60 * 60 * 24 * 30 /* 30 days */,
    });
  }

  private decodeString(someString: string): string {
    if (someString.startsWith('nprofile')) {
      return (nip19.decode(someString).data as ProfilePointer).pubkey;
    } else if (someString.startsWith('npub1')) {
      return nip19.decode(someString).data as string;
    } else {
      return someString;
    }
  }

  public async signEvent(event: UnsignedEvent): Promise<string> {
    const hash = getEventHash(event);
    return toHexString(await this.sign(fromHexString(hash)));
  }

  public encrypt(theirPublicKey: string, text: string): EncryptMessageResponse {
    let sharedPoint = toHexString(secp.getSharedSecret(toHexString(new Uint8Array(this.getKeyPair().secretKey)), '02' + theirPublicKey));
    let sharedX = sharedPoint.substring(2, 64 + 2);

    let iv = crypto.getRandomValues(new Uint8Array(16));

    let cipher = browserifyCipher.createCipheriv('aes-256-cbc', new Uint8Array(fromHexString(sharedX)), iv);
    let encryptedMessage = cipher.update(text, 'utf8', 'base64');
    encryptedMessage += cipher.final('base64');
    let ivBase64 = Buffer.from(iv.buffer).toString('base64');

    return {
      pubkey: this.pk,
      created_at: Math.floor(Date.now() / 1000),
      kind: 4,
      tags: [['p', theirPublicKey]],
      content: encryptedMessage + '?iv=' + ivBase64,
    };
  }

  public decrypt(theirPublicKey: string, cipherText: string): string {
    const [emsg, iv] = cipherText.split('?iv=');

    let sharedPoint = toHexString(secp.getSharedSecret(toHexString(new Uint8Array(this.getKeyPair().secretKey)), '02' + theirPublicKey));
    let sharedX = sharedPoint.substring(2, 64 + 2);
    let deCipher = browserifyCipher.createDecipheriv(
      'aes-256-cbc',
      new Uint8Array(fromHexString(sharedX)),
      new Uint8Array(Buffer.from(iv, 'base64')),
    );
    let decryptedMessage = deCipher.update(emsg, 'base64');
    return (decryptedMessage + deCipher.final('utf8')) as string;
  }
}
