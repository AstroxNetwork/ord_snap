import { OrdSnapApi, SnapConfig } from '@astrox/ord-snap-types';
import { hasMetaMask, isMetamaskSnapsSupported, isSnapInstalled } from './util';
import {
  configure,
  decryptMessage,
  encryptMessage,
  getAddress,
  getPrincipal,
  getRawPublicKey,
  sign,
  signRawMessage,
  addNextAccount,
  initWallet,
  getAddressUtxo,
  getAddressBalance,
} from './methods';

export interface SnapIdentity {
  api: OrdSnapApi;
  publicKey: string;
  principal: string;
}

export class MetamaskOrdSnap {
  // snap parameters
  protected readonly snapOrigin: string;
  protected readonly snapId: string;

  public async createSnapIdentity(): Promise<SnapIdentity> {
    const api = await this.getOrdSnapApi();
    const publicKey = await api.getRawPublicKey();
    const principal = await api.getPrincipal();
    return { api, publicKey, principal };
  }

  public constructor(snapOrigin: string) {
    this.snapOrigin = snapOrigin;
    this.snapId = snapOrigin;
  }

  public getOrdSnapApi = async (): Promise<OrdSnapApi> => {
    return {
      configure: configure.bind(this),
      sign: sign.bind(this),
      signRawMessage: signRawMessage.bind(this),
      encryptMessage: encryptMessage.bind(this),
      decryptMessage: decryptMessage.bind(this),
      getPrincipal: getPrincipal.bind(this),
      getRawPublicKey: getRawPublicKey.bind(this),
      getAddress: getAddress.bind(this),
      addNextAccount: addNextAccount.bind(this),
      initWallet: initWallet.bind(this),
      getAddressUtxo: getAddressUtxo.bind(this),
      getAddressBalance: getAddressBalance.bind(this),
    };
  };
}

export type SnapInstallationParamNames = 'version' | string;

const defaultSnapOrigin = 'https://bafybeigzphbumdkucnj2c6nr5xb3kwsq5gs2gp7w3qldgbvfeycfsbjylu.ipfs.infura-ipfs.io';
/**
 * Install and enable Schnorr snap
 *
 * Checks for existence of Metamask and version compatibility with snaps before installation.
 *
 * Provided snap configuration must define at least network property so predefined configuration can be selected.
 * All other properties are optional, and if present will overwrite predefined property.
 *
 * @param config - SnapConfig
 * @param snapOrigin
 *
 * @return MetamaskSchnorrSnap - adapter object that exposes snap API
 */
export async function enableOrdSnap(
  config: Partial<SnapConfig>,
  snapOrigin?: string,
  snapInstallationParams: Record<SnapInstallationParamNames, unknown> = {},
): Promise<MetamaskOrdSnap> {
  const snapId = snapOrigin ?? defaultSnapOrigin;

  // check all conditions
  if (!hasMetaMask()) {
    throw new Error('Metamask is not installed');
  }
  if (!(await isMetamaskSnapsSupported())) {
    throw new Error("Current Metamask version doesn't support snaps");
  }
  if (!config.network) {
    throw new Error('Configuration must at least define network type');
  }

  const isInstalled = await isSnapInstalled(snapId);

  if (!isInstalled) {
    // // enable snap
    await window.ethereum.request({
      method: 'wallet_requestSnaps',
      params: {
        [snapId]: { ...snapInstallationParams },
      },
    });
  }

  //await unlockMetamask();

  // create snap describer
  const snap = new MetamaskOrdSnap(snapOrigin || defaultSnapOrigin);
  const api = await snap.getOrdSnapApi();
  // set initial configuration
  await api.configure(config);
  // return snap object
  return snap;
}
