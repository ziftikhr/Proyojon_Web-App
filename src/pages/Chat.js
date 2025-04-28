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