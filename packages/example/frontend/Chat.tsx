import React, { useState } from "react"
import { Input, Button, Avatar, Space } from "antd"
// import { SendEvent as Event } from "./chat/adaptor"

interface Event {
  id: number
  content: string
  timestamp: Date
  pubkey: string
}

// interface Props {
//   profilePicture: string
//   websiteOwnerPubkey: string
//   nip05?: string
//   event: Event
//   responses: { [key: number]: Event[] }
//   selectMessage: (id: number) => void
//   selectedMessage: number
// }

// const NostrNote: React.FC<Props> = ({
//   // profilePicture,
//   // byWebsiteOwner,
//   websiteOwnerPubkey
//   nip05,
//   event,
//   responses,
//   // selectMessage,
//   selectedMessage,
// }) => {
//   const [showResponses, setShowResponses] = useState(false)

//   let profiles = {}
//   let profilePicture

//   function selectMessage() {
//     if ($selectedMessage === event.id) {
//       $selectedMessage = null
//     } else {
//       $selectedMessage = event.id
//     }
//   }
//   const byWebsiteOwner = !!(websiteOwnerPubkey === event.pubkey)
//   $: profiles = $chatData.profiles
//   let displayName =
//     (profiles[event.pubkey] && profiles[event.pubkey].display_name) ||
//     event.pubkey
//   $: nip05 = profiles[event.pubkey] && profiles[event.pubkey].nip05
//   $: profilePicture =
//     (profiles[event.pubkey] && profiles[event.pubkey].picture) ||
//     `https://robohash.org/${event.pubkey}.png?set=set1`
//   const repliedIds = event.tags.filter((e) => e[0] === "e").map((e) => e[1])
//   let timestamp = new Date(event.created_at * 1000)

//   return (
//     <div className="block p-2-lg mb-3 text-wrap">
//       <div className="flex flex-row gap-4">
//         <div className="min-w-fit">
//           <Avatar
//             src={profilePicture}
//             size="large"
//             className={
//               byWebsiteOwner ? "ring-purple-700 ring-4" : "ring-gray-300 ring-2"
//             }
//           />
//         </div>

//         <div className="w-full overflow-hidden">
//           <div className="flex flex-row justify-between text-center overflow-clip text-clip w-full">
//             <Space>
//               <span className="text-base font-semibold text-clip">
//                 {displayName}
//               </span>
//               {nip05 && <span className="text-sm text-gray-400">{nip05}</span>}
//             </Space>
//           </div>

//           <div
//             className={`max-h-64 text-base cursor-pointer border border-slate-200 ${
//               selectedMessage === event.id
//                 ? "bg-purple-700 text-white"
//                 : "bg-slate-50 text-gray-500 hover:bg-slate-100"
//             } p-4 py-2 overflow-scroll rounded-2xl`}
//             onClick={() => {
//               selectMessage(event.id)
//             }}
//           >
//             {event.content}
//           </div>

//           <div className="flex flex-row-reverse justify-between mt-1 overflow-clip items-center">
//             <div className="text-xs text-gray-400 text-ellipsis overflow-clip whitespace-nowrap">
//               <span className="py-2">{event.timestamp.toLocaleString()}</span>
//             </div>

//             {byWebsiteOwner ? (
//               <div className="text-purple-500 text-xs">Website owner</div>
//             ) : (
//               <div className="text-xs text-gray-400">{displayName}</div>
//             )}
//           </div>
//         </div>
//       </div>

//       {responses[event.id]?.length > 0 && (
//         <div className="pl-5 border-l border-l-gray-400 mb-10">
//           {responses[event.id].map((response) => (
//             <NostrNote
//               key={response.id}
//               profilePicture={profilePicture}
//               byWebsiteOwner={false}
//               displayName={displayName}
//               nip05={nip05}
//               event={response}
//               responses={responses}
//               selectMessage={selectMessage}
//               selectedMessage={selectedMessage}
//             />
//           ))}
//         </div>
//       )}
//     </div>
//   )
// }

