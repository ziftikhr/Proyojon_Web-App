import React, { useState, useEffect } from "react";
import { useParams, Link } from "react-router-dom";
import { collection, query, where, orderBy, getDocs, doc, getDoc, deleteDoc } from "firebase/firestore";
import { db, storage } from "../../firebaseConfig";
import { deleteObject, ref } from "firebase/storage";
import AdCard from "../../components/AdCard";

const UserAds = () => {
  const { userId } = useParams();
  const [user, setUser] = useState(null);
  const [ads, setAds] = useState([]);
  const [loading, setLoading] = useState(true);
  const [deleteStatus, setDeleteStatus] = useState({ isDeleting: false, message: "" });

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
    if (window.confirm("Are you sure you want to delete this ad? This will permanently remove it from the system.")) {
      try {
        setDeleteStatus({ isDeleting: true, message: "Deleting ad..." });
        
        // Get the ad data first to access images
        const adDoc = await getDoc(doc(db, "ads", adId));
        if (adDoc.exists()) {
          const adData = adDoc.data();
          
          // 1. Delete all images from storage
          if (adData.images && adData.images.length > 0) {
            for (const image of adData.images) {
              if (image.path) {
                const imgRef = ref(storage, image.path);
                try {
                  await deleteObject(imgRef);
                } catch (imgError) {
                  console.error("Error deleting image:", imgError);
                  // Continue even if image deletion fails
                }
              }
            }
          }
        }
        
        // 2. Delete from ads collection
        await deleteDoc(doc(db, "ads", adId));
        
        // 3. Delete from favorites collection (if exists)
        try {
          const favoritesRef = collection(db, "favorites");
          const favoritesQuery = query(favoritesRef, where("adId", "==", adId));
          const favoritesSnapshot = await getDocs(favoritesQuery);
          
          favoritesSnapshot.forEach(async (doc) => {
            await deleteDoc(doc.ref);
          });
        } catch (error) {
          console.log("Error deleting favorites:", error);
        }
        
        // 4. Delete any associated messages/chatrooms
        const messagesRef = collection(db, "messages");
        const messagesQuery = query(messagesRef, where("ad", "==", adId));
        const messagesSnapshot = await getDocs(messagesQuery);
        
        messagesSnapshot.forEach(async (doc) => {
          await deleteDoc(doc.ref);
        });
        
        // 5. Update local state
        setAds(ads.filter(ad => ad.id !== adId));
        setDeleteStatus({ 
          isDeleting: false, 
          message: "Ad successfully deleted from all locations" 
        });
        
        // Clear success message after 3 seconds
        setTimeout(() => {
          setDeleteStatus({ isDeleting: false, message: "" });
        }, 3000);
        
      } catch (error) {
        console.error("Error deleting ad:", error);
        setDeleteStatus({ 
          isDeleting: false, 
          message: `Error: ${error.message}` 
        });
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

      {deleteStatus.message && (
        <div className={`alert ${deleteStatus.message.includes("Error") ? "alert-danger" : "alert-success"}`}>
          {deleteStatus.message}
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
              <div className="card h-100">
                <img 
                  src={ad.images && ad.images.length > 0 ? ad.images[0].url : "https://via.placeholder.com/150"} 
                  className="card-img-top" 
                  alt={ad.title}
                  style={{ height: "200px", objectFit: "cover" }}
                />
                <div className="card-body">
                  <h5 className="card-title">{ad.title}</h5>
                  <p className="card-text">TK- {Number(ad.price).toLocaleString()}</p>
                  <p className="card-text">
                    <small className="text-muted">
                      {ad.location} - {ad.publishedAt && new Date(ad.publishedAt.seconds * 1000).toLocaleDateString()}
                    </small>
                  </p>
                  
                  <div className="d-flex justify-content-between">
                    <Link to={`/ad/${ad.id}`} className="btn btn-primary btn-sm">
                      View Ad
                    </Link>
                    <button 
                      className="btn btn-danger btn-sm"
                      onClick={() => handleDeleteAd(ad.id)}
                      disabled={deleteStatus.isDeleting}
                    >
                      {deleteStatus.isDeleting ? "Deleting..." : "Delete Ad"}
                    </button>
                  </div>
                </div>
                {/* <div className="card-footer">
                  <span className={`badge ${ad.isSold ? "bg-warning" : "bg-success"}`}>
                    {ad.isSold ? "Booked" : "Available"}
                  </span>
                </div> */}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

export default UserAds;