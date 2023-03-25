import React from "react"
import { NostrProvider } from "nostr-react"
import { Auth } from "./Auth"
import { Intro } from "./Intro"

const relayUrls = [
  "wss://nostr-pub.wellorder.net",
  "wss://relay.nostr.ch",
  "wss://relay.f7z.io",
  "wss://nos.lol",
  "wss://relay.nostr.info",
  "wss://nostr-pub.wellorder.net",
  "wss://relay.current.fyi",
  "wss://relay.nostr.band",
]

function App() {
  return (
    <NostrProvider relayUrls={relayUrls} debug={true}>
      <div className="App">
        <Intro />
      </div>
    </NostrProvider>
  )
}

export default App
