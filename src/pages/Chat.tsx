import { useNavigate, useSearchParams } from "react-router-dom";
import Header from "../components/Header";
import { IoIosArrowBack } from "react-icons/io";
import { MdContentCopy } from "react-icons/md";
import { useEffect, useRef, useState } from "react";
import { IoMdCheckmark } from "react-icons/io";
import { BACKEND_URL } from "../../lib/config";
import { generateRoomId } from "../../lib/utils";
import { BsFillSendFill } from "react-icons/bs";
import Footer from "../components/Footer";

interface Message {
  message: string;
  senderId: string;
}

const Chat = ()=> {
  const navigate = useNavigate();
  const inviteCodeRef = useRef<HTMLDivElement>(null);
  const [isCopied, setIsCopied] = useState(false);
  const [messages, setMessages] = useState<Message[]>([]);
  const [myUserId, setMyUserId] = useState("");
  const wsRef = useRef<WebSocket>();
  const [params, setParams] = useSearchParams();
  const [roomId, setRoomId] = useState<string>(
    params.get("roomid")?.toLowerCase() || ""
  );
  const inputRef = useRef<HTMLInputElement>(null);
  const messageRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    messageRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  useEffect(()=>{
    const ws = new WebSocket(BACKEND_URL);

    ws.onmessage = (event) =>{
      //console.log("Received:", event.data); // added this line : console test
      
      //const data : Message = JSON.parse(event.data);
      //console.log(data); 

      const data = JSON.parse(event.data);

      if (data.type === "connected") {
        console.log("My User ID:", data.userId);
        setMyUserId(data.userId);
        return;
      }
      console.log("Received object:", data);
      setMessages((m) => [...m, data]);
    };

  
    wsRef.current = ws;

    if(!roomId){
      setRoomId(generateRoomId());
    }
    
    setParams({roomid : roomId});
    ws.onopen = () => {
      ws.send(
        JSON.stringify({
          type : "join",
          payload : {
            roomId,
          },
        })
      );
    };

    return () => {
      ws.close();
    };
  }, [roomId , setParams]);

  function onSubmitHandler(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();

    const message = inputRef.current?.value;

    if (message && wsRef.current) {
      wsRef.current.send(
        JSON.stringify({
          type: "chat",
          payload: {
            message: message,
          },
        })
      );
    }

    if (inputRef.current) {
      inputRef.current.value = "";
    }
  }

  const copyInviteCode = () => {
    if (inviteCodeRef.current) {
      navigator.clipboard
        .writeText(inviteCodeRef.current.textContent!)
        .then(() => {
          setIsCopied(true);
          setTimeout(() => setIsCopied(false), 2000);
        })
        .catch((err) => {
          console.error("Failed to copy: ", err);
        });
    }
  };

  return (
    <div>
      <div className="h-screen flex flex-col">
        <Header />
        <main className="flex flex-1 justify-center items-center flex-col dark:bg-neutral-900 dark:text-neutral-100 text-neutral-800 max-h-[calc(100vh-4rem)] py-28">
          <div className="flex justify-between items-center w-3/4 md:w-2/3 px-4 mb-4 font-bold sm:text-lg sm:flex-row flex-col gap-4">
            <button
              onClick={() => {
                navigate("/");
              }}
              className="flex gap-1 items-center text-red-500 dark:text-red-600 hover:text-red-600 dark:hover:text-red-700"
            >
              <IoIosArrowBack className="inline" /> Exit Chat
            </button>
            <div className="flex gap-2 items-center dark:text-neutral-300">
              <div className="font-medium text-neutral-700 dark:text-neutral-200">
                Invite Code:{" "}
              </div>
              <div
                className="font-courier bg-zinc-100 dark:bg-zinc-800 dark:border-neutral-700 px-3 py-1 rounded-md border flex gap-4 justify-between items-center"
                ref={inviteCodeRef}
              >
                {roomId}
                {isCopied ? (
                  <IoMdCheckmark />
                ) : (
                  <MdContentCopy
                    className="cursor-pointer text-neutral-600 dark:text-neutral-300 hover:scale-105"
                    onClick={copyInviteCode}
                  />
                )}
              </div>
            </div>
          </div>
          <section className="bg-neutral-100 dark:bg-neutral-800/40 w-3/4 md:w-2/3 h-full rounded-xl border dark:border-neutral-700 shadow-md relative flex flex-col">
            <div className="overflow-y-auto flex-1 px-6 py-6 flex flex-col gap-2 no-scrollbar">
              
              {messages.length === 0 && (
                <div className="text-neutral-600 dark:text-neutral-300 text-sm sm:text-base font-semibold h-full flex items-center justify-center self-center">
                  Start a conversation!
                </div>
              )}

              {messages.map((message, index) => {
              const isMine = message.senderId === myUserId;

              return (
                <div
                  key={index}
                  className={`w-full flex mt-3 ${
                    isMine ? "justify-end" : "justify-start"
                  }`}
                >
                  <div
                    ref={index === messages.length - 1 ? messageRef : null}
                    className={`max-w-[75%] px-4 py-3 rounded-2xl shadow-md break-words whitespace-pre-wrap
                    transition-all duration-300
                    ${
                      isMine
                        ? "bg-blue-500 text-white rounded-br-md animate-right"
                        : "bg-gray-200 dark:bg-neutral-700 text-black dark:text-white rounded-bl-md animate-left"
                    }`}
                  >
                    {message.message}
                  </div>
                </div>
              );
            })}
            </div>
            <div className="flex-none rounded-full w-full py-3">
              <form
                onSubmit={onSubmitHandler}
                className="border shadow-lg flex items-center justify-between gap-3 bg-white dark:bg-neutral-700 dark:border-neutral-600 w-11/12 sm:w-5/6 mx-auto rounded-full px-5 py-3"
              >
                <input
                  type="text"
                  className="font-medium outline-none w-full bg-transparent text-base placeholder:text-gray-400"
                  autoFocus
                  ref={inputRef}
                  placeholder="Type a message..."
                />
                <button type="submit">
                  <BsFillSendFill className="text-2xl text-blue-500 hover:text-blue-600 hover:scale-110 transition-all duration-200 cursor-pointer" />
                </button>
              </form>
            </div>
          </section>
        </main>
      </div>
      <Footer />
    </div>
  );
};


export default Chat;