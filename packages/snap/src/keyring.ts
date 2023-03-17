import { Wallet } from '@astrox/ord-snap-types';
import * as bitcoin from 'bitcoinjs-lib';

import { isTaprootInput } from 'bitcoinjs-lib/src/psbt/bip371';
import ECPairFactory, { ECPairInterface } from 'ecpair';
import ecc from '@bitcoinerlab/secp256k1';

import { Network } from 'bitcoinjs-lib';
import { getPrivateKeyFromWallet } from './base';
import { SnapsGlobalObject } from '@metamask/snaps-types';
import { sha256 } from 'bitcoinjs-lib/src/crypto';
import { fromHexString } from './util';

bitcoin.initEccLib(ecc);
const ECPair = ECPairFactory(ecc);

const type = 'Simple Key Pair';
export const toXOnly = (pubKey: Buffer) => (pubKey.length === 32 ? pubKey : pubKey.subarray(1, 33));

function tapTweakHash(pubKey: Buffer, h: Buffer | undefined): Buffer {
  return bitcoin.crypto.taggedHash('TapTweak', Buffer.concat(h ? [pubKey, h] : [pubKey]));
}

export interface TweakOpts {
  tweakHash?: Buffer;
  network?: Network;
  index?: number;
}

export async function getSignerFromWallet(wallet: SnapsGlobalObject, opts: TweakOpts = {}): Promise<ECPairInterface> {
  let privateKey: Uint8Array | undefined = await getPrivateKeyFromWallet(wallet, opts.index);
  return ECPair.fromPrivateKey(Buffer.from(privateKey), {
    network: opts.network,
  });
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
    network: opts.network,
  });
}

export class OrdKeyring {
  static type = type;
  type = type;
  network: bitcoin.Network = bitcoin.networks.bitcoin;
  wallets: ECPairInterface[] = [];
  currentIndex = 0;
  private wallet: SnapsGlobalObject;

  constructor(wallet: SnapsGlobalObject) {
    this.wallet = wallet;
  }

  static async fromIndex(wallet: SnapsGlobalObject, index: number): Promise<OrdKeyring> {
    const ord = new OrdKeyring(wallet);
    await ord.addAccounts(index == 0 ? 1 : index);
    return ord;
  }

  async serialize(): Promise<any> {
    return this.wallets.map(wallet => wallet.privateKey.toString('hex'));
  }

  async addAccounts(n = 1) {
    const newWallets: ECPairInterface[] = [];
    for (let i = 0; i < n; i++) {
      newWallets.push(await getSignerFromWallet(this.wallet, { index: i }));
    }
    this.currentIndex = n;
    // this.wallet.request({
    //   method: 'snap_manageState',
    //   params: ['update', { currentIndex: this.currentIndex }],
    // });

    this.wallets = this.wallets.concat(newWallets);
    const hexWallets = newWallets.map(({ publicKey }) => publicKey.toString('hex'));
    return hexWallets;
  }

  async getAccounts() {
    return this.wallets.map(({ publicKey }) => publicKey.toString('hex'));
  }

  async signTransaction(psbt: bitcoin.Psbt, inputs: { index: number; publicKey: string; sighashTypes?: number[] }[], opts?: TweakOpts) {
    inputs.forEach(input => {
      const keyPair = this._getPrivateKeyFor(input.publicKey);
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

  async signMessage(publicKey: string, text: string) {
    const keyPair = this._getPrivateKeyFor(publicKey);
    const sig = keyPair.sign(sha256(Buffer.from(text)));
    return sig.toString('hex');
  }

  async verifyMessage(publicKey: string, text: string, sig: string) {
    return ecc.verify(sha256(Buffer.from(text)), new Uint8Array(fromHexString(publicKey)), new Uint8Array(fromHexString(sig)));
  }

  private _getPrivateKeyFor(publicKey: string) {
    if (!publicKey) {
      throw new Error('Must specify publicKey.');
    }
    const wallet = this._getWalletForAccount(publicKey);
    return wallet;
  }

  async exportAccount(publicKey: string) {
    const wallet = this._getWalletForAccount(publicKey);
    return wallet.privateKey.toString('hex');
  }

  removeAccount(publicKey: string) {
    if (!this.wallets.map(wallet => wallet.publicKey.toString('hex')).includes(publicKey)) {
      throw new Error(`PublicKey ${publicKey} not found in this keyring`);
    }

    this.wallets = this.wallets.filter(wallet => wallet.publicKey.toString('hex') !== publicKey);
  }

  private _getWalletForAccount(publicKey: string) {
    let wallet = this.wallets.find(wallet => wallet.publicKey.toString('hex') == publicKey);
    if (!wallet) {
      throw new Error('Simple Keyring - Unable to find matching publicKey.');
    }
    return wallet;
  }
}
