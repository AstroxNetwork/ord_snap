import './types';
export function hasMetaMask(): boolean {
  if (!(window as any).ethereum) {
    return false;
  }
  return (window as any).ethereum.isMetaMask;
}

export type GetSnapsResponse = {
  [k: string]: {
    permissionName?: string;
    id?: string;
    version?: string;
    initialPermissions?: { [k: string]: unknown };
  };
};
export async function getWalletSnaps(): Promise<GetSnapsResponse> {
  return (await window.ethereum.request({
    method: 'wallet_getSnaps',
  })) as GetSnapsResponse;
}

export async function isMetamaskSnapsSupported(): Promise<boolean> {
  try {
    await getWalletSnaps();
    return true;
  } catch (e) {
    return false;
  }
}

/**
 *
 * @returns
 */
export async function isSnapInstalled(snapOrigin: string, version?: string): Promise<boolean> {
  console.log(await getWalletSnaps());
  try {
    return !!Object.values(await getWalletSnaps()).find(permission => permission.id === snapOrigin && (!version || permission.version === version));
  } catch (e) {
    console.log('Failed to obtain installed snaps', e);
    return false;
  }
}

/**
 * Return an array buffer from its hexadecimal representation.
 * @param hexString The hexadecimal string.
 */
export function fromHexString(hexString: string): ArrayBuffer {
  return new Uint8Array((hexString.match(/.{1,2}/g) ?? []).map(byte => parseInt(byte, 16))).buffer;
}

/**
 * Returns an hexadecimal representation of an array buffer.
 * @param bytes The array buffer.
 */
export function toHexString(bytes: ArrayBuffer): string {
  return new Uint8Array(bytes).reduce((str, byte) => str + byte.toString(16).padStart(2, '0'), '');
}
