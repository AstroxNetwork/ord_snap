import { UnsignedEvent, UTXO } from './constant/types';
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
  method: 'Global_configure';
  params: {
    configuration: SnapConfig;
  };
}

export interface GetRawPublicKey {
  method: 'Global_getRawPublicKey';
}

export interface GetPrincipal {
  method: 'Global_getPrincipal';
}

export interface SignRequest {
  method: 'Nostr_sign';
  params: {
    message: string;
  };
}
export interface SignRawMessageRequest {
  method: 'Nostr_signRawMessage';
  params: {
    message: string;
  };
}

export interface EncryptMessageRequest {
  method: 'Nostr_encryptMessage';
  params: {
    theirPublicKey: string;
    message: string;
  };
}

export interface DecryptMessageRequest {
  method: 'Nostr_decryptMessage';
  params: {
    theirPublicKey: string;
    cipherText: string;
  };
}

export interface GetNPub {
  method: 'Nostr_getNPub';
}

export interface GetNProfile {
  method: 'Nostr_getNProfile';
}

export interface SignEvent {
  method: 'Nostr_signEvent';
  params: {
    unsignedEvent: UnsignedEvent;
  };
}

export interface AddRelays {
  method: 'Nostr_addRelays';
  params: {
    relays: string[];
  };
}

export interface GetRelays {
  method: 'Nostr_getRelays';
}

export interface Delegate {
  method: 'Nostr_delegate';
  params: {
    other: string;
  };
}

export interface GetSatsDomainInfo {
  method: 'Ord_getSatsDomainInfo';
  params: {
    domain: string;
  };
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
  | GetNPub
  | GetNProfile
  | GetNPub
  | SignEvent
  | AddRelays
  | GetRelays
  | Delegate
  | InitWallet
  | AddNextAccount
  | GetSatsDomainInfo
  | GetAddress
  | GetAddressUtxo
  | GetAddressBalance
  | SendBTC
  | SendInscription;

type Method = MetamaskOrdRpcRequest['method'];
