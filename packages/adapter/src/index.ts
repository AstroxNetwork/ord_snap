export {
  configure,
  sign,
  signRawMessage,
  getPrincipal,
  encryptMessage,
  decryptMessage,
  initKeyRing,
  getAddress,
  addNextAccount,
  initHttpService,
} from './methods';
export { MetamaskOrdSnap, enableOrdSnap } from './snap';
import './types';
export { hasMetaMask, GetSnapsResponse, getWalletSnaps, isMetamaskSnapsSupported, isSnapInstalled } from './util';
