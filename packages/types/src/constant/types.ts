import { CHAINS_ENUM } from './constant';

export enum AddressType {
  P2PKH,
  P2WPKH,
  P2TR,
  P2SH_P2WPKH,
  M44_P2WPKH,
  M44_P2TR,
}

export enum NetworkType {
  MAINNET,
  TESTNET,
}

export enum RestoreWalletType {
  UNISAT,
  SPARROW,
  XVERSE,
  ORDSNAP,
  OTHERS,
}

export interface Chain {
  name: string;
  logo: string;
  enum: CHAINS_ENUM;
  network: string;
}

export interface BitcoinBalance {
  confirm_amount: string;
  pending_amount: string;
  amount: string;
  usd_value: string;
}

export interface TxHistoryItem {
  txid: string;
  time: number;
  date: string;
  amount: string;
  symbol: string;
  address: string;
}

export interface Inscription {
  id: string;
  num: number;
  number?: number;
  detail?: {
    address: string;
    content: string;
    content_length: string;
    content_type: string;
    genesis_fee: string;
    genesis_height: string;
    genesis_transaction: string;
    location: string;
    offset: string;
    output: string;
    output_value: string;
    preview: string;
    sat: string;
    timestamp: string;
  };
}

export interface InscriptionMintedItem {
  title: string;
  desc: string;
  inscriptions: Inscription[];
}

export interface InscriptionSummary {
  mintedList: InscriptionMintedItem[];
}

export interface AppInfo {
  logo: string;
  title: string;
  desc: string;
  url: string;
}

export interface AppSummary {
  apps: {
    tag: string;
    list: AppInfo[];
  }[];
}

export interface FeeSummary {
  list: {
    title: string;
    desc: string;
    feeRate: number;
  }[];
}

export interface UTXO {
  txId: string;
  outputIndex: number;
  satoshis: number;
  scriptPk: string;
  addressType: AddressType;
  inscriptions: {
    id: string;
    num: number;
    offset: number;
  }[];
}

export enum TxType {
  SIGN_TX,
  SEND_BITCOIN,
  SEND_INSCRIPTION,
}

export interface ToSignInput {
  index: number;
  publicKey: string;
  sighashTypes?: number[];
}
export type WalletKeyring = {
  key: string;
  index: number;
  type: string;
  addressType: AddressType;
  accounts: Account[];
  alianName: string;
  hdPath: string;
};

export interface Account {
  type: string;
  pubkey: string;
  address: string;
  brandName?: string;
  alianName?: string;
  displayBrandName?: string;
  index?: number;
  balance?: number;
}

export interface TXSendBTC {
  psbtHex: string;
  rawTx: string;
  txType: TxType;
  txId?: string;
}

export interface ErrorPayload {
  message: string;
  fullMessage: string;
  stack: string;
  code: number;
}

export declare enum Kind {
  Metadata = 0,
  Text = 1,
  RecommendRelay = 2,
  Contacts = 3,
  EncryptedDirectMessage = 4,
  EventDeletion = 5,
  Reaction = 7,
  ChannelCreation = 40,
  ChannelMetadata = 41,
  ChannelMessage = 42,
  ChannelHideMessage = 43,
  ChannelMuteUser = 44,
  Report = 1984,
  ZapRequest = 9734,
  Zap = 9735,
  RelayList = 10002,
  ClientAuth = 22242,
  Article = 30023,
}
export type EventTemplate = {
  kind: Kind;
  tags: string[][];
  content: string;
  created_at: number;
};
export type UnsignedEvent = EventTemplate & {
  pubkey: string;
};

export type Delegation = {
  from: string;
  to: string;
  cond: string;
  sig: string;
};
