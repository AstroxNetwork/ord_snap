import { KeyPair, Signature, SignIdentity } from '@dfinity/agent';
import * as secp256k1 from '@noble/secp256k1';
import { Secp256k1PublicKey, JsonableSecp256k1Identity } from '@dfinity/identity-secp256k1';
import { fromHexString, toHexString } from '../snap/util';
import { Delegation } from 'nostr-tools/lib/nip26';

export type Parameters = {
  pubkey: string; // the key to whom the delegation will be given
  kind: number | undefined;
  until: number | undefined; // delegation will only be valid until this date
  since: number | undefined; // delegation will be valid from this date on
};

export class SchnorrIdentity extends SignIdentity {
  /**
   * Generates an identity. If a seed is provided, the keys are generated from the
   * seed according to BIP 0032. Otherwise, the key pair is randomly generated.
   * This method throws an error in case the seed is not 32 bytes long or invalid
   * for use as a private key.
   * @param {Uint8Array} seed the optional seed
   * @returns {SchnorrIdentity}
   */
  public static generate(): SchnorrIdentity {
    const privateKey = secp256k1.utils.randomPrivateKey();
    const publicKeyRaw = secp256k1.schnorr.getPublicKey(privateKey);

    const publicKey = Secp256k1PublicKey.fromRaw(publicKeyRaw);
    return new this(publicKey, privateKey);
  }

  public static fromParsedJson(obj: JsonableSecp256k1Identity): SchnorrIdentity {
    const [publicKeyRaw, privateKeyRaw] = obj;
    return new SchnorrIdentity(Secp256k1PublicKey.fromRaw(fromHexString(publicKeyRaw)), fromHexString(privateKeyRaw));
  }

  public static fromJSON(json: string): SchnorrIdentity {
    const parsed = JSON.parse(json);
    if (Array.isArray(parsed)) {
      if (typeof parsed[0] === 'string' && typeof parsed[1] === 'string') {
        return this.fromParsedJson([parsed[0], parsed[1]]);
      }
      throw new Error('Deserialization error: JSON must have at least 2 items.');
    }
    throw new Error(`Deserialization error: Invalid JSON type for string: ${JSON.stringify(json)}`);
  }

  /**
   * generates an identity from a public and private key. Please ensure that you are generating these keys securely and protect the user's private key
   * @param {ArrayBuffer} publicKey
   * @param {ArrayBuffer} privateKey
   * @returns {SchnorrIdentity}
   */
  public static fromKeyPair(publicKey: ArrayBuffer, privateKey: ArrayBuffer): SchnorrIdentity {
    return new SchnorrIdentity(Secp256k1PublicKey.fromRaw(publicKey), privateKey);
  }

  /**
   * generates an identity from an existing secret key, and is the correct method to generate an identity from a seed phrase. Please ensure you protect the user's private key.
   * @param {ArrayBuffer} secretKey
   * @returns {SchnorrIdentity}
   */
  public static fromSecretKey(secretKey: ArrayBuffer): SchnorrIdentity {
    const publicKey = secp256k1.schnorr.getPublicKey(new Uint8Array(secretKey));
    const identity = SchnorrIdentity.fromKeyPair(publicKey, new Uint8Array(secretKey));
    return identity;
  }

  /**
   * Generates an identity from a seed phrase. Use carefully - seed phrases should only be used in secure contexts, and you should avoid having users copying and pasting seed phrases as much as possible.
   * @param {string | string[]} seedPhrase - either an array of words or a string of words separated by spaces.
   * @param password - optional password to be used by bip39
   * @returns SchnorrIdentity
   */
  // public static fromSeedPhrase(seedPhrase: string | string[], password?: string | undefined): SchnorrIdentity {
  //   // Convert to string for convenience
  //   const phrase = Array.isArray(seedPhrase) ? seedPhrase.join(' ') : seedPhrase;
  //   // Warn if provided phrase is not conventional
  //   if (phrase.split(' ').length < 12 || phrase.split(' ').length > 24) {
  //     console.warn('Warning - an unusually formatted seed phrase has been provided. Decoding may not work as expected');
  //   }

  //   const seed = mnemonicToSeedSync(phrase, password);
  //   const root = hdkey.fromMasterSeed(seed);
  //   const addrnode = root.derive("m/44'/223'/0'/0/0");

  //   return SchnorrIdentity.fromSecretKey(addrnode.privateKey);
  // }

  protected _publicKey: Secp256k1PublicKey;

  protected constructor(publicKey: Secp256k1PublicKey, protected _privateKey: ArrayBuffer) {
    super();
    this._publicKey = publicKey;
  }

  /**
   * Serialize this key to JSON-serializable object.
   * @returns {JsonableSecp256k1Identity}
   */
  public toJSON(): JsonableSecp256k1Identity {
    return [toHexString(this._publicKey.toRaw()), toHexString(this._privateKey)];
  }

  /**
   * Return a copy of the key pair.
   * @returns {KeyPair}
   */
  public getKeyPair(): KeyPair {
    return {
      secretKey: this._privateKey,
      publicKey: this._publicKey,
    };
  }

  /**
   * Return the public key.
   * @returns {Secp256k1PublicKey}
   */
  public getPublicKey(): Secp256k1PublicKey {
    return this._publicKey;
  }

  /**
   * Signs a blob of data, with this identity's private key.
   * @param {ArrayBuffer} challenge - challenge to sign with this identity's secretKey, producing a signature
   * @returns {Promise<Signature>} signature
   */
  public async sign(challenge: ArrayBuffer): Promise<Signature> {
    const msg = await secp256k1.utils.sha256(new Uint8Array(challenge));
    const signature = await secp256k1.schnorr.sign(toHexString(msg), new Uint8Array(this._privateKey));

    const pub = secp256k1.schnorr.getPublicKey(toHexString(this._privateKey));

    if ((await secp256k1.schnorr.verify(toHexString(signature), toHexString(msg), toHexString(pub))) === false) {
      throw 'Signature or Message is malformed';
    }

    return signature.buffer as Signature;
  }

  public async createDelegation(parameters: Parameters): Promise<Delegation> {
    let conditions = [];
    if ((parameters.kind || -1) >= 0) conditions.push(`kind=${parameters.kind}`);
    if (parameters.until) conditions.push(`created_at<${parameters.until}`);
    if (parameters.since) conditions.push(`created_at>${parameters.since}`);
    let cond = conditions.join('&');
    if (cond === '') throw new Error('refusing to create a delegation without any conditions');
    let msg = new TextEncoder().encode(`nostr:delegation:${parameters.pubkey}:${cond}`);
    let sig = secp256k1.utils.bytesToHex(new Uint8Array(await this.sign(msg)));

    return {
      from: toHexString(this.getPublicKey().toRaw()),
      to: parameters.pubkey,
      cond,
      sig,
    };
  }
}
