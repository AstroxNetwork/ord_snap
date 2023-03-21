import {
  ConfigureRequest,
  DecryptMessageRequest,
  EncryptMessageRequest,
  MetamaskOrdRpcRequest,
  MetamaskState,
  SignRawMessageRequest,
  SignRequest,
  InitWallet,
  GetAddressUtxo,
  SendBTC,
} from '@astrox/ord-snap-types';
import { SnapsGlobalObject } from '@metamask/snaps-types';
import { OnRpcRequestHandler } from '@metamask/snaps-types';
import { configure, defaultConfiguration } from './snap/config';
import { decryptMessage } from './nostr/decryptMessage';
import { encryptMessage } from './nostr/encryptMessage';

import { getPrincipal } from './schnorr/getPrincipal';
import { getRawPublicKey } from './schnorr/getPublicKey';
import { OrdKeyring } from './keyRing/keyring';
// import { OrdKeyring } from './keyring';
import { sign, signRawMessasge } from './schnorr/sign';
import { HttpService } from './api/service';
import { OrdWallet } from './wallet';

declare let snap: SnapsGlobalObject;

export const EmptyMetamaskState: () => MetamaskState = () => ({
  ord: { config: defaultConfiguration, messages: [] },
  storage: {},
});

export const onRpcRequest: OnRpcRequestHandler = async ({ request }) => {
  // console.log({ request });
  // console.log('asdfasdfasd');
  // let snap: SnapsGlobalObject;
  // console.log(snap);
  const state = await snap.request({
    method: 'snap_manageState',
    params: { operation: 'get' },
  });
  if (!state) {
    // initialize state if empty and set default config
    await snap.request({
      method: 'snap_manageState',
      params: { newState: EmptyMetamaskState(), operation: 'update' },
    });
  }
  switch (request.method) {
    case 'Schnorr_configure': {
      const resp = await configure(
        snap,
        (request as unknown as ConfigureRequest).params.configuration.network,
        (request as unknown as ConfigureRequest).params.configuration,
      );
      return resp.snapConfig;
    }
    case 'Schnorr_getPrincipal':
      return await getPrincipal(snap);
    case 'Schnorr_getRawPublicKey':
      return await getRawPublicKey(snap);
    case 'Schnorr_sign':
      return await sign(snap, (request as unknown as SignRequest).params.message);
    case 'Schnorr_signRawMessage':
      return await signRawMessasge(snap, (request as unknown as SignRawMessageRequest).params.message);
    case 'Schnorr_encryptMessage':
      return await encryptMessage(
        snap,
        (request as unknown as EncryptMessageRequest).params.theirPublicKey,
        (request as unknown as EncryptMessageRequest).params.message,
      );
    case 'Schnorr_decryptMessage':
      return await decryptMessage(
        snap,
        (request as unknown as DecryptMessageRequest).params.theirPublicKey,
        (request as unknown as DecryptMessageRequest).params.cipherText,
      );
    case 'Ord_initWallet': {
      const http = new HttpService(snap, {
        host: (request as unknown as InitWallet).params.host,
        fetchOptions: { headers: (request as unknown as InitWallet).params.headers },
      });

      const kr = await OrdKeyring.fromStorage(snap);
      await kr.saveWallets();
      await http.saveHttpService();
      const wallet = new OrdWallet(kr, http);
      return JSON.stringify(wallet.getAccounts());
    }
    case 'Ord_getAddress': {
      const wallet = await OrdWallet.fromStorage(snap);
      return await wallet.keyRing.getAddress();
    }
    case 'Ord_addNextAccount': {
      const wallet = await OrdWallet.fromStorage(snap);
      await wallet.keyRing.addNextAccount();
      return JSON.stringify(wallet.getAccounts());
    }
    case 'Ord_getAddressUtxo': {
      const wallet = await OrdWallet.fromStorage(snap);
      const utxos = await wallet.getAddressUtxo((request as unknown as GetAddressUtxo).params.address);
      return JSON.stringify(utxos);
    }
    case 'Ord_getAddressBalance': {
      const wallet = await OrdWallet.fromStorage(snap);
      const balance = await wallet.getAddressBalance((request as unknown as GetAddressUtxo).params.address);
      return JSON.stringify(balance);
    }
    case 'Ord_sendBTC': {
      const wallet = await OrdWallet.fromStorage(snap);

      const tx = await wallet.sendBTC({
        ...(request as unknown as SendBTC).params,
      });
      return tx;
    }
    default:
      throw new Error('Unsupported RPC method');
  }
};
