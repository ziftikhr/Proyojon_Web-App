import React, { useState, useEffect } from "react";
import { 
  collection, query, getDocs, doc, deleteDoc, 
  setDoc, addDoc, Timestamp, orderBy 
} from "firebase/firestore";
import { deleteObject, ref } from "firebase/storage";
import { db, storage } from "../../firebaseConfig";
import Moment from "react-moment";
import { Link } from "react-router-dom";

const PendingListings = () => {
  const [pendingAds, setPendingAds] = useState([]);
  const [loading, setLoading] = useState(true);
  const [actionLoading, setActionLoading] = useState({});

  useEffect(() => {
    fetchPendingAds();
  }, []);

  const fetchPendingAds = async () => {
    try {
      const pendingAdsQuery = query(
        collection(db, "pendingAds"),
        orderBy("createdAt", "desc")
      );
      const querySnapshot = await getDocs(pendingAdsQuery);
      
      const ads = [];
      querySnapshot.forEach((doc) => {
        ads.push({
          id: doc.id,
          ...doc.data()
        });
      });
      
      setPendingAds(ads);
      setLoading(false);
    } catch (error) {
      console.error("Error fetching pending ads:", error);
      setLoading(false);
    }
  };

  const approveListing = async (ad) => {
    setActionLoading(prev => ({ ...prev, [ad.id]: true }));
    
    try {
      // Add to ads collection
      const result = await addDoc(collection(db, "ads"), {
        images: ad.images,
        title: ad.title,
        category: ad.category,
        price: ad.price,
        location: ad.location,
        contactnum: ad.contactnum,
        description: ad.description,
        isSold: false,
        publishedAt: Timestamp.fromDate(new Date()),
        postedBy: ad.postedBy,
      });

      // Create favorites entry for the new ad
      await setDoc(doc(db, 'favorites', result.id), {
        users: []
      });

      // Delete from pendingAds
      await deleteDoc(doc(db, "pendingAds", ad.id));
      
      // Update local state
      setPendingAds(pendingAds.filter(item => item.id !== ad.id));
      setActionLoading(prev => ({ ...prev, [ad.id]: false }));
    } catch (error) {
      console.error("Error approving listing:", error);
      setActionLoading(prev => ({ ...prev, [ad.id]: false }));
    }
  };

  const declineListing = async (ad) => {
    setActionLoading(prev => ({ ...prev, [ad.id]: true }));
    
    try {
      // Delete images from storage
      for (const image of ad.images) {
        const imgRef = ref(storage, image.path);
        await deleteObject(imgRef);
      }
      
      // Delete from pendingAds collection
      await deleteDoc(doc(db, "pendingAds", ad.id));
      
      // Update local state
      setPendingAds(pendingAds.filter(item => item.id !== ad.id));
      setActionLoading(prev => ({ ...prev, [ad.id]: false }));
    } catch (error) {
      console.error("Error declining listing:", error);
      setActionLoading(prev => ({ ...prev, [ad.id]: false }));
    }
  };

  if (loading) {
    return (
      <div className="container mt-5">
        <h3>Loading pending listings...</h3>
      </div>
    );
  }

  return (
    <div className="container mt-5">
      <h2 className="mb-4">Pending Listings</h2>
      
      {pendingAds.length === 0 ? (
        <div className="alert alert-info">No pending listings to review.</div>
      ) : (
        <div className="table-responsive">
          <table className="table table-striped">
            <thead>
              <tr>
                <th>Image</th>
                <th>Title</th>
                <th>Category</th>
                <th>Price</th>
                <th>Location</th>
                <th>Date</th>
                <th>Actions</th>
              </tr>
            </thead>
            <tbody>
              {pendingAds.map((ad) => (
                <tr key={ad.id}>
                  <td>
                    <img 
                      src={ad.images?.[0]?.url || "https://placehold.co/100x100?text=No+Image"} 
                      alt={ad.title} 
                      style={{ width: "60px", height: "60px", objectFit: "cover" }} 
                    />
                  </td>
                  <td>{ad.title}</td>
                  <td>{ad.category}</td>
                  <td>TK- {Number(ad.price).toLocaleString()}</td>
                  <td>{ad.location}</td>
                  <td>
                    {ad.createdAt && (
                      <Moment fromNow>{ad.createdAt.toDate()}</Moment>
                    )}
                  </td>
                  <td>
                    <button 
                      className="btn btn-primary btn-sm me-2" 
                      onClick={() => approveListing(ad)}
                      disabled={actionLoading[ad.id]}
                    >
                      {actionLoading[ad.id] ? "Processing..." : "Approve"}
                    </button>
                    <button 
                      className="btn btn-danger btn-sm" 
                      onClick={() => declineListing(ad)}
                      disabled={actionLoading[ad.id]}
                    >
                      {actionLoading[ad.id] ? "Processing..." : "Decline"}
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
      
      <div className="mt-3">
        <Link to="/admin" className="btn btn-secondary">
          Back to Dashboard
        </Link>
      </div>
    </div>
  );
};

export default PendingListings;