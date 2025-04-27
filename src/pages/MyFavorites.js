import React, { useState, useEffect } from 'react';
import { collection, getDocs, query, where, documentId } from 'firebase/firestore';
import { db, auth } from '../firebaseConfig';
import { onAuthStateChanged } from "firebase/auth";
import AdCard from '../components/AdCard';

const MyFavorites = () => {
  const [ads, setAds] = useState([]);
  const [loading, setLoading] = useState(true);  // Add loading indicator

  const getAds = async (userId) => {
    try {
      const favRef = collection(db, "favorites");
      const q = query(favRef, where("users", "array-contains", userId));
      const favSnap = await getDocs(q);

      const promises = [];

      favSnap.forEach((favDoc) => {
        const adId = favDoc.id;
        const usersData = favDoc.data().users || [];

        if (!adId) return;  // Safeguard

        const adsRef = collection(db, "ads");
        const adQuery = query(adsRef, where(documentId(), "==", adId));
        promises.push({ adQuery, usersCount: usersData.length });
      });

      const adsSnaps = await Promise.all(
        promises.map(({ adQuery }) => getDocs(adQuery))
      );

      const adsList = [];

      adsSnaps.forEach((snap, index) => {
        snap.forEach((doc) => {
          adsList.push({
            ...doc.data(),
            adId: doc.id,
            usersCount: promises[index].usersCount,
          });
        });
      });

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
        getAds(user.uid);
      } else {
        setAds([]);
        setLoading(false);
      }
    });

    return () => unsubscribe();
  }, []);

  if (loading) {
    return <div className="mt-5 container"><h4>Loading...</h4></div>;
  }

  return (
    <div className="mt-5 container">
      {ads.length ? <h3>Favorite Posts</h3> : <h3>No Favorite Posts</h3>}
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
