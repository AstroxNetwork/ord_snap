import { UTXO } from './constant/types';
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
  static dialog: string = 'snap_dialog';
  static manageState: string = 'snap_manageState';
  static getBip44Entropy: string = `snap_getBip44Entropy_${OrdCoinCode}`;
}

export type NetworkTypeString = 'mainnet' | 'testnet';
export type AddresTypeString = 'P2PKH' | 'P2WPKH' | 'P2TR' | 'P2SH-P2WPKH' | 'M44_P2TR' | 'M44_P2WPKH';

export interface DataStorage<T extends any> {
  [key: string]: { data: T; updateTime: number };
}

export type MetamaskState = {
  ord: {
    config: SnapConfig;
    messages: ArrayBuffer[];
  };
  storage: DataStorage<any>;
};

export interface ConfigureRequest {
  method: 'Schnorr_configure';
  params: {
    configuration: SnapConfig;
  };
}

export interface SignRequest {
  method: 'Schnorr_sign';
  params: {
    message: string;
  };
}
export interface SignRawMessageRequest {
  method: 'Schnorr_signRawMessage';
  params: {
    message: string;
  };
}

export interface EncryptMessageRequest {
  method: 'Schnorr_encryptMessage';
  params: {
    theirPublicKey: string;
    message: string;
  };
}

export interface DecryptMessageRequest {
  method: 'Schnorr_decryptMessage';
  params: {
    theirPublicKey: string;
    cipherText: string;
  };
}

export interface GetRawPublicKey {
  method: 'Schnorr_getRawPublicKey';
}

export interface GetPrincipal {
  method: 'Schnorr_getPrincipal';
}

export interface GetAddress {
  method: 'Ord_getAddress';
  params: {
    index?: number;
    addressType?: string;
    networkType?: string;
  };
}

export interface AddNextAccount {
  method: 'Ord_addNextAccount';
}

export interface InitWallet {
  method: 'Ord_initWallet';
  params: {
    host?: string;
    headers?: Record<string, unknown>;
  };
}

export interface GetAddressUtxo {
  method: 'Ord_getAddressUtxo';
  params: {
    address: string;
  };
}

export interface GetAddressBalance {
  method: 'Ord_getAddressBalance';
  params: {
    address: string;
  };
}

export interface SendBTC {
  method: 'Ord_sendBTC';
  params: {
    to: string;
    amount: number;
    utxos: UTXO[];
    autoAdjust: boolean;
    feeRate: number;
  };
}

export interface SendInscription {
  method: 'Ord_sendInscription';
  params: {
    to: string;
    inscriptionId: string;
    utxos: UTXO[];
    feeRate: number;
    outputValue: number;
  };
}

export type MetamaskOrdRpcRequest =
  | ConfigureRequest
  | SignRequest
  | SignRawMessageRequest
  | GetPrincipal
  | GetRawPublicKey
  | EncryptMessageRequest
  | DecryptMessageRequest
  | GetAddress
  | InitWallet
  | AddNextAccount
  | GetAddressUtxo
  | GetAddressBalance
  | SendBTC
  | SendInscription;

type Method = MetamaskOrdRpcRequest['method'];
