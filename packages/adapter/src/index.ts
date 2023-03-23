export {
  configure,
  sign,
  signRawMessage,
  getPrincipal,
  encryptMessage,
  decryptMessage,
  initWallet,
  getAddress,
  addNextAccount,
  sendBTC,
  sendInscription,
  getNProfile,
  getNPub,
  addRelays,
  signEvent,
  delegate,
} from './methods';
export { MetamaskOrdSnap, enableOrdSnap, SnapIdentity } from './snap';
// import './types';
export * from './types';
export { hasMetaMask, getWalletSnaps, isMetamaskSnapsSupported, isSnapInstalled } from './util';
