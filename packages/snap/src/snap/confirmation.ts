import { SnapMethods } from '@astrox/ord-snap-types';
import { SnapsGlobalObject } from '@metamask/snaps-types';

type ConfirmationDialogContent = {
  prompt: string;
  description?: string;
  textAreaContent?: string;
};

export async function showConfirmationDialog(snap: SnapsGlobalObject, message: ConfirmationDialogContent): Promise<boolean> {
  return (await snap.request({
    method: SnapMethods.confirm,
    params: [message],
  })) as boolean;
}
