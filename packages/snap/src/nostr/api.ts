import { SnapsGlobalObject } from '@metamask/snaps-types';
import { UnsignedEvent } from 'nostr-tools';
import { Delegation } from 'nostr-tools/lib/nip26';
import { getNostr } from '../schnorr/getIdentity';

export async function getNPub(wallet: SnapsGlobalObject): Promise<string> {
  const nostr = await getNostr(wallet);
  return nostr.npub;
}

export async function getNProfile(wallet: SnapsGlobalObject): Promise<string> {
  const nostr = await getNostr(wallet);
  return nostr.nprofile;
}

export async function signEvent(wallet: SnapsGlobalObject, event: UnsignedEvent): Promise<string> {
  const nostr = await getNostr(wallet);
  return nostr.signEvent(event);
}

export async function delegate(wallet: SnapsGlobalObject, other: string): Promise<Delegation> {
  const nostr = await getNostr(wallet);
  return await nostr.delegate(other);
}

export async function addRelays(wallet: SnapsGlobalObject, relays: string[]): Promise<void> {
  const nostr = await getNostr(wallet);
  nostr.addRelays(relays);
}
