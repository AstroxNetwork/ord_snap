import { SnapsGlobalObject } from '@metamask/snaps-types';
import * as bitcoin from 'bitcoinjs-lib';
import ECPairFactory from 'ecpair';
import ecc from '@bitcoinerlab/secp256k1';

import { AddressType, NetworkType } from '../constant/types';

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
