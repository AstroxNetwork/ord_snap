import {
  MetamaskOrdRpcRequest,
  SignRawMessageResponse,
  SignMessageResponse,
  EncryptMessageResponse,
  SnapConfig,
  InitKeyRing,
} from '@astrox/ord-snap-types';

import { MetamaskOrdSnap } from './snap';
import { Signature } from '@dfinity/agent';

async function sendSnapMethod<T>(request: MetamaskOrdRpcRequest, snapId: string): Promise<T> {
  console.log({ request, snapId });
  return await window.ethereum.request({
    method: 'wallet_invokeSnap',
    params: {
      request,
      snapId,
    },
  });
}

export async function configure(this: MetamaskOrdSnap, configuration: SnapConfig): Promise<void> {
  return await sendSnapMethod({ method: 'Schnorr_configure', params: { configuration: configuration } }, this.snapId);
}

export async function sign(this: MetamaskOrdSnap, message: string): Promise<SignMessageResponse> {
  return await sendSnapMethod({ method: 'Schnorr_sign', params: { message: message } }, this.snapId);
}

export async function signRawMessage(this: MetamaskOrdSnap, rawMessage: string): Promise<SignRawMessageResponse> {
  return await sendSnapMethod({ method: 'Schnorr_signRawMessage', params: { message: rawMessage } }, this.snapId);
}

export async function encryptMessage(this: MetamaskOrdSnap, theirPublicKey: string, message: string): Promise<EncryptMessageResponse> {
  return await sendSnapMethod({ method: 'Schnorr_encryptMessage', params: { theirPublicKey, message } }, this.snapId);
}

export async function decryptMessage(this: MetamaskOrdSnap, theirPublicKey: string, cipherText: string): Promise<string> {
  return await sendSnapMethod({ method: 'Schnorr_decryptMessage', params: { theirPublicKey, cipherText } }, this.snapId);
}

export async function getPrincipal(this: MetamaskOrdSnap): Promise<string> {
  return await sendSnapMethod({ method: 'Schnorr_getPrincipal' }, this.snapId);
}

export async function getRawPublicKey(this: MetamaskOrdSnap): Promise<string> {
  return await sendSnapMethod({ method: 'Schnorr_getRawPublicKey' }, this.snapId);
}

export async function initKeyRing(this: MetamaskOrdSnap): Promise<boolean> {
  return await sendSnapMethod({ method: 'Ord_initKeyRing' }, this.snapId);
}
