import React, { useState, useEffect } from "react";
import { useParams, Link } from "react-router-dom";
import { collection, query, where, orderBy, getDocs, doc, getDoc, deleteDoc } from "firebase/firestore";
import { db } from "../../firebaseConfig";
import AdCard from "../../components/AdCard";

const UserAds = () => {
  const { userId } = useParams();
  const [user, setUser] = useState(null);
  const [ads, setAds] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchUserAndAds = async () => {
      try {
        // Fetch user data
        const userDoc = await getDoc(doc(db, "users", userId));
        if (userDoc.exists()) {
          setUser(userDoc.data());
        }

        // Fetch user's ads
        const adsRef = collection(db, "ads");
        const q = query(
          adsRef,
          where("postedBy", "==", userId),
          orderBy("publishedAt", "desc")
        );
        
        const querySnapshot = await getDocs(q);
        const adsList = [];
        querySnapshot.forEach((doc) => {
          adsList.push({ ...doc.data(), id: doc.id });
        });
        
        setAds(adsList);
        setLoading(false);
      } catch (error) {
        console.error("Error fetching user ads:", error);
        setLoading(false);
      }
    };

    fetchUserAndAds();
  }, [userId]);

  const handleDeleteAd = async (adId) => {
    if (window.confirm("Are you sure you want to delete this ad?")) {
      try {
        // Delete from ads collection
        await deleteDoc(doc(db, "ads", adId));
        
        // Also delete from favorites collection if it exists
        try {
          await deleteDoc(doc(db, "favorites", adId));
        } catch (error) {
          console.log("No favorites entry to delete or error:", error);
        }
        
        // Update local state
        setAds(ads.filter(ad => ad.id !== adId));
      } catch (error) {
        console.error("Error deleting ad:", error);
      }
    }
  };

  if (loading) {
    return (
      <div className="container mt-5">
        <h3>Loading...</h3>
      </div>
    );
  }

  return (
    <div className="container mt-5">
      <div className="d-flex justify-content-between align-items-center mb-4">
        <h2>
          {user ? `${user.name}'s Listings` : "User Listings"}
        </h2>
        <Link to="/admin/users" className="btn btn-secondary btn-sm">
          Back to Users
        </Link>
      </div>

      {user && (
        <div className="user-info mb-4">
          <p><strong>Email:</strong> {user.email}</p>
          <p>
            <strong>Status:</strong> 
            <span className={`badge ms-2 ${user.isOnline ? "bg-success" : "bg-secondary"}`}>
              {user.isOnline ? "Online" : "Offline"}
            </span>
          </p>
        </div>
      )}

      {ads.length === 0 ? (
        <div className="alert alert-info">
          This user has no listings.
        </div>
      ) : (
        <div className="row">
          {ads.map((ad) => (
            <div key={ad.id} className="col-md-4 mb-4">
              <div className="position-relative">
                <AdCard ad={ad} />
                <button 
                  className="btn btn-danger btn-sm position-absolute top-0 end-0 m-2"
                  onClick={() => handleDeleteAd(ad.id)}
                >
                  Delete
                </button>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

export default UserAds;