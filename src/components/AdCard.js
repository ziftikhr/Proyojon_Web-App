import React, { useState, useEffect } from "react";
import { Link } from "react-router-dom";
import { FaHeart } from "react-icons/fa";
import { arrayRemove, arrayUnion, doc, getDoc, setDoc } from "firebase/firestore";
import { auth, db } from "../firebaseConfig";
import Moment from "react-moment";

const AdCard = ({ ad }) => {
  const [isFavorite, setIsFavorite] = useState(false);

  useEffect(() => {
    const checkIfFavorite = async () => {
      if (!auth.currentUser || !ad?.id) return;

      try {
        const favoriteRef = doc(db, "favorites", ad.id);
        const favoriteSnap = await getDoc(favoriteRef);

        if (favoriteSnap.exists()) {
          const favoriteData = favoriteSnap.data();
          setIsFavorite(favoriteData.users?.includes(auth.currentUser.uid));
        }
      } catch (error) {
        console.error("Error checking favorite status:", error);
      }
    };

    checkIfFavorite();
  }, [ad]);

  const toggleFavorite = async () => {
    if (!auth.currentUser || !ad?.id) {
      console.error("Missing required data for toggling favorite");
      return;
    }

    try {
      const uid = auth.currentUser.uid;
      const id = ad.id;
      const favoriteRef = doc(db, "favorites", id);

      await setDoc(
        favoriteRef,
        {
          users: isFavorite ? arrayRemove(uid) : arrayUnion(uid),
        },
        { merge: true }
      );

      setIsFavorite(!isFavorite);
    } catch (error) {
      console.error("Error toggling favorite:", error);
    }
  };

  if (!ad || !ad.id) {
    return <div className="card">Loading ad data...</div>;
  }

  return (
    <div className="card mb-3 shadow-sm">
      <Link to={`/${ad.category?.toLowerCase()}/${ad.id}`}>
        <img
          src={ad.images?.[0]?.url || "https://placehold.co/600x400?text=No+Image"}
          className="card-img-top"
          alt={ad.title || "Ad"}
          style={{ height: "200px", objectFit: "cover" }}
        />
      </Link>
      <div className="card-body">
        <div className="d-flex justify-content-between align-items-start">
          <h5 className="card-title">{ad.title || "Untitled"}</h5>
          {auth.currentUser && (
            <FaHeart
              size={22}
              className={`cursor-pointer ${isFavorite ? "text-danger" : "text-muted"}`}
              onClick={toggleFavorite}
            />
          )}
        </div>
        <p className="card-text">
            TK- {Number(ad.price).toLocaleString()}
        </p>
        <p className="text-primary small mb-2">
            Category: {ad.category || "N/A"}
        </p>
        <div className="d-flex justify-content-between text-muted small">
          <span>{ad.location || "Unknown location"}</span>
          <span>
            {ad.publishedAt ? (
              <Moment fromNow>{ad.publishedAt.toDate()}</Moment>
            ) : (
              "Unknown date"
            )}
          </span>
        </div>
      </div>
    </div>
  );
};

export default AdCard;
