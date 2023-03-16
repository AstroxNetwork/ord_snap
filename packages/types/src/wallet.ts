import { MetamaskOrdRpcRequest } from './methods';

export type FMethodCallback = ({ origin, request }: { origin: string; request: MetamaskOrdRpcRequest }) => Promise<unknown>;

export interface Wallet {
  registerRpcMessageHandler: (fn: FMethodCallback) => unknown;
  request(options: { method: string; params?: any }): unknown;
}

export interface SignRawMessageResponse {
  signature: string;
  confirmed: boolean;
  error: Error;
}

export interface SignMessageResponse {
  signature: string;
  // confirmed: boolean;
  error: Error;
}

export interface EncryptMessageResponse {
  pubkey: string;
  created_at: number;
  kind: number;
  tags: any[];
  content: string;
}

export interface WalletEnableParam {
  wallet_snap: {
    [snapId: string]: {
      version?: string;
    };
  };
  [permissionName: string]: {};
}

export interface BIP44CoinTypeNode {
  /**
   * The BIP-44 `coin_type` value of this node.
   */
  readonly coin_type: number;

  /**
   * The 0-indexed BIP-44 path depth of this node.
   *
   * Since this is a `coin_type` node, it will be the number `2`.
   */
  readonly depth: 2;

  /**
   * The Base64-encoded string representation of the key material for this node.
   */
  readonly key: string;

  /**
   * A human-readable representation of the BIP-44 HD tree path of this node.
   *
   * Since this is a `coin_type` node, it will be of the form:
   *
   * `m / 44' / coin_type'`
   *
   * Recall that a complete BIP-44 HD tree path consists of the following nodes:
   *
   * `m / 44' / coin_type' / account' / change / address_index`
   *
   * With the following depths:
   *
   * `0 / 1 / 2 / 3 / 4 / 5`
   */
  readonly path: string;
}
