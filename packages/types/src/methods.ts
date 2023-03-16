import { SnapConfig } from './snap';

export abstract class WalletMethod {
  static enable: string = 'wallet_enable';
  static getSnaps: string = 'wallet_getSnaps';
  static installSnaps: string = 'wallet_installSnaps';
  static invokeSnaps: string = 'wallet_invokeSnap';
}

export const OrdCoin = 'BTC';
export const OrdCoinCode = 0;

export abstract class SnapMethods {
  static confirm: string = 'snap_confirm';
  static manageState: string = 'snap_manageState';
  static getBip44Entropy: string = `snap_getBip44Entropy_${OrdCoinCode}`;
}

export type MetamaskState = {
  ord: {
    config: SnapConfig;
    messages: ArrayBuffer[];
  };
};

export interface ConfigureRequest {
  method: 'Ord_configure';
  params: {
    configuration: SnapConfig;
  };
}

export interface SignRequest {
  method: 'Ord_sign';
  params: {
    message: string;
  };
}
export interface SignRawMessageRequest {
  method: 'Ord_signRawMessage';
  params: {
    message: string;
  };
}

export interface EncryptMessageRequest {
  method: 'Ord_encryptMessage';
  params: {
    theirPublicKey: string;
    message: string;
  };
}

export interface DecryptMessageRequest {
  method: 'Ord_decryptMessage';
  params: {
    theirPublicKey: string;
    cipherText: string;
  };
}

export interface GetRawPublicKey {
  method: 'Ord_getRawPublicKey';
}

export interface GetPrincipal {
  method: 'Ord_getPrincipal';
}

export type MetamaskOrdRpcRequest =
  | ConfigureRequest
  | SignRequest
  | SignRawMessageRequest
  | GetPrincipal
  | GetRawPublicKey
  | EncryptMessageRequest
  | DecryptMessageRequest;

type Method = MetamaskOrdRpcRequest['method'];
