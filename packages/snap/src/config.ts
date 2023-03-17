import { MetamaskState, SnapConfig } from '@astrox/ord-snap-types';
import { SnapsGlobalObject } from '@metamask/snaps-types';
import deepmerge from 'deepmerge';

export const btcMainnetConfiguration: SnapConfig = {
  derivationPath: "m/44'/0'/0'/0/0",
  coinType: 0,
  network: 'mainnet',
  rpc: {
    token: '',
    url: 'https://ic0.app',
  },
  unit: {
    decimals: 8,
    image: `https://cryptologos.cc/logos/bitcoin-btc-logo.svg?v=023`,
    symbol: 'BTC',
  },
};

export const btcLocalConfiguration: SnapConfig = {
  derivationPath: "m/44'/0'/0'/0/0",
  coinType: 0,
  network: 'local',
  rpc: {
    token: '',
    url: 'https://localhost:8000',
  },
  unit: {
    decimals: 8,
    image: `https://cryptologos.cc/logos/bitcoin-btc-logo.svg?v=023`,
    symbol: 'BTC',
  },
};
export const noStrLocalConfiguration: SnapConfig = {
  derivationPath: "m/44'/1237'/0'/0/0",
  coinType: 1237,
  network: 'nostr',
  rpc: {
    token: '',
    url: 'https://localhost:8000',
  },
  unit: {
    decimals: 8,
    image: `https://cryptologos.cc/logos/bitcoin-btc-logo.svg?v=023`,
    symbol: 'Nostr',
  },
};

export const defaultConfiguration = btcMainnetConfiguration;

export function getDefaultConfiguration(networkName?: string): SnapConfig {
  switch (networkName) {
    case 'mainnet':
      console.log('BTC mainnet network selected');
      return btcMainnetConfiguration;
    case 'nostr':
      console.log('NoStr network selected');
      return noStrLocalConfiguration;
    case 'local':
      console.log('BTC local network selected');
      return btcLocalConfiguration;
    default:
      return defaultConfiguration;
  }
}

export async function getConfiguration(snap: SnapsGlobalObject): Promise<SnapConfig> {
  const state = (await snap.request({
    method: 'snap_manageState',
    params: { operation: 'get' },
  })) as MetamaskState;
  if (!state || !state.ord.config) {
    return defaultConfiguration;
  }
  return state.ord.config;
}

export interface ConfigureResponse {
  snapConfig: SnapConfig;
}

export async function configure(snap: SnapsGlobalObject, networkName: string, overrides?: unknown): Promise<ConfigureResponse> {
  const defaultConfig = getDefaultConfiguration(networkName);
  const configuration = overrides ? deepmerge(defaultConfig, overrides) : defaultConfig;
  const [, , coinType, , ,] = configuration.derivationPath.split('/');
  const bip44Code = coinType.replace("'", '');
  //   // instatiate new api
  //   const api = await getApiFromConfig(configuration);
  //   const apiNetworkName = await api.stateNetworkName();
  // check if derivation path is valid
  if (bip44Code !== String(configuration.coinType)) {
    throw new Error('Wrong CoinType in derivation path');
  }
  const state = (await snap.request({
    method: 'snap_manageState',
    params: { operation: 'get' },
  })) as MetamaskState;
  state.ord.config = configuration;
  await snap.request({
    method: 'snap_manageState',
    params: { newState: state, operation: 'update' },
  });
  return { snapConfig: configuration };
}
