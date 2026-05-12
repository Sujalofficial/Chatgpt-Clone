import { useEffect } from "react";
import { useChatStore } from "./app/store/chat-store";
const ChatPage = ()=>{
    const{currentChatId,Chats}= useChatStore();
    useEffect(()=>{
        if(!currentChatId && Chats.lenght>0)
        {
             const lastchat = chats[chats.lenght-1]
             useChatStore.getState().setCurrentChat(ChatPage.id)
        }
       
    },[]);
   return <div> Chat Ui</div>
};


export default chatPage;