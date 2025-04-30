// Add this to your UserListings.js component (or where you show user's listings)
// to also display pending listings

import React, { useState, useEffect } from "react";
import { collection, query, where, getDocs, orderBy } from "firebase/firestore";
import { auth, db } from "../firebaseConfig";
import AdCard from "./AdCard";

const UserListings = ({ userId }) => {
  const [ads, setAds] = useState([]);
  const [pendingAds, setPendingAds] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchUserAds = async () => {
      try {
        const userAdsQuery = query(
          collection(db, "ads"),
          where("postedBy", "==", userId),
          orderBy("publishedAt", "desc")
        );
        
        const pendingAdsQuery = query(
          collection(db, "pendingAds"),
          where("postedBy", "==", userId),
          orderBy("createdAt", "desc")
        );

        const [adsSnapshot, pendingSnapshot] = await Promise.all([
          getDocs(userAdsQuery),
          getDocs(pendingAdsQuery)
        ]);
        
        const userAds = [];
        adsSnapshot.forEach((doc) => {
          userAds.push({
            id: doc.id,
            ...doc.data(),
          });
        });
        
        const userPendingAds = [];
        pendingSnapshot.forEach((doc) => {
          userPendingAds.push({
            id: doc.id,
            ...doc.data(),
          });
        });
        
        setAds(userAds);
        setPendingAds(userPendingAds);
        setLoading(false);
      } catch (error) {
        console.error("Error fetching user ads:", error);
        setLoading(false);
      }
    };

    if (userId) {
      fetchUserAds();
    }
  }, [userId]);

  if (loading) {
    return <div>Loading...</div>;
  }

  return (
    <div>
      {pendingAds.length > 0 && (
        <div className="mb-4">
          <h3>Pending Listings</h3>
          <div className="alert alert-info">
            These listings are awaiting admin approval and are not yet visible to other users.
          </div>
          <div className="row">
            {pendingAds.map((ad) => (
              <div className="col-md-4 mb-3" key={ad.id}>
                <div className="card mb-3 shadow-sm">
                  <img
                    src={ad.images?.[0]?.url || "https://placehold.co/600x400?text=No+Image"}
                    className="card-img-top"
                    alt={ad.title || "Ad"}
                    style={{ height: "200px", objectFit: "cover" }}
                  />
                  <div className="card-body">
                    <div className="d-flex justify-content-between align-items-start">
                      <h5 className="card-title">{ad.title || "Untitled"}</h5>
                      <span className="badge bg-warning">Pending</span>
                    </div>
                    <p className="card-text">
                      TK- {Number(ad.price).toLocaleString()}
                    </p>
                    <p className="text-primary small mb-2">
                      Category: {ad.category || "N/A"}
                    </p>
                    <div className="d-flex justify-content-between text-muted small">
                      <span>{ad.location || "Unknown location"}</span>
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      <h3>Active Listings</h3>
      <div className="row">
        {ads.length === 0 ? (
          <div className="col">
            <p>No active listings found.</p>
          </div>
        ) : (
          ads.map((ad) => (
            <div className="col-md-4 mb-3" key={ad.id}>
              <AdCard ad={ad} />
            </div>
          ))
        )}
      </div>
    </div>
  );
};

export default UserListings;