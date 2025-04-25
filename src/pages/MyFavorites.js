import React, { useState, useEffect } from 'react';
import { collection, getDocs, query, where, doc, getDoc } from 'firebase/firestore';
import { db, auth } from '../firebaseConfig';
import { onAuthStateChanged } from 'firebase/auth';
import AdCard from '../components/AdCard';

const MyFavorites = () => {
  const [ads, setAds] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, (user) => {
      if (user) {
        getAds(user.uid);
      } else {
        // Handle the case when no user is signed in
        setAds([]);
        setLoading(false);
      }
    });

    // Clean up subscription on unmount
    return () => unsubscribe();
  }, []);

  const getAds = async (userId) => {
    try {
      setLoading(true);
      const favRef = collection(db, "favorites");
      const q = query(
        favRef,
        where("users", "array-contains", userId)
      );
      const docSnap = await getDocs(q);
    
      if (docSnap.empty) {
        setAds([]);
        setLoading(false);
        return;
      }

      const fetchedAds = [];
      
      // Use a for...of loop to allow async/await inside the loop
      for (const document of docSnap.docs) {
        try {
          // Get the ad document directly using doc() and getDoc()
          const adDocRef = doc(db, "ads", document.id);
          const adDocSnap = await getDoc(adDocRef);
          
          if (adDocSnap.exists()) {
            fetchedAds.push({
              ...adDocSnap.data(),
              adId: adDocSnap.id,
              usersCount: document.data().users.length,
            });
          }
        } catch (err) {
          console.error(`Error fetching ad ${document.id}:`, err);
        }
      }
    
      setAds(fetchedAds);
    } catch (error) {
      console.error("Error fetching favorites:", error);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="mt-5 container">
      {loading ? (
        <div>Loading favorites...</div>
      ) : (
        <>
          {ads.length ? <h3>Favorite Posts</h3> : <h3>No Favorite Posts</h3>}
          <div className="row">
            {ads.map((ad) => (
              <div key={ad.adId} className="col-sm-6 col-md-3 mb-3">
                <AdCard ad={ad} />
              </div>
            ))}
          </div>
        </>
      )}
    </div>
  );
};

export default MyFavorites;