# SchnorrSnap

## Quick Start

```bash
yarn install && yarn build:all && yarn demo:local
```

## Example code,

In [packages/example/frontend/Intro.tsx](./packages/example/frontend/Intro.tsx)

```typescript
import { initiateSchnorrSnap } from "./services/metamask"
import { SnapIdentity } from "@astrox/schnorr-adapter"
import { SignRawMessageResponse } from "@astrox/schnorr-types"

...
  const [snapIdentity, setSnapIdentity] = useState<SnapIdentity | undefined>(
    undefined,
  )

  const installSnap = useCallback(async () => {
    // you can customize initiateSchnorrSnap with your function, hooks, or service what ever
    // pass network type `mainnet`, `local`, or `nostr`
    // coinType in derived path will be different, mainnet and local will be 0, nostr will be 1237 (NIP-06)
    const installResult = await initiateSchnorrSnap("nostr")
    if (!installResult.isSnapInstalled) {
      setInstalled(false)
    } else {
      setInstalled(true)
      setSnapIdentity(await installResult.snap?.createSnapIdentity())
    }
  }, [])

  const getPublicKey = async () => {
    setPublicKey(snapIdentity?.publicKey)
  }

  const signMessage = async () => {
    const signed = await snapIdentity?.api.sign(message!)
    setSignedMessage(signed!)
  }
...


```

## Components and install instructions

1. [Download Metamask Flask](https://metamask.io/flask/)
   and uninstall/disable old metamask

2. Go to example page or any supported page, install SchnorrSnap before run

3. Can sign message afterwards

## How it works

1. Develope Metamask Flask Snap project
2. Use Secp256k1Key(Schnorr) identity inside snap
3. Get identity and signing method for web app

## Use cases

1. Use Metamask as your schnorr wallet
2. Access NoStr
