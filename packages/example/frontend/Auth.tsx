import React, { useCallback, useEffect, useState } from "react"
import dfinityLogo from "./assets/dfinity.svg"
import { initiateOrdSnap } from "./services/metamask"
import { OrdSnapApi } from "@astrox/ord-snap-types"

// Note: This is just a basic example to get you started
function Auth() {
  const [signedIn, setSignedIn] = useState<boolean>(false)
  const [principal, setPrincipal] = useState<string>("")
  const [client, setClient] = useState<any>()
  const [api, setApi] = useState<OrdSnapApi | undefined>(undefined)

  // const initAuth = async () => {
  //   const client = await AuthClient.create()
  //   const isAuthenticated = await client.isAuthenticated()

  //   setClient(client)

  //   if (isAuthenticated) {
  //     const identity = client.getIdentity()
  //     const principal = identity.getPrincipal().toString()
  //     setSignedIn(true)
  //     setPrincipal(principal)
  //   }
  // }

  // const signIn = async () => {
  //   const { identity, principal } = await new Promise((resolve, reject) => {
  //     client.login({
  //       identityProvider: "https://identity.ic0.app",
  //       onSuccess: () => {
  //         const identity = client.getIdentity()
  //         const principal = identity.getPrincipal().toString()
  //         resolve({ identity, principal })
  //       },
  //       onError: reject,
  //     })
  //   })
  //   setSignedIn(true)
  //   setPrincipal(principal)
  // }

  const signOut = async () => {
    await client.logout()
    setSignedIn(false)
    setPrincipal("")
  }

  const installSnap = useCallback(async () => {
    const installResult = await initiateOrdSnap()
    if (!installResult.isSnapInstalled) {
      console.log("no install aa")
    } else {
      console.log("installed")

      // const principal = await (
      //   await installResult.snap?.getSchnorrSnapApi()
      // )?.getPrincipal()
      // console.log({ principal })
    }
  }, [])

  useEffect(() => {
    // initAuth()
    installSnap()
  }, [])

  return (
    <div className="auth-section">
      {!signedIn && client ? (
        <button onClick={installSnap} className="auth-button">
          Sign in
          <img
            style={{ width: "33px", marginRight: "-1em", marginLeft: "0.7em" }}
            src={dfinityLogo}
          />
        </button>
      ) : null}

      {signedIn ? (
        <>
          <p>Signed in as: {principal}</p>
          <button onClick={signOut} className="auth-button">
            Sign out
          </button>
        </>
      ) : null}
    </div>
  )
}

export { Auth }
