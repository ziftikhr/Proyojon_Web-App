import React, { useState, useEffect } from 'react';
import { collection, getDocs, query, where, doc, getDoc } from 'firebase/firestore';
import { db, auth } from '../firebaseConfig';
import { onAuthStateChanged } from "firebase/auth";
import AdCard from '../components/AdCard';

const MyFavorites = () => {
  const [ads, setAds] = useState([]);
  const [loading, setLoading] = useState(true);

  const fetchFavoriteAds = async (userId) => {
    try {
      // Get favorites where this user is in the users array
      const favRef = collection(db, "favorites");
      const favQuery = query(favRef, where("users", "array-contains", userId));
      const favSnapshot = await getDocs(favQuery);

      if (favSnapshot.empty) {
        setAds([]);
        setLoading(false);
        return;
      }

      // Each favorite document ID should reference an ad
      const adPromises = [];
      
      favSnapshot.forEach((favDoc) => {
        // Get the ad ID from the document - likely stored as a field
        // If your document ID IS the ad ID, use favDoc.id instead
        const adId = favDoc.id; // This might need to be a field like favDoc.data().adId
        const usersCount = favDoc.data().users?.length || 0;
        
        if (adId) {
          const adsRef = collection(db, "ads");
          const adQuery = query(adsRef, where(doc.id, "==", adId));
          
          const promise = getDocs(adQuery).then(adSnapshot => {
            if (!adSnapshot.empty) {
              const adDoc = adSnapshot.docs[0];
              return {
                ...adDoc.data(),
                adId: adDoc.id,
                usersCount
              };
            }
            return null;
          });
          
          adPromises.push(promise);
        }
      });

      const adsList = (await Promise.all(adPromises)).filter(ad => ad !== null);
      setAds(adsList);
    } catch (error) {
      console.error('Error fetching favorites:', error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, (user) => {
      if (user) {
        fetchFavoriteAds(user.uid);
      } else {
        setAds([]);
        setLoading(false);
      }
    });

    return () => unsubscribe();
  }, []);

  // Let's try a very straightforward approach as an alternative
  const simpleFetchFavorites = async (userId) => {
    try {
      // Get all user's favorites
      const favoritesRef = collection(db, "favorites");
      const favQuery = query(favoritesRef, where("users", "array-contains", userId));
      const favoritesSnapshot = await getDocs(favQuery);
      
      if (favoritesSnapshot.empty) {
        setAds([]);
        return;
      }
      
      // Get all ads in one query
      const adsRef = collection(db, "ads");
      const adsSnapshot = await getDocs(adsRef);
      
      const adsMap = {};
      adsSnapshot.forEach(doc => {
        adsMap[doc.id] = {
          ...doc.data(),
          adId: doc.id
        };
      });
      
      // Match favorites with ads
      const userFavorites = [];
      favoritesSnapshot.forEach(favDoc => {
        const favId = favDoc.id;
        const usersCount = favDoc.data().users?.length || 0;
        
        // If the favorite document ID is the same as the ad ID
        if (adsMap[favId]) {
          userFavorites.push({
            ...adsMap[favId],
            usersCount
          });
        }
      });
      
      setAds(userFavorites);
    } catch (error) {
      console.error('Error in simple fetch:', error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, (user) => {
      if (user) {
        // Try the simple approach instead
        simpleFetchFavorites(user.uid);
      } else {
        setAds([]);
        setLoading(false);
      }
    });

    return () => unsubscribe();
  }, []);

  if (loading) {
    return (
      <div className="mt-5 container">
        <h4>Loading your favorites...</h4>
      </div>
    );
  }

  return (
    <div className="mt-5 container">
      <h3>{ads.length ? "Your Favorite Posts" : "No Favorite Posts Yet"}</h3>
      <div className="row">
        {ads.map((ad) => (
          <div key={ad.adId} className="col-sm-6 col-md-3 mb-3">
            <AdCard ad={ad} />
          </div>
        ))}
      </div>
    </div>
  );
};

export default MyFavorites;