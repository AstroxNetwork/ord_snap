import { Delegation, GetSnapsResponse, RequestSnapsResult, SatsDomainResponse, TXSendBTC, UnsignedEvent, UTXO } from './constant/types';
import { MetamaskOrdRpcRequest } from './methods';
import { EncryptMessageResponse, SignMessageResponse, SignRawMessageResponse } from './wallet';

export type OrdNetwork = 'mainnet' | 'local' | 'nostr';
export interface UnitConfiguration {
  symbol: string;
  decimals: number;
  image?: string;
  customViewUrl?: string;
}
export interface SnapConfig {
  derivationPath: string;
  coinType: number;
  network: OrdNetwork;
  rpc: {
    token: string;
    url: string;
  };
  unit?: UnitConfiguration;
}

export interface WalletEnableRequest {
  method: 'wallet_enable';
  params: object[];
}

export interface GetSnapsRequest {
  method: 'wallet_getSnaps';
}

export interface SnapRpcMethodRequest {
  method: string;
  params: [MetamaskOrdRpcRequest];
}

export type MetamaskRpcRequest = WalletEnableRequest | GetSnapsRequest | SnapRpcMethodRequest;

export interface OrdSnapApi {
  getRawPublicKey(): Promise<string>;
  getPrincipal(): Promise<string>;
  configure(configuration: Partial<SnapConfig>): Promise<RequestSnapsResult>;
  getAppInfo(): Promise<GetSnapsResponse[string]>;
  nostr: {
    sign(message: string): Promise<SignMessageResponse>;
    signRawMessage(message: string): Promise<SignRawMessageResponse>;
    encryptMessage(theirPublicKey: string, message: string): Promise<EncryptMessageResponse>;
    decryptMessage(theirPublicKey: string, cipherText: string): Promise<string>;
    getPublicKey(): Promise<string>;
    getNPub(): Promise<string>;
    getNProfile(): Promise<string>;
    getRelays(): Promise<string[]>;
    signEvent(unsignedEvent: UnsignedEvent): Promise<string>;
    delegate(other: string): Promise<Delegation>;
    addRelays(relays: string[]): Promise<void>;
  };
  ord: {
    initWallet(host?: string, headers?: Record<string, unknown>): Promise<string>;
    getAddress(): Promise<string>;
    addNextAccount(): Promise<string>;
    getSatsDomainInfo(domain: string): Promise<SatsDomainResponse>;
    getAddressUtxo(address: string): Promise<string>;
    getAddressBalance(address: string): Promise<string>;
    sendBTC(to: string, amount: number, utxos: UTXO[], autoAdjust: boolean, feeRate: number): Promise<TXSendBTC>;
    sendInscription(to: string, inscriptionId: string, utxos: UTXO[], feeRate: number, outputValue: number): Promise<TXSendBTC>;
  };
}