type ChatProps = {
  chatAdapter?: any
  ownName: string
  totalRelays: number
  connectedRelays: number
  selectedMessage?: string
  events: Event[]
  getEventById: (id: string) => Event | undefined
  responses: any[]
  websiteOwnerPubkey: string
  chatConfiguration: {
    chatType: "DM" | "Public"
  }
  selectParent: () => void
  inputKeyDown: (event: any) => void
  sendMessage: () => void
}

const Chat: React.FC<ChatProps> = ({
  chatAdapter,
  ownName,
  totalRelays,
  connectedRelays,
  selectedMessage,
  events,
  getEventById,
  responses,
  websiteOwnerPubkey,
  chatConfiguration,
  selectParent,
  inputKeyDown,
  sendMessage,
}) => {
  const [message, setMessage] = useState("")
  return (
    <>
      <div
        className={`bg-purple-700 text-white -m-5 mb-3 px-5 py-3 overflow-clip flex flex-row justify-between items-center`}
      >
        <div className="text-lg font-semibold">
          {chatAdapter?.pubkey && ownName}
        </div>
        <span className="text-xs flex flex-col items-end mt-2 text-gray-200 gap-1">
          <div className="flex flex-row gap-1 overflow-clip">
            {[...Array(totalRelays)].map((_, i) => (
              <span
                key={i}
                className={`inline-block rounded-full ${
                  connectedRelays > i ? "bg-green-500" : "bg-gray-300"
                } w-2 h-2`}
              ></span>
            ))}
          </div>
          {connectedRelays}/{totalRelays} relays
        </span>
      </div>
      {selectedMessage && !getEventById(selectedMessage) ? (
        <h1>Couldn't find event with ID {selectedMessage}</h1>
      ) : (
        selectedMessage && (
          <div className="flex flex-row mb-3">
            <a href="#" onClick={selectParent}>
              <svg
                xmlns="http://www.w3.org/2000/svg"
                fill="none"
                viewBox="0 0 24 24"
                strokeWidth="1.5"
                stroke="currentColor"
                className="w-6 h-6"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  d="M19.5 12h-15m0 0l6.75 6.75M4.5 12l6.75-6.75"
                />
              </svg>
            </a>
            <div className="flex flex-col ml-2">
              <span className="text-lg text-black overflow-hidden whitespace-nowrap text-ellipsis">
                {getEventById(selectedMessage)?.content}
              </span>
            </div>
          </div>
        )
      )}
      <div id="messages-container" className="overflow-scroll">
        {!selectedMessage &&
          events.map((event: any) => (
            <div key={event.id}>
              {/* <NostrNote
                event={event}
                responses={responses}
                websiteOwnerPubkey={websiteOwnerPubkey}
                
              /> */}
              {event.deleted && "👆 deleted"}
            </div>
          ))}
        {selectedMessage && (
          //   <NostrNote
          //     event={getEventById(selectedMessage)!}
          //     responses={responses}
          //     websiteOwnerPubkey={websiteOwnerPubkey}
          //    />
          <div>shit</div>
        )}
      </div>
      <div className="flex flex-col">
        <div className="border-y border-y-slate-200 -mx-5 my-2 bg-slate-100 text-black text-sm px-5 py-2">
          {chatConfiguration.chatType === "DM" ? (
            <>
              <b>Encrypted chat:</b> only your chat partner can see these
              messages.
            </>
          ) : (
            <>
              <b>Public chat:</b> anyone can see these messages.
            </>
          )}
        </div>
        <div className="flex flex-row gap-2 -mx-1">
          <Input
            type="text"
            id="message-input"
            className="-mb-2 p-2 w-full resize-none rounded-xl text-gray-600 border"
            placeholder="Say hello!"
            // rows={1}
            value={message}
            onChange={(e) => setMessage(e.target.value)}
            onKeyDown={inputKeyDown}
          />
          <Button
            type="primary"
            className="inline-flex items-center rounded-full border border-transparent bg-purple-700 p-3 text-white shadow-sm hover:bg-purple-600 focus:outline-none focus:ring-2 focus:ring-purple-500 focus:ring-offset-2"
            onClick={sendMessage}
          >
            Send
          </Button>
        </div>
      </div>
      <style>{`
        base;
        components;
        utilities;
      `}</style>
    </>
  )
}

export default Chat
