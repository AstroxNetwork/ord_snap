import { getBIP44AddressKeyDeriver, JsonBIP44CoinTypeNode } from '@metamask/key-tree';
import { MetamaskState, Wallet } from '@astrox/ord-snap-types';
import { getMetamaskVersion, isNewerVersion } from './util';

export async function getPrivateKeyFromWallet(wallet: Wallet, index?: number): Promise<Uint8Array> {
  const snapState = (await wallet.request({ method: 'snap_manageState', params: ['get'] })) as MetamaskState;
  const { derivationPath } = snapState.ord.config;
  const [, , coinType, account, change, addressIndex] = derivationPath.split('/');
  const bip44Code = coinType.replace("'", '');
  let bip44Node: JsonBIP44CoinTypeNode;
  const currentVersion = await getMetamaskVersion(wallet);

  if (isNewerVersion('MetaMask/v10.22.0-flask.0', currentVersion))
    bip44Node = (await wallet.request({
      method: 'snap_getBip44Entropy',
      params: {
        coinType: Number(bip44Code as string),
      },
    })) as JsonBIP44CoinTypeNode;
  else
    bip44Node = (await wallet.request({
      method: `snap_getBip44Entropy_${bip44Code}`,
      params: [],
    })) as JsonBIP44CoinTypeNode;

  let privateKey: Uint8Array;

  const addressKeyDeriver = await getBIP44AddressKeyDeriver(bip44Node as JsonBIP44CoinTypeNode, {
    account: parseInt(account),
    change: parseInt(change),
  });
  const extendedPrivateKey = await addressKeyDeriver(Number(index ?? addressIndex));

  privateKey = new Uint8Array(extendedPrivateKey.privateKeyBytes.slice(0, 32));
  return privateKey;
}
