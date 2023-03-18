import {
  ConfigureRequest,
  DecryptMessageRequest,
  EncryptMessageRequest,
  MetamaskOrdRpcRequest,
  MetamaskState,
  SignRawMessageRequest,
  SignRequest,
} from '@astrox/ord-snap-types';
import { SnapsGlobalObject } from '@metamask/snaps-types';
import { OnRpcRequestHandler } from '@metamask/snaps-types';
import { configure, defaultConfiguration } from './config';
import { decryptMessage } from './decryptMessage';
import { encryptMessage } from './encryptMessage';

import { getPrincipal } from './getPrincipal';
import { getRawPublicKey } from './getPublicKey';
import { OrdKeyring } from './keyring';
// import { OrdKeyring } from './keyring';
import { sign, signRawMessasge } from './sign';

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
    case 'Ord_initKeyRing': {
      const kr = await OrdKeyring.fromStorage(snap);
      // await kr.addAccounts(1);
      return JSON.stringify(await kr.getAccounts());
    }
    case 'Ord_getAddress': {
      const kr = await OrdKeyring.fromStorage(snap);
      return await kr
        .getAddress
        // (request as unknown as GetAddress).params.index,
        // (request as unknown as GetAddress).params.addressType,
        // (request as unknown as GetAddress).params.networkType,
        ();
    }
    case 'Ord_addNextAccount': {
      const kr = await OrdKeyring.fromStorage(snap);
      await kr.addNextAccount();
      return JSON.stringify(await kr.getAccounts());
    }
    default:
      throw new Error('Unsupported RPC method');
  }
};
