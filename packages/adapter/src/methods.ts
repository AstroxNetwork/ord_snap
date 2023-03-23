import {
  MetamaskOrdRpcRequest,
  SignRawMessageResponse,
  SignMessageResponse,
  EncryptMessageResponse,
  SnapConfig,
  UTXO,
  TXSendBTC,
  UnsignedEvent,
} from '@astrox/ord-snap-types';

import { MetamaskOrdSnap } from './snap';
import { Signature } from '@dfinity/agent';

async function sendSnapMethod<T>(request: MetamaskOrdRpcRequest, snapId: string): Promise<T> {
  return await window.ethereum.request({
    method: 'wallet_invokeSnap',
    params: {
      request,
      snapId,
    },
  });
}

export async function configure(this: MetamaskOrdSnap, configuration: SnapConfig): Promise<void> {
  return await sendSnapMethod({ method: 'Global_configure', params: { configuration: configuration } }, this.snapId);
}

export async function getPrincipal(this: MetamaskOrdSnap): Promise<string> {
  return await sendSnapMethod({ method: 'Global_getPrincipal' }, this.snapId);
}

export async function getRawPublicKey(this: MetamaskOrdSnap): Promise<string> {
  return await sendSnapMethod({ method: 'Global_getRawPublicKey' }, this.snapId);
}

export async function sign(this: MetamaskOrdSnap, message: string): Promise<SignMessageResponse> {
  return await sendSnapMethod({ method: 'Nostr_sign', params: { message: message } }, this.snapId);
}

export async function signRawMessage(this: MetamaskOrdSnap, rawMessage: string): Promise<SignRawMessageResponse> {
  return await sendSnapMethod({ method: 'Nostr_signRawMessage', params: { message: rawMessage } }, this.snapId);
}

export async function encryptMessage(this: MetamaskOrdSnap, theirPublicKey: string, message: string): Promise<EncryptMessageResponse> {
  return await sendSnapMethod({ method: 'Nostr_encryptMessage', params: { theirPublicKey, message } }, this.snapId);
}

export async function decryptMessage(this: MetamaskOrdSnap, theirPublicKey: string, cipherText: string): Promise<string> {
  return await sendSnapMethod({ method: 'Nostr_decryptMessage', params: { theirPublicKey, cipherText } }, this.snapId);
}
export async function getNPub(this: MetamaskOrdSnap): Promise<string> {
  return await sendSnapMethod({ method: 'Nostr_getNPub' }, this.snapId);
}
export async function getNProfile(this: MetamaskOrdSnap): Promise<string> {
  return await sendSnapMethod({ method: 'Nostr_getNProfile' }, this.snapId);
}
export async function signEvent(this: MetamaskOrdSnap, unsignedEvent: UnsignedEvent): Promise<string> {
  return await sendSnapMethod({ method: 'Nostr_signEvent', params: { unsignedEvent } }, this.snapId);
}
export async function delegate(this: MetamaskOrdSnap, other: string): Promise<string> {
  return await sendSnapMethod({ method: 'Nostr_delegate', params: { other } }, this.snapId);
}
export async function addRelays(this: MetamaskOrdSnap, relays: string[]): Promise<string> {
  return await sendSnapMethod({ method: 'Nostr_addRelays', params: { relays } }, this.snapId);
}

export async function getAddress(this: MetamaskOrdSnap): Promise<string> {
  return await sendSnapMethod({ method: 'Ord_getAddress', params: {} }, this.snapId);
}

export async function addNextAccount(this: MetamaskOrdSnap): Promise<string> {
  return await sendSnapMethod({ method: 'Ord_addNextAccount' }, this.snapId);
}

export async function initWallet(this: MetamaskOrdSnap, host?: string, headers?: Record<string, unknown>): Promise<string> {
  return await sendSnapMethod({ method: 'Ord_initWallet', params: { host, headers } }, this.snapId);
}

export async function getAddressUtxo(this: MetamaskOrdSnap, address: string): Promise<string> {
  return await sendSnapMethod({ method: 'Ord_getAddressUtxo', params: { address } }, this.snapId);
}

export async function getAddressBalance(this: MetamaskOrdSnap, address: string): Promise<string> {
  return await sendSnapMethod({ method: 'Ord_getAddressBalance', params: { address } }, this.snapId);
}

export async function sendBTC(
  this: MetamaskOrdSnap,
  to: string,
  amount: number,
  utxos: UTXO[],
  autoAdjust: boolean,
  feeRate: number,
): Promise<TXSendBTC> {
  return await sendSnapMethod({ method: 'Ord_sendBTC', params: { to, amount, utxos, autoAdjust, feeRate } }, this.snapId);
}

export async function sendInscription(
  this: MetamaskOrdSnap,
  to: string,
  inscriptionId: string,
  utxos: UTXO[],
  feeRate: number,
  outputValue: number,
): Promise<TXSendBTC> {
  return await sendSnapMethod({ method: 'Ord_sendInscription', params: { to, inscriptionId, utxos, outputValue, feeRate } }, this.snapId);
}
