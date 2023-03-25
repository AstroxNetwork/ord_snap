export class Relay {
  public ws: WebSocket
  public url: string
  private opts: any
  private manualClose: boolean = false
  private reconnecting: boolean = false
  public onfn: any

  constructor(
    relay: string,
    opts: {
      manualClose?: boolean
      reconnecting?: boolean
      reconnect?: boolean
    } = {},
  ) {
    this.url = relay
    this.opts = opts
    if (opts.reconnect === undefined) opts.reconnect = true
    this.onfn = {}
    this.ws = new WebSocket(this.url)
    this.initWebSocket().catch((e) => {
      if (this.onfn.error) this.onfn.error(e)
    })
  }

  private async waitConnected(): Promise<void> {
    let retry = 1000
    while (true) {
      if (this.ws.readyState !== 1) {
        await this.sleep(retry)
        retry *= 1.5
      } else {
        return
      }
    }
  }

  private async initWebSocket(): Promise<void> {
    let resolved = false
    this.ws.onmessage = (m) => {
      this.handleNostrMessage(m)
      if (this.onfn.message) this.onfn.message(m)
    }
    this.ws.onclose = (e) => {
      if (this.onfn.close) this.onfn.close(e)
      if (this.reconnecting)
        return Promise.reject(new Error("close during reconnect"))
      if (!this.manualClose && this.opts.reconnect) this.reconnect()
    }
    this.ws.onerror = (e) => {
      if (this.onfn.error) this.onfn.error(e)
      if (this.reconnecting)
        return Promise.reject(new Error("error during reconnect"))
      if (this.opts.reconnect) this.reconnect()
    }
    this.ws.onopen = (e) => {
      if (this.onfn.open) this.onfn.open(e)

      if (resolved) return

      resolved = true
    }
  }

  private async reconnect(): Promise<void> {
    const reconnecting = true
    let n = 100
    try {
      this.reconnecting = true
      await this.initWebSocket()
      this.reconnecting = false
    } catch {
      await this.sleep(n)
      n *= 1.5
    }
  }

  private async sleep(ms: number): Promise<void> {
    return new Promise((resolve) => setTimeout(resolve, ms))
  }

  public on(method: string, fn: Function): Relay {
    this.onfn[method] = fn
    return this
  }

  public close(): void {
    if (this.ws) {
      this.manualClose = true
      this.ws.close()
    }
  }

  public subscribe(sub_id: string, filters: any): void {
    if (Array.isArray(filters)) this.send(["REQ", sub_id, ...filters])
    else this.send(["REQ", sub_id, filters])
  }

  public unsubscribe(sub_id: string): void {
    this.send(["CLOSE", sub_id])
  }

  public async send(data: any): Promise<void> {
    await this.waitConnected()
    this.ws.send(JSON.stringify(data))
  }

  private handleNostrMessage(msg: MessageEvent): void {
    let data
    try {
      data = JSON.parse(msg.data)
    } catch (e) {
      console.error("handle_nostr_message", e)
      return
    }
    if (data.length >= 2) {
      switch (data[0]) {
        case "EVENT":
          if (data.length < 3) return
          return this.onfn.event && this.onfn.event(data[1], data[2])
        case "EOSE":
          return this.onfn.eose && this.onfn.eose(data[1])
        case "NOTICE":
          return this.onfn.notice && this.onfn.notice(...data.slice(1))
        case "OK":
          return this.onfn.ok && this.onfn.ok(...data.slice(1))
      }
    }
  }
}

export class RelayPool {
  onfn: any = {}
  relays: Relay[] = []
  opts: any

  constructor(relays: any, opts: any = {}) {
    if (!(this instanceof RelayPool)) {
      return new RelayPool(relays, opts)
    }

    this.opts = opts

    for (const relay of relays) {
      this.add(relay)
    }
  }

  close() {
    for (const relay of this.relays) {
      relay.close()
    }
  }

  on(method: string, fn: any) {
    for (const relay of this.relays) {
      this.onfn[method] = fn
      relay.onfn[method] = fn.bind(null, relay)
    }
    return this
  }

  has(relayUrl: string) {
    for (const relay of this.relays) {
      if (relay.url === relayUrl) {
        return true
      }
    }
    return false
  }

  send(payload: any, relay_ids?: string[]) {
    const relays = relay_ids ? this.find_relays(relay_ids) : this.relays
    for (const relay of relays) {
      relay.send(payload)
    }
  }

  setupHandlers() {
    const keys = Object.keys(this.onfn)
    for (const handler of keys) {
      for (const relay of this.relays) {
        relay.onfn[handler] = this.onfn[handler].bind(null, relay)
      }
    }
  }

  remove(url: string) {
    let i = 0
    for (const relay of this.relays) {
      if (relay.url === url) {
        relay.ws && relay.ws.close()
        this.relays = this.relays.splice(i, 1)
        return true
      }
      i += 1
    }
    return false
  }

  subscribe(sub_id: string, filters: any, relay_ids?: string[]) {
    const relays = relay_ids ? this.find_relays(relay_ids) : this.relays
    for (const relay of relays) {
      relay.subscribe(sub_id, filters)
    }
  }

  unsubscribe(sub_id: string, relay_ids?: string[]) {
    const relays = relay_ids ? this.find_relays(relay_ids) : this.relays
    for (const relay of relays) {
      relay.unsubscribe(sub_id)
    }
  }

  add(relay: Relay | string) {
    if (relay instanceof Relay) {
      if (this.has(relay.url)) {
        return false
      }
      this.relays.push(relay)
      this.setupHandlers()
      return true
    }
    if (this.has(relay)) {
      return false
    }
    const r = new Relay(relay, this.opts)
    this.relays.push(r)
    this.setupHandlers()
    return true
  }

  find_relays(relay_ids: any) {
    if (relay_ids instanceof Relay) {
      return [relay_ids]
    }
    if (relay_ids.length === 0) {
      return []
    }
    if (!relay_ids[0]) {
      throw new Error("what!?")
    }
    return this.relays.reduce((acc: any, relay: Relay) => {
      if (relay_ids.some((rid: string) => relay.url === rid)) {
        acc.push(relay)
      }
      return acc
    }, [])
  }
}
