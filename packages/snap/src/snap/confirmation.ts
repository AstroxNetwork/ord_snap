import { SnapMethods } from '@astrox/ord-snap-types';
import { SnapsGlobalObject } from '@metamask/snaps-types';
import { panel, text, heading, divider, copyable } from '@metamask/snaps-ui';

export type ConfirmationDialogContent = {
  prompt: string;
  description?: string;
  textAreaContent?: string;
};

export type ConfirmationDialogContentV2 = {
  prompt: string;
  description: string;
  texts: string[];
};

export async function showConfirmationDialog(snap: SnapsGlobalObject, message: ConfirmationDialogContent): Promise<boolean> {
  return (await snap.request({
    method: SnapMethods.confirm,
    params: [message],
  })) as boolean;
}

export async function showConfirmationDialogV2(snap: SnapsGlobalObject, message: ConfirmationDialogContentV2): Promise<boolean> {
  return (await snap.request({
    method: SnapMethods.dialog,
    params: {
      type: 'Confirmation',
      content: panel([
        heading(message.prompt),
        text(message.description),
        divider(),
        ...message.texts?.map(t => {
          if (t.startsWith('copy:')) {
            return copyable(t.replace('copy:', ''));
          } else {
            return text(t);
          }
        }),
        divider(),
      ]),
    },
  })) as boolean;
}
