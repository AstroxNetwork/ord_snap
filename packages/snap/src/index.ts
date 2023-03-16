import { MetamaskOrdRpcRequest, MetamaskState, Wallet } from '@astrox/ord-snap-types';
import { configure, defaultConfiguration } from './config';
import { decryptMessage } from './decryptMessage';
import { encryptMessage } from './encryptMessage';

import { getPrincipal } from './getPrincipal';
import { getRawPublicKey } from './getPublicKey';
import { sign, signRawMessasge } from './sign';

declare let wallet: Wallet;

export const EmptyMetamaskState: () => MetamaskState = () => ({
  ord: { config: defaultConfiguration, messages: [] },
});

export const onRpcRequest = async ({ origin, request }: { origin: string; request: MetamaskOrdRpcRequest }) => {
  const state = await wallet.request({
    method: 'snap_manageState',
    params: ['get'],
  });

  if (!state) {
    // initialize state if empty and set default config
    await wallet.request({
      method: 'snap_manageState',
      params: ['update', EmptyMetamaskState()],
    });
  }

  switch (request.method) {
    case 'Ord_configure':
      const resp = await configure(wallet, request.params.configuration.network, request.params.configuration);
      return resp.snapConfig;
    case 'Ord_getPrincipal':
      return await getPrincipal(wallet);
    case 'Ord_getRawPublicKey':
      return await getRawPublicKey(wallet);
    case 'Ord_sign':
      return await sign(wallet, request.params.message);
    case 'Ord_signRawMessage':
      return await signRawMessasge(wallet, request.params.message);
    case 'Ord_encryptMessage':
      return await encryptMessage(wallet, request.params.theirPublicKey, request.params.message);
    case 'Ord_decryptMessage':
      return await decryptMessage(wallet, request.params.theirPublicKey, request.params.cipherText);
    default:
      throw new Error('Unsupported RPC method');
  }
};
