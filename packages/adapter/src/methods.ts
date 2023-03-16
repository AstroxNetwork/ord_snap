import { MetamaskOrdRpcRequest, SignRawMessageResponse, SignMessageResponse, EncryptMessageResponse, SnapConfig } from '@astrox/ord-snap-types';
import { MetamaskOrdSnap } from './snap';
import { Signature } from '@dfinity/agent';

async function sendSnapMethod<T>(request: MetamaskOrdRpcRequest, snapId: string): Promise<T> {
  return await window.ethereum.request({
    method: snapId,
    params: [request],
  });
}

export async function configure(this: MetamaskOrdSnap, configuration: SnapConfig): Promise<void> {
  return await sendSnapMethod({ method: 'Ord_configure', params: { configuration: configuration } }, this.snapId);
}

export async function sign(this: MetamaskOrdSnap, message: string): Promise<SignMessageResponse> {
  return await sendSnapMethod({ method: 'Ord_sign', params: { message: message } }, this.snapId);
}

export async function signRawMessage(this: MetamaskOrdSnap, rawMessage: string): Promise<SignRawMessageResponse> {
  return await sendSnapMethod({ method: 'Ord_signRawMessage', params: { message: rawMessage } }, this.snapId);
}

export async function encryptMessage(this: MetamaskOrdSnap, theirPublicKey: string, message: string): Promise<EncryptMessageResponse> {
  return await sendSnapMethod({ method: 'Ord_encryptMessage', params: { theirPublicKey, message } }, this.snapId);
}

export async function decryptMessage(this: MetamaskOrdSnap, theirPublicKey: string, cipherText: string): Promise<string> {
  return await sendSnapMethod({ method: 'Ord_decryptMessage', params: { theirPublicKey, cipherText } }, this.snapId);
}

export async function getPrincipal(this: MetamaskOrdSnap): Promise<string> {
  return await sendSnapMethod({ method: 'Ord_getPrincipal' }, this.snapId);
}

export async function getRawPublicKey(this: MetamaskOrdSnap): Promise<string> {
  return await sendSnapMethod({ method: 'Ord_getRawPublicKey' }, this.snapId);
}
