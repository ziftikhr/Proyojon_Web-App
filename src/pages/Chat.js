import {
  Timestamp,
  addDoc,
  collection,
  deleteDoc,
  doc,
  getDoc,
  getDocs,
  onSnapshot,
  orderBy,
  query,
  updateDoc,
  where,
} from "firebase/firestore";
import React, { useEffect, useState, useRef } from "react";
import { FaUserCircle } from "react-icons/fa";
import { Link, useLocation } from "react-router-dom";
import Message from "../components/Message";
import MessageForm from "../components/MessageForm";
import User from "../components/User";
import { auth, db } from "../firebaseConfig";
import "../styles/Chat.css";
import { FaTrashAlt } from 'react-icons/fa';

const Chat = () => {
  const [chat, setChat] = useState(null);
  const [text, setText] = useState("");
  const [users, setUsers] = useState([]);
  const [msgs, setMsgs] = useState([]);
  const [online, setOnline] = useState({});
  const location = useLocation();
  const user1 = auth.currentUser?.uid;
  const currentChatIdRef = useRef(null);
  const msgListenerRef = useRef(null); // Reference to store the message listener

  const [unreadCount, setUnreadCount] = useState(0);
  const [userUnreadCounts, setUserUnreadCounts] = useState({});

  // Function to get unread message counts
  const getUnreadMessagesCount = async () => {
    if (!user1) return;
  
    try {
      const msgRef = collection(db, "messages");
      const q = query(msgRef, where("users", "array-contains", user1));
  
      const msgsSnap = await getDocs(q);
      let count = 0;
      const userCounts = {};
  
      msgsSnap.forEach((doc) => {
        const data = doc.data();
        if (data.lastSender !== user1 && data.lastUnread === true) {
          count++;
          
          // Extract the user ID from the chat ID
          const chatParts = doc.id.split('.');
          const otherUserId = chatParts.find(id => id !== user1);
          const id = chatParts[2]; // Assuming id is always the third part
          
          // Create a unique key for this chat
          const chatKey = `${otherUserId}-${id}`;
          
          // Increment count for this user/ad combo
          userCounts[chatKey] = (userCounts[chatKey] || 0) + 1;
        }
      });
  
      setUnreadCount(count);
      setUserUnreadCounts(userCounts);
    } catch (error) {
      console.error("Error fetching unread messages:", error);
    }
  };
  
  useEffect(() => {
    if (user1) {
      getUnreadMessagesCount();
      const unsubscribe = onSnapshot(collection(db, "messages"), () => {
        getUnreadMessagesCount();
      });
  
      return () => unsubscribe();
    }
  }, [user1]);
  
  // Function to delete a conversation
  const deleteConversation = async () => {
    if (!chat) return;
  
    const chatId = currentChatIdRef.current;
    if (!chatId) return;
  
    try {
      // Immediately clear messages from the UI
      setMsgs([]);
  
      // Clean up message listener if it exists
      if (msgListenerRef.current) {
        msgListenerRef.current();
        msgListenerRef.current = null;
      }
  
      // Delete all messages in the conversation from Firestore
      const msgsRef = collection(db, "messages", chatId, "chat");
      const msgsSnapshot = await getDocs(msgsRef);
      const deletePromises = msgsSnapshot.docs.map((doc) => deleteDoc(doc.ref));
      await Promise.all(deletePromises);
  
      // Delete the conversation metadata from Firestore
      await deleteDoc(doc(db, "messages", chatId));
  
      // Also remove the conversation from the inbox collection
      const inboxRef = collection(db, "inbox");
      const inboxSnapshot = await getDocs(inboxRef);
      const conversationDoc = inboxSnapshot.docs.find(doc => doc.data().chatId === chatId);
      if (conversationDoc) {
        await deleteDoc(conversationDoc.ref);
      }
  
      // Remove the conversation from the users list
      setUsers(prevUsers => prevUsers.filter(user => user.ad.id !== chat.ad.id));
  
      // Clear the current chat state
      setChat(null);
      currentChatIdRef.current = null;
    } catch (error) {
      console.error("Error deleting conversation:", error);
    }
  };
  
  // Function to set up message listener for a specific chat
  const setupMessageListener = (chatId) => {
    // Clean up previous listener if it exists
    if (msgListenerRef.current) {
      msgListenerRef.current();
      msgListenerRef.current = null;
    }
    
    // Set up new listener
    const msgsRef = collection(db, "messages", chatId, "chat");
    const q = query(msgsRef, orderBy("createdAt", "asc"));
    
    const unsub = onSnapshot(q, (querySnapshot) => {
      // Only update messages if this is still the active chat
      if (currentChatIdRef.current === chatId) {
        let msgs = [];
        querySnapshot.forEach((doc) => {
          const msgData = doc.data();
          // Include Firestore document ID if needed
          msgs.push({ ...msgData, id: doc.id });
        });
        setMsgs(msgs);
      }
    }, (error) => {
      console.error("Error in message listener:", error);
    });
    
    // Store the unsubscribe function in the ref
    msgListenerRef.current = unsub;
    
    return unsub;
  };
  
  // Function to select a user to chat with
  const selectUser = async (user) => {
    if (!user || !user.ad) return;

    setChat(user);
    const user2 = user.other.uid;
    const id =
      user1 > user2
        ? `${user1}.${user2}.${user.ad.id}`
        : `${user2}.${user1}.${user.ad.id}`;
    
    // Store the current chat ID in the ref
    currentChatIdRef.current = id;
    
    // Set up message listener for this chat
    setupMessageListener(id);
    
    // Mark messages as read
    const docSnap = await getDoc(doc(db, "messages", id));
    if (docSnap.exists()) {
      if (docSnap.data().lastSender !== user1 && docSnap.data().lastUnread) {
        await updateDoc(doc(db, "messages", id), {
          lastUnread: false,
        });
        // Refresh unread counts
        getUnreadMessagesCount();
      }
    }
  };

  // Function to initialize a chat from an ad
  const getChat = async (ad) => {
    if (!ad || !ad.id) return;

    const buyer = await getDoc(doc(db, "users", user1));
    const seller = await getDoc(doc(db, "users", ad.postedBy));
    setChat({ ad, me: buyer.data(), other: seller.data() });
    
    const chatId =
      user1 > ad.postedBy
        ? `${user1}.${ad.postedBy}.${ad.id}`
        : `${ad.postedBy}.${user1}.${ad.id}`;
    
    // Store the current chat ID in the ref
    currentChatIdRef.current = chatId;
    
    // Set up listener for ad deletion
    const adRef = doc(db, "ads", ad.id);
    const unsubAd = onSnapshot(adRef, async (adSnap) => {
      if (!adSnap.exists() && currentChatIdRef.current === chatId) {
        // Clean up message listener
        if (msgListenerRef.current) {
          msgListenerRef.current();
          msgListenerRef.current = null;
        }
        
        // Delete chat messages and metadata
        const chatRef = collection(db, "messages", chatId, "chat");
        const chatSnapshot = await getDocs(chatRef);
        const deletePromises = chatSnapshot.docs.map((doc) =>
          deleteDoc(doc.ref)
        );
        await Promise.all(deletePromises);
        await deleteDoc(doc(db, "messages", chatId));
        
        // Clear chat state
        setChat(null);
        currentChatIdRef.current = null;
      }
    });
    
    // Set up message listener for this chat
    setupMessageListener(chatId);
    
    // Mark messages as read
    const docSnap = await getDoc(doc(db, "messages", chatId));
    if (docSnap.exists()) {
      if (docSnap.data().lastSender !== user1 && docSnap.data().lastUnread) {
        await updateDoc(doc(db, "messages", chatId), {
          lastUnread: false,
        });
        // Refresh unread counts
        getUnreadMessagesCount();
      }
    }
    
    return () => {
      unsubAd();
      if (msgListenerRef.current) {
        msgListenerRef.current();
        msgListenerRef.current = null;
      }
    };
  };

  // Function to get all chats for the current user
  const getList = async () => {
    const msgRef = collection(db, "messages");
    const q = query(msgRef, where("users", "array-contains", user1));
    const msgsSnap = await getDocs(q);
    const messages = msgsSnap.docs.map((doc) => doc.data());
    const users = [];
    const unsubscribes = [];
    
    for (const message of messages) {
      const adRef = doc(db, "ads", message.ad);
      const meRef = doc(
        db,
        "users",
        message.users.find((id) => id === user1)
      );
      const otherRef = doc(
        db,
        "users",
        message.users.find((id) => id !== user1)
      );
      
      const adDoc = await getDoc(adRef);
      const meDoc = await getDoc(meRef);
      const otherDoc = await getDoc(otherRef);
      
      if (adDoc.exists() && meDoc.exists() && otherDoc.exists()) {
        users.push({
          ad: { ...adDoc.data(), id: adDoc.id },
          me: { ...meDoc.data(), uid: meRef.id },
          other: { ...otherDoc.data(), uid: otherRef.id },
        });
        
        const unsub = onSnapshot(otherRef, (doc) => {
          setOnline((prev) => ({
            ...prev,
            [doc.id]: doc.data().isOnline,
          }));
        });
        
        unsubscribes.push(unsub);
      }
    }
    
    setUsers(users);
    
    return () => {
      unsubscribes.forEach((unsubscribe) => unsubscribe());
    };
  };

  // Effect to initialize chat and users list
  useEffect(() => {
    if (location.state?.ad) {
      getChat(location.state.ad);
    }
    getList();
    
    // Clean up listeners on unmount
    return () => {
      if (msgListenerRef.current) {
        msgListenerRef.current();
        msgListenerRef.current = null;
      }
    };
  }, [location.state]);

  // Function to handle message submission
  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!chat || !chat.ad || text.trim() === "") return;
  
    const user2 = chat.other.uid;
    const chatId =
      user1 > user2
        ? `${user1}.${user2}.${chat.ad.id}`
        : `${user2}.${user1}.${chat.ad.id}`;
    
    // Store the message text before clearing the input
    const messageText = text;
    setText("");
  
    try {
      // Create message object
      const msgData = {
        text: messageText,
        sender: user1,
        createdAt: Timestamp.now(),
      };
      
      // Add message to Firestore
      await addDoc(collection(db, "messages", chatId, "chat"), msgData);
  
      // Check if this is a new conversation
      const docSnap = await getDoc(doc(db, "messages", chatId));
      if (!docSnap.exists()) {
        // Create new conversation metadata
        await updateDoc(doc(db, "messages", chatId), {
          users: [user1, user2],
          ad: chat.ad.id,
          lastText: messageText,
          lastSender: user1,
          lastUnread: true,
          createdAt: Timestamp.now(),
        });
      } else {
        // Update existing conversation metadata
        await updateDoc(doc(db, "messages", chatId), {
          lastText: messageText,
          lastSender: user1,
          lastUnread: true,
          updatedAt: Timestamp.now(),
        });
      }
      
      // Ensure message listener is active
      if (!msgListenerRef.current) {
        setupMessageListener(chatId);
      }
    } catch (error) {
      console.error("Error sending message:", error);
      // Restore text if sending failed
      setText(messageText);
    }
  };

  // Helper function to get unread count for a specific user/ad combination
  const getUnreadCountForUser = (user) => {
    if (!user || !user.ad || !user.other) return 0;
    
    const chatKey = `${user.other.uid}-${user.ad.id}`;
    return userUnreadCounts[chatKey] || 0;
  };

  return (
    <div className="row g-0">
      <div className="headline">Chats</div>
      <div className="col-3 col-md-3 users_container">
        {users.map((user, i) => (
          <User
            key={i}
            user={user}
            selectUser={selectUser}
            chat={chat}
            online={online}
            user1={user1}
            unreadCount={getUnreadCountForUser(user)}
          />
        ))}
      </div>
      <div className="col-6 col-md-6 position-relative chat-inbox">
        {chat ? (
          <>
            <div className="text-center mt-1 user2-container">
               {chat.other.photoUrl ? (
                 <img
                   src={chat.other.photoUrl}
                   alt={chat.other.name}
                   className="user2-img"
                 />
               ) : (
                 <FaUserCircle size={50} />
               )}
               <div className="user2-title-container">
                 <h3 className="user2-title">{chat.other.name}</h3>
                 <div
                   className="delete-conversation-btn"
                   onClick={deleteConversation}
                   title="Delete Conversation"
                 >
                   <FaTrashAlt size={25} color="red" />
                 </div>
               </div>
             </div>
             <div className="messages overflow-auto">
              {msgs.length > 0 ? (
                msgs.map((msg, i) => (
                  <Message key={i} msg={msg} user1={user1} />
                ))
              ) : (
                <div className="text-center mt-5">
                  <p>No messages yet. Start the conversation!</p>
                </div>
              )}
            </div>

            <MessageForm
              text={text}
              setText={setText}
              handleSubmit={handleSubmit}
            />
          </>
        ) : (
          <div className="text-center mt-5">
            <h3 className="user2-title">Select a user to start conversation</h3>
          </div>
        )}
      </div>
      <div className="col-3 col-md-3 position-relative chat-info">
        <div className="test">
          {chat && (
            <>
              {chat.other.photoUrl ? (
                <img
                  src={chat.other.photoUrl}
                  alt={chat.other.name}
                  className="user2-img"
                />
              ) : (
                <FaUserCircle size={50} />
              )}
              <h3 className="chat-title mt-2">{chat.other.name}</h3>
              <small className={`${online[chat.other.uid] ? "online" : "offline"}`}>
                {online[chat.other.uid] ? "Active now" : "Offline"}
              </small>
              <br />
              <div className="ad-details text-center mt-3">
                <div className="p-2 user2-container">
                  <img
                    src={chat.ad.images?.[0]?.url}
                    alt={chat.ad.title}
                    className="img-thumbnail mb-2"
                  />
                </div>
                <div>
                  <h6 className="ad-title mb-1">{chat.ad.title}</h6>
                  <small className="text-muted">{chat.ad.price}</small>
                </div>
                {chat.ad?.category && chat.ad?.id && (
                  <Link
                    to={`/${chat.ad.category.toLowerCase()}/${chat.ad.id}`}
                    className="btn btn-secondary btn-sm mt-2"
                  >
                    View Post
                  </Link>
                )}
              </div>
            </>
          )}
        </div>
      </div>
    </div>
  );
};

export default Chat;