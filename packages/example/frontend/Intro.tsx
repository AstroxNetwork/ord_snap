import React, { createFactory, useCallback, useEffect, useState } from "react"
import logo from "./assets/logo-dark.svg"
import { initiateOrdSnap } from "./services/metamask"
import { SnapIdentity } from "@astrox/ord-snap-adapter"
import { SignMessageResponse, UTXO, TXSendBTC } from "@astrox/ord-snap-types"
// import { canisterId, createActor } from "./services"

export function Intro() {
  const [publicKey, setPublicKey] = useState<string | undefined>(undefined)

  const [installed, setInstalled] = useState<boolean>(false)
  const [message, setMessage] = useState<string | undefined>(undefined)
  const [toEncryptMessage, setToEncryptMessage] = useState<string | undefined>(
    undefined,
  )

  const [toDecryptMessage, setToDecryptMessage] = useState<string | undefined>(
    undefined,
  )
  const [theirPublicKey, setTheirPublicKey] = useState<string | undefined>(
    undefined,
  )
  const [theirDecryptPublicKey, setTheirDecryptPublicKey] = useState<
    string | undefined
  >(undefined)

  const [messageEncrypted, setMessageEncrypted] = useState<string | undefined>(
    undefined,
  )
  const [messageDecrypted, setMessageDecrypted] = useState<string | undefined>(
    undefined,
  )

  const [signedMessage, setSignedMessage] = useState<
    SignMessageResponse | undefined
  >(undefined)

  const [snapIdentity, setSnapIdentity] = useState<SnapIdentity | undefined>(
    undefined,
  )

  const [accs, setAccs] = useState<string | undefined>(undefined)

  const [host, setHost] = useState<string | undefined>("https://unisat.io/api")

  const [utxoAddress, setUtxoAddress] = useState<string | undefined>(undefined)
  // to: string, amount: number, utxos: UTXO[], autoAdjust: boolean, feeRate: number
  const [sendTo, setSendTo] = useState<string | undefined>(undefined)
  const [sendAmount, setSendAmount] = useState<number | undefined>(undefined)
  const [sendAutoAdjust, setAutoAdjust] = useState<boolean>(true)
  const [sendFeeRate, setSendFeeRate] = useState<number | undefined>(undefined)

  const installSnap = useCallback(async () => {
    const installResult = await initiateOrdSnap("nostr") //mainnet, local, nostr
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

  const encryptMessage = async () => {
    const encrypted = await snapIdentity?.api.encryptMessage(
      theirPublicKey!,
      toEncryptMessage!,
    )
    setMessageEncrypted(JSON.stringify(encrypted))
  }

  const decryptMessage = async () => {
    const encrypted = await snapIdentity?.api.decryptMessage(
      theirDecryptPublicKey!,
      toDecryptMessage!,
    )
    setMessageDecrypted(JSON.stringify(encrypted))
  }

  const getAddress = async () => {
    console.log(snapIdentity?.api)
    const ad = await snapIdentity?.api.getAddress()
    setAccs(ad)
  }
  const addNextAccount = async () => {
    console.log(snapIdentity?.api)
    const ad = await snapIdentity?.api.addNextAccount()
    console.log(ad)
  }

  const sendBTC = async () => {
    const account = await snapIdentity?.api.getAddress()

    const sendUtxos = await snapIdentity?.api.getAddressUtxo(account!)
    console.log({
      sendTo,
      sendAmount,
      sendUtxos: JSON.parse(sendUtxos!).result as UTXO[],
      sendAutoAdjust,
      sendFeeRate,
    })

    const tx = await snapIdentity?.api.sendBTC(
      sendTo!,
      sendAmount!,
      JSON.parse(sendUtxos!).result as UTXO[],
      sendAutoAdjust!,
      sendFeeRate!,
    )
    console.log(tx)
  }

  const initWallet = async () => {
    console.log(snapIdentity?.api)
    await snapIdentity?.api.initWallet(host, {
      "X-Client": "UniSat Wallet",
      "X-Version": "1.1.10",
      "Content-Type": "application/json;charset=utf-8",
    })
  }

  const getAddressUtxos = async () => {
    console.log(snapIdentity?.api)
    const utxos = await snapIdentity?.api.getAddressUtxo(utxoAddress ?? accs!)
    console.log(utxos)
  }

  const getAddressBalance = async () => {
    console.log(snapIdentity?.api)
    const balance = await snapIdentity?.api.getAddressBalance(
      utxoAddress ?? accs!,
    )
    console.log(balance)
  }

  useEffect(() => {
    ;(async () => {
      if (!snapIdentity) {
        await installSnap()
      } else {
        await getPublicKey()
        await initWallet()
        await getAddress()
      }
    })()
  }, [snapIdentity])
  return (
    <>
      <header className="App-header">
        <img src={logo} className="App-logo" alt="logo" />
        <p style={{ fontSize: "2em", marginBottom: "0.5em" }}>
          Bitcoin Ecosystem in MetaMask
        </p>
        <h1>Wallet</h1>
        <div
          style={{
            display: "flex",
            fontSize: "0.7em",
            textAlign: "left",
            padding: "2em",
            borderRadius: "30px",
            flexDirection: "column",
            background: "rgb(220 218 224 / 25%)",
            flex: 1,
            width: "32em",
          }}
        >
          {installed ? (
            <>
              <div
                style={{
                  wordBreak: "break-all",
                  maxWidth: "100%",
                  margin: "1em 0",
                }}
              >
                <code>Current Accounts: </code>
                <p>{accs}</p>
              </div>
              <button className="demo-button" onClick={addNextAccount}>
                Add Account
              </button>

              <label style={{ marginBottom: 16, marginTop: 16 }}>
                Input Http Host
              </label>
              <input
                aria-label="Initialized http service"
                style={{ padding: "1em" }}
                onChange={async (e) => {
                  setHost(e.target.value)
                }}
                defaultValue={"https://unisat.io/api"}
              />
              <button className="demo-button" onClick={initWallet}>
                Init Wallet
              </button>

              <label style={{ marginBottom: 16, marginTop: 16 }}>
                Get UTXO
              </label>
              <input
                aria-label="Get UTXO"
                style={{ padding: "1em" }}
                onChange={async (e) => {
                  setUtxoAddress(e.target.value)
                }}
                defaultValue={utxoAddress ?? accs}
              />
              <button className="demo-button" onClick={getAddressUtxos}>
                Get UTXOS
              </button>
              <button className="demo-button" onClick={getAddressBalance}>
                Get Balance
              </button>
              <label style={{ marginBottom: 16, marginTop: 16 }}>
                Send BTC To
              </label>
              <input
                aria-label="to"
                style={{ padding: "1em" }}
                onChange={async (e) => {
                  setSendTo(e.target.value)
                }}
              />
              <label style={{ marginBottom: 16, marginTop: 16 }}>
                Send BTC Amount
              </label>
              <input
                aria-label="amount"
                style={{ padding: "1em" }}
                type="number"
                onChange={async (e) => {
                  setSendAmount(Number.parseInt(e.target.value, 10))
                }}
              />
              <label style={{ marginBottom: 16, marginTop: 16 }}>
                Send BTC Fee Rate
              </label>
              <input
                aria-label="feeRate"
                style={{ padding: "1em" }}
                type="number"
                onChange={async (e) => {
                  setSendFeeRate(Number.parseInt(e.target.value, 10))
                }}
              />
              <label style={{ marginBottom: 16, marginTop: 16 }}>
                Send BTC AutoAdjust?
              </label>
              <select
                aria-label="autoAdust"
                name="autoAdust"
                id="autoAdust"
                style={{ marginBottom: 16, marginTop: 16, fontSize: 16 }}
                onChange={(e) => {
                  const sel = e.target.value === "true" ? true : false
                  setAutoAdjust(sel)
                }}
                defaultValue={"true"}
              >
                <option value="true" style={{ padding: 8 }}>
                  true
                </option>
                <option value="false" style={{ padding: 8 }}>
                  false
                </option>
              </select>
              <button className="demo-button" onClick={sendBTC}>
                Send BTC
              </button>
            </>
          ) : null}
        </div>
        <h1>Nostr</h1>
        <div
          style={{
            display: "flex",
            fontSize: "0.7em",
            textAlign: "left",
            padding: "2em",
            borderRadius: "30px",
            flexDirection: "column",
            background: "rgb(220 218 224 / 25%)",
            flex: 1,
            width: "32em",
          }}
        >
          {installed ? (
            <div style={{ width: "100%", minWidth: "100%" }}>
              <code>PublicKey is:</code>
              <p style={{ fontSize: 16 }}>{publicKey ?? "...loading"}</p>
            </div>
          ) : (
            <button className="demo-button" onClick={installSnap}>
              Install Snap
            </button>
          )}

          {installed ? (
            <>
              <h2>Encrypt Message</h2>
              <label style={{ marginBottom: 16 }}>Input Messsage To Sign</label>
              <input
                aria-label="To Sign a message"
                style={{ padding: "1em" }}
                onChange={(e) => {
                  setMessage(e.target.value)
                }}
              />
              <button className="demo-button" onClick={signMessage}>
                Sign Message
              </button>
            </>
          ) : null}
          {signedMessage?.signature !== undefined ? (
            <div
              style={{
                wordBreak: "break-all",
                maxWidth: "100%",
                margin: "1em 0",
              }}
            >
              <code>Signature is : </code>
              <p>{signedMessage?.signature}</p>
            </div>
          ) : null}

          <h2>Encrypt Message</h2>
          {installed ? (
            <>
              <label style={{ marginBottom: 16 }}>
                Input Message To Encrypt
              </label>
              <input
                aria-label="To Encrypt a message"
                style={{ padding: "1em" }}
                onChange={(e) => {
                  setToEncryptMessage(e.target.value)
                }}
              />
              <label style={{ marginBottom: 16 }}>Input Their PublicKey</label>
              <input
                aria-label="We need their publicKey"
                style={{ padding: "1em" }}
                onChange={(e) => {
                  setTheirPublicKey(e.target.value)
                }}
              />
              <button className="demo-button" onClick={encryptMessage}>
                Encrypt Message
              </button>
            </>
          ) : null}
          {messageEncrypted !== undefined ? (
            <div
              style={{
                wordBreak: "break-all",
                maxWidth: "100%",
                margin: "1em 0",
              }}
            >
              <code>Encrypted Message is : </code>
              <p>{messageEncrypted}</p>
            </div>
          ) : null}

          <h2>Decrypt Message</h2>
          {installed ? (
            <>
              <label style={{ marginBottom: 16 }}>
                Input CipherText To Decrypt
              </label>
              <input
                aria-label="To Decrypt a message"
                style={{ padding: "1em" }}
                onChange={(e) => {
                  setToDecryptMessage(e.target.value)
                }}
              />
              <label style={{ marginBottom: 16 }}>Input Their PublicKey</label>
              <input
                aria-label="We need their publicKey"
                style={{ padding: "1em" }}
                onChange={(e) => {
                  setTheirDecryptPublicKey(e.target.value)
                }}
              />
              <button className="demo-button" onClick={decryptMessage}>
                Decrypt Message
              </button>
            </>
          ) : null}

          {messageDecrypted !== undefined ? (
            <div
              style={{
                wordBreak: "break-all",
                maxWidth: "100%",
                margin: "1em 0",
              }}
            >
              <code>Decrypted Message is : </code>
              <p>{messageDecrypted}</p>
            </div>
          ) : null}
        </div>

        <p style={{ fontSize: "0.6em" }}>Documentations are WIP</p>
      </header>
      <footer>
        <div
          style={{ textAlign: "center", fontSize: "0.8em", marginTop: "2em" }}
        >
          <a
            className="App-link"
            href="https://vitejs.dev/guide/features.html"
            target="_blank"
            rel="noopener noreferrer"
          >
            Vite Docs
          </a>
          {" | "}
          <a
            className="App-link"
            href="https://docs.metamask.io/guide/snaps.html"
            target="_blank"
            rel="noopener noreferrer"
          >
            Snap Docs
          </a>
        </div>
      </footer>
    </>
  )
}
