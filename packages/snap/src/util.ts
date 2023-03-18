import { KeyPair, Signature, SignIdentity } from '@dfinity/agent';
import * as secp256k1 from '@noble/secp256k1';
import { Secp256k1PublicKey, JsonableSecp256k1Identity } from '@dfinity/identity-secp256k1';
import { SnapsGlobalObject } from '@metamask/snaps-types';
import * as bitcoin from 'bitcoinjs-lib';
import ECPairFactory from 'ecpair';
import ecc from '@bitcoinerlab/secp256k1';

import { AddressType, NetworkType } from './constant/types';

bitcoin.initEccLib(ecc);
const ECPair = ECPairFactory(ecc);

/**
 * Return an array buffer from its hexadecimal representation.
 * @param hexString The hexadecimal string.
 */
export function fromHexString(hexString: string): ArrayBuffer {
  return new Uint8Array((hexString.match(/.{1,2}/g) ?? []).map(byte => parseInt(byte, 16))).buffer;
}

/**
 * Returns an hexadecimal representation of an array buffer.
 * @param bytes The array buffer.
 */
export function toHexString(bytes: ArrayBuffer): string {
  return new Uint8Array(bytes).reduce((str, byte) => str + byte.toString(16).padStart(2, '0'), '');
}

export const getMetamaskVersion = async (wallet: SnapsGlobalObject): Promise<string> =>
  (await wallet.request({
    method: 'web3_clientVersion',
    params: [],
  })) as string;

export const isNewerVersion = (current: string, comparingWith: string): boolean => {
  if (current === comparingWith) return false;

  const regex = /[^\d.]/g;
  const currentFragments = current.replace(regex, '').split('.');
  const comparingWithFragments = comparingWith.replace(regex, '').split('.');

  const length = currentFragments.length > comparingWithFragments.length ? currentFragments.length : comparingWithFragments.length;
  for (let i = 0; i < length; i++) {
    if ((Number(currentFragments[i]) || 0) === (Number(comparingWithFragments[i]) || 0)) continue;
    return (Number(comparingWithFragments[i]) || 0) > (Number(currentFragments[i]) || 0);
  }

  return true;
};

export class SchorrIdentity extends SignIdentity {
  /**
   * Generates an identity. If a seed is provided, the keys are generated from the
   * seed according to BIP 0032. Otherwise, the key pair is randomly generated.
   * This method throws an error in case the seed is not 32 bytes long or invalid
   * for use as a private key.
   * @param {Uint8Array} seed the optional seed
   * @returns {SchorrIdentity}
   */
  public static generate(): SchorrIdentity {
    const privateKey = secp256k1.utils.randomPrivateKey();
    const publicKeyRaw = secp256k1.schnorr.getPublicKey(privateKey);

    const publicKey = Secp256k1PublicKey.fromRaw(publicKeyRaw);
    return new this(publicKey, privateKey);
  }

  public static fromParsedJson(obj: JsonableSecp256k1Identity): SchorrIdentity {
    const [publicKeyRaw, privateKeyRaw] = obj;
    return new SchorrIdentity(Secp256k1PublicKey.fromRaw(fromHexString(publicKeyRaw)), fromHexString(privateKeyRaw));
  }

  public static fromJSON(json: string): SchorrIdentity {
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
   * @returns {SchorrIdentity}
   */
  public static fromKeyPair(publicKey: ArrayBuffer, privateKey: ArrayBuffer): SchorrIdentity {
    return new SchorrIdentity(Secp256k1PublicKey.fromRaw(publicKey), privateKey);
  }

  /**
   * generates an identity from an existing secret key, and is the correct method to generate an identity from a seed phrase. Please ensure you protect the user's private key.
   * @param {ArrayBuffer} secretKey
   * @returns {SchorrIdentity}
   */
  public static fromSecretKey(secretKey: ArrayBuffer): SchorrIdentity {
    const publicKey = secp256k1.schnorr.getPublicKey(new Uint8Array(secretKey));
    const identity = SchorrIdentity.fromKeyPair(publicKey, new Uint8Array(secretKey));
    return identity;
  }

  /**
   * Generates an identity from a seed phrase. Use carefully - seed phrases should only be used in secure contexts, and you should avoid having users copying and pasting seed phrases as much as possible.
   * @param {string | string[]} seedPhrase - either an array of words or a string of words separated by spaces.
   * @param password - optional password to be used by bip39
   * @returns SchorrIdentity
   */
  // public static fromSeedPhrase(seedPhrase: string | string[], password?: string | undefined): SchorrIdentity {
  //   // Convert to string for convenience
  //   const phrase = Array.isArray(seedPhrase) ? seedPhrase.join(' ') : seedPhrase;
  //   // Warn if provided phrase is not conventional
  //   if (phrase.split(' ').length < 12 || phrase.split(' ').length > 24) {
  //     console.warn('Warning - an unusually formatted seed phrase has been provided. Decoding may not work as expected');
  //   }

  //   const seed = mnemonicToSeedSync(phrase, password);
  //   const root = hdkey.fromMasterSeed(seed);
  //   const addrnode = root.derive("m/44'/223'/0'/0/0");

  //   return SchorrIdentity.fromSecretKey(addrnode.privateKey);
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
}

export const validator = (pubkey: Buffer, msghash: Buffer, signature: Buffer): boolean => ECPair.fromPublicKey(pubkey).verify(msghash, signature);

export function toPsbtNetwork(networkType: NetworkType) {
  if (networkType === NetworkType.MAINNET) {
    return bitcoin.networks.bitcoin;
  } else {
    return bitcoin.networks.testnet;
  }
}

export function publicKeyToAddress(publicKey: string, type: AddressType, networkType: NetworkType) {
  const network = toPsbtNetwork(networkType);
  if (!publicKey) return '';
  const pubkey = Buffer.from(publicKey, 'hex');
  if (type === AddressType.P2PKH) {
    const { address } = bitcoin.payments.p2pkh({ 
      pubkey,
      network,
    });
    return address || '';
  } else if (type === AddressType.P2WPKH || type === AddressType.M44_P2WPKH) {
    const { address } = bitcoin.payments.p2wpkh({
      pubkey,
      network,
    });
    return address || '';
  } else if (type === AddressType.P2TR || type === AddressType.M44_P2TR) {
    const { address } = bitcoin.payments.p2tr({
      internalPubkey: pubkey.subarray(1, 33),
      network,
    });
    return address || '';
  } else if (type === AddressType.P2SH_P2WPKH) {
    const data = bitcoin.payments.p2wpkh({
      pubkey,
      network,
    });
    const { address } = bitcoin.payments.p2sh({
      pubkey,
      network,
      redeem: data,
    });
    return address || '';
  } else {
    return '';
  }
}

export function isValidAddress(address, network: bitcoin.Network) {
  let error;
  try {
    bitcoin.address.toOutputScript(address, network);
  } catch (e) {
    error = e;
  }
  if (error) {
    return false;
  } else {
    return true;
  }
}
