import * as bitcoin from 'bitcoinjs-lib';

import { isTaprootInput } from 'bitcoinjs-lib/src/psbt/bip371';
import ECPairFactory, { ECPairInterface } from 'ecpair';
import ecc from '@bitcoinerlab/secp256k1';

import { Network } from 'bitcoinjs-lib';
import { getPrivateKeyFromSLIP10 } from '../snap/base';
import { SnapsGlobalObject } from '@metamask/snaps-types';
import { sha256 } from 'bitcoinjs-lib/src/crypto';
import { fromHexString, publicKeyToAddress, toPsbtNetwork } from '../snap/util';
import { AddressType, NetworkType } from '../constant/types';
import { ADDRESS_TYPES } from '../constant/constant';
import { StorageService } from '../snap/storage';

bitcoin.initEccLib(ecc);
const ECPair = ECPairFactory(ecc);

const type = 'Simple Key Pair';
export const toXOnly = (pubKey: Buffer) => (pubKey.length === 32 ? pubKey : pubKey.subarray(1, 33));

function tapTweakHash(pubKey: Buffer, h: Buffer | undefined): Buffer {
  return bitcoin.crypto.taggedHash('TapTweak', Buffer.concat(h ? [pubKey, h] : [pubKey]));
}

export interface TweakOpts {
  tweakHash?: Buffer;
  network?: NetworkType;
  addressType?: AddressType;
  index?: number;
}

export interface DisplayedKeryring {
  accounts: {
    pubkey: string;
    type?: string;
    aliasName?: string;
  }[];
  addressType: AddressType;
  index: number;
}

export interface AddressPair {
  index: number;
  pair: ECPairInterface;
  addressType: AddressType;
  network: NetworkType;
  address: string;
}

export interface SignerInterface {
  index: number;
  addressPairs: AddressPair[];
}

export interface AddressInterface {
  publicKey: string;
  network: string;
  addressType: string;
  address: string;
  index: number;
}

export interface Accounts {
  index: number;
  addresses: AddressInterface[];
}

export async function getSignerFromWallet(
  snap: SnapsGlobalObject,
  opts: TweakOpts = { addressType: AddressType.P2TR, index: 0 },
): Promise<SignerInterface> {
  const addressPairs: AddressPair[] = [];
  for (let i = 0; i < ADDRESS_TYPES.length; i += 1) {
    const d = ADDRESS_TYPES[i];
    const path = getDerivePathFromAddressType(d.value);
    const prv = await getPrivateKeyFromSLIP10(snap, path, opts.index);
    const pair = ECPair.fromPrivateKey(Buffer.from(prv), {
      network: toPsbtNetwork(opts.network ?? NetworkType.MAINNET),
    });

    const network = opts.network ?? NetworkType.MAINNET;
    const address = publicKeyToAddress(pair.publicKey.toString('hex'), d.value, network);
    addressPairs.push({
      index: opts.index,
      pair,
      addressType: d.value,
      network,
      address,
    });
  }

  return {
    index: opts.index,
    addressPairs,
  };
}

export function getDerivePathFromAddressType(addressType: AddressType): string | undefined {
  return ADDRESS_TYPES.find(d => d.value === addressType).hdPath;
}

export function getAddressLabelName(addressType: AddressType): string | undefined {
  return ADDRESS_TYPES.find(d => d.value === addressType).name;
}

function tweakSigner(signer: bitcoin.Signer, opts: TweakOpts = {}): bitcoin.Signer {
  // eslint-disable-next-line @typescript-eslint/ban-ts-comment
  // @ts-ignore
  let privateKey: Uint8Array | undefined = signer.privateKey!;
  if (!privateKey) {
    throw new Error('Private key is required for tweaking signer!');
  }
  if (signer.publicKey[0] === 3) {
    privateKey = ecc.privateNegate(privateKey);
  }

  const tweakedPrivateKey = ecc.privateAdd(privateKey, tapTweakHash(toXOnly(signer.publicKey), opts.tweakHash));
  if (!tweakedPrivateKey) {
    throw new Error('Invalid tweaked private key!');
  }

  return ECPair.fromPrivateKey(Buffer.from(tweakedPrivateKey), {
    network: toPsbtNetwork(opts.network ?? NetworkType.MAINNET),
  });
}

export class OrdKeyring {
  public static type = type;
  public network: bitcoin.Network = bitcoin.networks.bitcoin;
  public wallets: SignerInterface[] = [];
  private currentIndex = 0;
  private snap: SnapsGlobalObject;
  private storage: StorageService;

  constructor(snap: SnapsGlobalObject) {
    this.snap = snap;
    this.storage = new StorageService(snap, 'keyRing');
  }

  static async fromIndex(snap: SnapsGlobalObject, index?: number): Promise<OrdKeyring> {
    const ord = new OrdKeyring(snap);
    await ord.addAccounts(index === 0 || index === undefined ? 1 : index);
    await ord.saveWallets();
    return ord;
  }

  static async fromStorage(snap: SnapsGlobalObject): Promise<OrdKeyring> {
    const ord = new OrdKeyring(snap);
    ord.wallets = [];
    const arr = await ord.getWallets();
    if (arr.length > 0) {
      for (let i = 0; i < arr.length; i += 1) {
        await ord.addAccount(arr[i]);
      }
    } else {
      await ord.addAccount(0);
    }
    await ord.saveWallets();
    return ord;
  }

  public getNetworkType(): NetworkType {
    return this.network === bitcoin.networks.bitcoin ? NetworkType.MAINNET : NetworkType.TESTNET;
  }

  public switchNetwork(networkType: NetworkType): void {
    this.network = toPsbtNetwork(networkType);
  }

