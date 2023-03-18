import { getBIP44AddressKeyDeriver, JsonBIP44CoinTypeNode, SLIP10Node } from '@metamask/key-tree';
import { MetamaskState } from '@astrox/ord-snap-types';
import { SnapsGlobalObject } from '@metamask/snaps-types';

export async function getPrivateKeyFromWallet(snap: SnapsGlobalObject, path?: string, index?: number): Promise<Uint8Array> {
  const snapState = (await snap.request({ method: 'snap_manageState', params: { operation: 'get' } })) as MetamaskState;
  const { derivationPath } = snapState.ord.config;
  const [, , coinType, account, change, addressIndex] = path !== undefined ? path.split('/') : derivationPath.split('/');
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

export async function getPrivateKeyFromSLIP10(snap: SnapsGlobalObject, path?: string, index?: number): Promise<Uint8Array> {
  const snapState = (await snap.request({ method: 'snap_manageState', params: { operation: 'get' } })) as MetamaskState;
  const { derivationPath } = snapState.ord.config;
  const [, purpose, coinType, account, change, addressIndex] = path !== undefined ? path.split('/') : derivationPath.split('/');

  let slip10Node: SLIP10Node = (await snap.request({
    method: 'snap_getBip32Entropy',
    params: {
      path: ['m', purpose, coinType, account, change],
      curve: 'secp256k1',
    },
  })) as SLIP10Node;
  const aIndex = `${addressIndex ?? index ?? 0}`;
  const node = await SLIP10Node.fromJSON(slip10Node);
  const child = await node.derive([`slip10:${Number.parseInt(aIndex.replace("'", ''), 10)}`]);
  return child.privateKeyBytes;
}

export const trimHexPrefix = (key: string) => (key.startsWith('0x') ? key.substring(2) : key);
