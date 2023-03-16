import { MetamaskOrdSnap, enableOrdSnap } from "@astrox/ord-snap-adapter"
import { OrdNetwork } from "@astrox/ord-snap-types"

export const defaultSnapId = "local:http://localhost:8081"

let isInstalled: boolean = false

export interface SnapInitializationResponse {
  isSnapInstalled: boolean
  snap?: MetamaskOrdSnap
}

export async function initiateOrdSnap(
  network: OrdNetwork = "local",
): Promise<SnapInitializationResponse> {
  const snapId = process.env.SNAP_ID

  // const snapId = defaultSnapId
  try {
    console.log("Attempting to connect to snap...")

    const metamaskOrdSnap = await enableOrdSnap(
      { network }, // 'mainnet', 'nostr'
      snapId,
      {
        version: "latest",
      },
    )
    isInstalled = true
    console.log("Snap installed!")
    return { isSnapInstalled: true, snap: metamaskOrdSnap }
  } catch (e) {
    console.error(e)
    isInstalled = false
    return { isSnapInstalled: false }
  }
}

export async function isOrdSnapInstalled(): Promise<boolean> {
  return isInstalled
}
