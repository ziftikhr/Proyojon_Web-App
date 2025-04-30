import React, { useState, useEffect } from "react";
import {
  collection,
  getDocs,
  query,
  where,
} from "firebase/firestore";
import { db, auth } from "../firebaseConfig";
import AdCard from "../components/AdCard";
import { onAuthStateChanged } from "firebase/auth";

const MyFavorites = () => {
  const [ads, setAds] = useState([]);
  const [loading, setLoading] = useState(true);
  const [user, setUser] = useState(null);

  // First wait for auth to be ready
  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, (currentUser) => {
      setUser(currentUser);
    });
    
    return () => unsubscribe();
  }, []);

  // Then fetch ads when user is available
  useEffect(() => {
    if (user) {
      getAds();
    } else if (user === null) {
      // User state has been determined (not undefined), but no user is logged in
      setLoading(false);
    }
  }, [user]);

  const getAds = async () => {
    try {
      setLoading(true);
  
      if (!user || !user.uid) {
        console.error("No authenticated user found");
        setLoading(false);
        return;
      }
  
      // Step 1: Get all favorite ad IDs for the user
      const favRef = collection(db, "favorites");
      const favQuery = query(favRef, where("users", "array-contains", user.uid));
      const favoritesSnapshot = await getDocs(favQuery);
  
      const adIds = favoritesSnapshot.docs.map(doc => doc.id);
  
      if (adIds.length === 0) {
        setAds([]);
        setLoading(false);
        return;
      }
  
      // Step 2: Batch fetch ads using where '__name__' in [ids]
      const CHUNK_SIZE = 10; // Firestore supports max 10 per 'in' query
      const chunks = [];
  
      for (let i = 0; i < adIds.length; i += CHUNK_SIZE) {
        chunks.push(adIds.slice(i, i + CHUNK_SIZE));
      }
  
      const adsData = [];
  
      for (const chunk of chunks) {
        const adsQuery = query(collection(db, "ads"), where("__name__", "in", chunk));
        const adsSnapshot = await getDocs(adsQuery);
  
        adsSnapshot.forEach((doc) => {
          adsData.push({ ...doc.data(), id: doc.id });
        });
      }
  
      setAds(adsData);
    } catch (error) {
      console.error("Error fetching favorite ads:", error);
    } finally {
      setLoading(false);
    }
  };
  

  // Show login prompt if no user
  if (user === null) {
    return (
      <div className="mt-5 container">
        <h3>Please log in to view your favorite ads</h3>
      </div>
    );
  }

  if (loading) {
    return (
      <div className="mt-5 container">
        <p>Loading your favorite ads...</p>
      </div>
    );
  }

  return (
    <div className="mt-5 container">
      {ads.length ? <h3>Favorite Ads</h3> : <h3>No Favorite Ads</h3>}
      <div className="row">
        {ads.map((ad) => (
          <div key={ad.id} className="col-sm-6 col-md-3 mb-3">
            <AdCard ad={ad} />
          </div>
        ))}
      </div>
    </div>
  );
};

export default MyFavorites;