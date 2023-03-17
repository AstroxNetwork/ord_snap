import { getBIP44AddressKeyDeriver, JsonBIP44CoinTypeNode } from '@metamask/key-tree';
import { MetamaskState } from '@astrox/ord-snap-types';
import { SnapsGlobalObject } from '@metamask/snaps-types';
import { getMetamaskVersion, isNewerVersion } from './util';

export async function getPrivateKeyFromWallet(snap: SnapsGlobalObject, index?: number): Promise<Uint8Array> {
  const snapState = (await snap.request({ method: 'snap_manageState', params: { operation: 'get' } })) as MetamaskState;
  const { derivationPath } = snapState.ord.config;
  const [, , coinType, account, change, addressIndex] = derivationPath.split('/');
  const bip44Code = coinType.replace("'", '');
  let bip44Node: JsonBIP44CoinTypeNode;

  bip44Node = (await snap.request({
    method: 'snap_getBip44Entropy',
    params: {
      coinType: Number(bip44Code as string),
    },
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
