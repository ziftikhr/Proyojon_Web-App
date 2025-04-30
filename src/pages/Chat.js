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
  
  
  
  // Function to delete the conversation
  
  
  const Chat = () => {
    const [chat, setChat] = useState(null);
    const [text, setText] = useState("");
    const [users, setUsers] = useState([]);
    const [msgs, setMsgs] = useState([]);
    const [online, setOnline] = useState({});
    const location = useLocation();
    const user1 = auth.currentUser?.uid;
    const currentChatIdRef = useRef(null);
  
    const [unreadCount, setUnreadCount] = useState(0);
    const [userUnreadCounts, setUserUnreadCounts] = useState({}); // Track unread counts by chat
  
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
            const adId = chatParts[2]; // Assuming adId is always the third part
            
            // Create a unique key for this chat
            const chatKey = `${otherUserId}-${adId}`;
            
            // Increment count for this user/ad combo
            userCounts[chatKey] = (userCounts[chatKey] || 0) + 1;
          }
        });
    
        setUnreadCount(count); // Update total unread count
        setUserUnreadCounts(userCounts); // Update counts per chat
      } catch (error) {
        console.error("Error fetching unread messages:", error);
      }
    };
    
    useEffect(() => {
      if (user1) {
        getUnreadMessagesCount(); // Initial Fetch
        const unsubscribe = onSnapshot(collection(db, "messages"), () => {
          getUnreadMessagesCount(); // Real-time updates
        });
    
        return () => unsubscribe();
      }
    }, [user1]);
    
}

const deleteConversation = async () => {
    if (!chat) return;
  
    const chatId = currentChatIdRef.current;
    if (!chatId) return;
  
    try {
      // Immediately clear messages from the UI
      setMsgs([]);
  
      // Delete all messages in the conversation from Firestore
      const msgsRef = collection(db, "messages", chatId, "chat");
      const msgsSnapshot = await getDocs(msgsRef);
      const deletePromises = msgsSnapshot.docs.map((doc) => deleteDoc(doc.ref));
      await Promise.all(deletePromises);
  
      // Delete the conversation metadata from Firestore
      await deleteDoc(doc(db, "messages", chatId));
  
      // Also remove the conversation from the inbox collection
      const inboxRef = collection(db, "inbox"); // Replace with the correct inbox collection
      const inboxSnapshot = await getDocs(inboxRef);
      const conversationDoc = inboxSnapshot.docs.find(doc => doc.data().chatId === chatId);
      if (conversationDoc) {
        await deleteDoc(conversationDoc.ref);
      }
  
      // Remove the conversation from the users list
      setUsers(prevUsers => prevUsers.filter(user => user.ad.adId !== chat.ad.adId));
  
      // Clear the current chat state
      setChat(null);
      currentChatIdRef.current = null;
    }  catch (error) {
        console.error("Error deleting conversation:", error);
      }
    };

    const selectUser = async (user) => {
      if (!user || !user.ad) return;
  
      setChat(user);
      const user2 = user.other.uid;
      const id =
        user1 > user2
          ? `${user1}.${user2}.${user.ad.adId}`
          : `${user2}.${user1}.${user.ad.adId}`;
      
      // Store the current chat ID in the ref
      currentChatIdRef.current = id;
      
      const msgsRef = collection(db, "messages", id, "chat");
      const q = query(msgsRef, orderBy("createdAt", "asc"));
      const unsub = onSnapshot(q, (querySnapshot) => {
        // Only update messages if this is still the active chat
        if (currentChatIdRef.current === id) {
          let msgs = [];
          querySnapshot.forEach((doc) => msgs.push(doc.data()));
          setMsgs(msgs);
        }
      });
      
      const docSnap = await getDoc(doc(db, "messages", id));
      if (docSnap.exists()) {
        if (docSnap.data().lastSender !== user1 && docSnap.data().lastUnread) {
          await updateDoc(doc(db, "messages", id), {
            lastUnread: false,
          });
          // Trigger a refresh of unread counts
          getUnreadMessagesCount();
        }
      }
      return () => unsub();
    };
  
    const getChat = async (ad) => {
      if (!ad || !ad.adId) return;
  
      const buyer = await getDoc(doc(db, "users", user1));
      const seller = await getDoc(doc(db, "users", ad.postedBy));
      setChat({ ad, me: buyer.data(), other: seller.data() });
      
      const chatId =
        user1 > ad.postedBy
          ? `${user1}.${ad.postedBy}.${ad.adId}`
          : `${ad.postedBy}.${user1}.${ad.adId}`;
      
      // Store the current chat ID in the ref
      currentChatIdRef.current = chatId;
      
      const adRef = doc(db, "ads", ad.adId);
      const unsubAd = onSnapshot(adRef, async (adSnap) => {
        if (!adSnap.exists() && currentChatIdRef.current === chatId) {
          const chatRef = collection(db, "messages", chatId, "chat");
          const chatSnapshot = await getDocs(chatRef);
          const deletePromises = chatSnapshot.docs.map((doc) =>
            deleteDoc(doc.ref)
          );
          await Promise.all(deletePromises);
          await deleteDoc(doc(db, "messages", chatId));
          setChat(null);
          currentChatIdRef.current = null;
        }
      });
      
      // Set up message listener for this chat
      const msgsRef = collection(db, "messages", chatId, "chat");
      const q = query(msgsRef, orderBy("createdAt", "asc"));
      const unsubMsgs = onSnapshot(q, (querySnapshot) => {
        // Only update messages if this is still the active chat
        if (currentChatIdRef.current === chatId) {
          let msgs = [];
          querySnapshot.forEach((doc) => msgs.push(doc.data()));
          setMsgs(msgs);
        }
      });
      
      // Mark messages as read when opening this chat
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
        unsubMsgs();
      };
    };