  public async addNextAccount() {
    const index = this.getNextIndex();
    await this.addAccount(index);
    await this.saveWallets();
  }

  public getNextIndex(): number {
    const arr = this.wallets.map(d => d.index);
    return Math.max(...arr) + 1;
  }

  public async saveWallets() {
    const arr = this.wallets.map(e => e.index);
    await this.storage.setData<number[]>(arr);
  }

  public async getWallets(): Promise<number[]> {
    return await this.storage.getData<number[]>();
  }

  async addAccount(index: number) {
    const signer = await getSignerFromWallet(this.snap, { index });
    if (this.wallets.findIndex(e => e.index === index) === -1) {
      this.wallets.push(signer);
      return true;
    } else {
      return false;
    }
  }

  async addAccounts(n = 1): Promise<Accounts[]> {
    const newWallets: SignerInterface[] = [];
    const exist = await this.getAccounts();
    if (exist.length < n) {
      for (let i = 0; i < n; i++) {
        newWallets.push(await getSignerFromWallet(this.snap, { index: i }));
      }
      this.currentIndex = n;
    } else {
      this.currentIndex = exist.length;
    }

    this.wallets = this.wallets.concat(newWallets);
    await this.saveWallets();
    const hexWallets = newWallets.map(d => {
      const addresses = d.addressPairs.map(e => {
        const publicKey = e.pair.publicKey.toString('hex');
        const network = e.network === NetworkType.MAINNET ? 'mainnet' : 'testnet';
        const addressType = getAddressLabelName(e.addressType);
        return {
          publicKey,
          network,
          addressType,
          address: e.address,
          index: d.index,
        };
      });
      return {
        index: d.index,
        addresses,
      };
    });
    return hexWallets;
  }

  getAccounts(): Accounts[] {
    return this.wallets.map(d => {
      const addresses = d.addressPairs.map(e => {
        const publicKey = e.pair.publicKey.toString('hex');
        const network = e.network === NetworkType.MAINNET ? 'mainnet' : 'testnet';
        const addressType = getAddressLabelName(e.addressType);
        return {
          publicKey,
          network,
          addressType,
          address: e.address,
          index: d.index,
        };
      });
      return {
        index: d.index,
        addresses,
      };
    });
  }

  signTransaction(psbt: bitcoin.Psbt, inputs: { index: number; publicKey: string; sighashTypes?: number[] }[], opts?: TweakOpts): bitcoin.Psbt {
    inputs.forEach(input => {
      const keyPair = this._getPrivateKeyFor(input.publicKey).pair;
      if (isTaprootInput(psbt.data.inputs[input.index])) {
        const signer = tweakSigner(keyPair, opts);
        psbt.signInput(input.index, signer, input.sighashTypes);
      } else {
        const signer = keyPair;
        psbt.signInput(input.index, signer, input.sighashTypes);
      }
    });
    return psbt;
  }

  signMessage(publicKey: string, text: string): string {
    const keyPair = this._getPrivateKeyFor(publicKey).pair;
    const sig = keyPair.sign(sha256(Buffer.from(text)));
    return sig.toString('hex');
  }

  verifyMessage(publicKey: string, text: string, sig: string): boolean {
    return ecc.verify(sha256(Buffer.from(text)), new Uint8Array(fromHexString(publicKey)), new Uint8Array(fromHexString(sig)));
  }

  private _getPrivateKeyFor(publicKey: string): AddressPair {
    if (!publicKey) {
      throw new Error('Must specify publicKey.');
    }
    const wallet = this._getWalletForAccount(publicKey);
    return wallet;
  }

  exportAccount(publicKey: string): string {
    const wallet = this._getWalletForAccount(publicKey);
    return wallet.pair.privateKey.toString('hex');
  }

  async removeAccount(publicKey: string): Promise<void> {
    const pairs = this.wallets.flatMap(e => e.addressPairs);
    if (!pairs.map(wallet => wallet.pair.publicKey.toString('hex')).includes(publicKey)) {
      throw new Error(`PublicKey ${publicKey} not found in this keyring`);
    }
    const index = pairs.find(wallet => wallet.pair.publicKey.toString('hex') !== publicKey).index;
    this.wallets = this.wallets.filter(wallet => wallet.index !== index);
    await this.saveWallets();
  }

  private _getWalletForAccount(publicKey: string): AddressPair {
    const pairs = this.wallets.flatMap(e => e.addressPairs);
    let wallet = pairs.find(wallet => wallet.pair.publicKey.toString('hex') == publicKey);
    if (!wallet) {
      throw new Error('Simple Keyring - Unable to find matching publicKey.');
    }
    return wallet;
  }

  public async getAddress(index?: number, addressType?: AddressType, networkType?: NetworkType): Promise<string> {
    const accounts = this.getAccounts();
    const found = accounts
      .find(e => (index !== undefined ? e.index === index : e.index === 0))
      .addresses.find(f => f.addressType === getAddressLabelName(addressType ?? AddressType.P2TR));
    return publicKeyToAddress(found.publicKey, addressType ?? AddressType.P2TR, networkType ?? NetworkType.MAINNET);
  }

  public getAccount(publicKey?: string): AddressPair {
    return this._getWalletForAccount(publicKey);
  }

  public getCurrentAccount(index?: number) {
    const accounts = this.getAccounts();
    const adds = accounts.flatMap(a => a.addresses);
    const found = adds.find(d => d.index === index ?? 0);
    return this._getWalletForAccount(found.publicKey);
  }

  private _getWalletFromAddress(address: string): AddressPair {
    const accounts = this.getAccounts();
    const adds = accounts.flatMap(a => a.addresses);
    const found = adds.find(d => d.address === address);
    return this._getWalletForAccount(found.publicKey);
  }
}
