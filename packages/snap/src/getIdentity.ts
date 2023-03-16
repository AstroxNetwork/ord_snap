import { getBIP44AddressKeyDeriver, JsonBIP44CoinTypeNode } from '@metamask/key-tree';
import { MetamaskState, Wallet } from '@astrox/ord-snap-types';
import { getMetamaskVersion, isNewerVersion, SchorrIdentity } from './util';

export async function getIdentity(wallet: Wallet): Promise<string> {
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

  // Next, we'll create an address key deriver function for the Dogecoin coin_type node.
  // In this case, its path will be: m / 44' / coincode' / 0' / 0 / address_index
  // const extendedPrivateKey = deriveBIP44AddressKey(bip44Node, {
  //   account: parseInt(account),
  //   address_index: parseInt(addressIndex),
  //   change: parseInt(change),
  // });
  // const privateKey = new Uint8Array(extendedPrivateKey.slice(0, 32));
  // const publicKey = Secp256k1.publicKeyCreate(privateKey, false);

  let privateKey: Uint8Array;

  const addressKeyDeriver = await getBIP44AddressKeyDeriver(bip44Node as JsonBIP44CoinTypeNode, {
    account: parseInt(account),
    change: parseInt(change),
  });
  const extendedPrivateKey = await addressKeyDeriver(Number(addressIndex));

  privateKey = new Uint8Array(extendedPrivateKey.privateKeyBytes.slice(0, 32));

  const sk = SchorrIdentity.fromSecretKey(privateKey.buffer);

  return JSON.stringify(sk.toJSON());
  // Now, you can ask the user to e.g. sign transactions!
}
