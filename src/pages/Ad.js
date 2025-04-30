import { deleteDoc, doc, getDoc, setDoc } from "firebase/firestore";
import { deleteObject, ref } from "firebase/storage";
import React, { useEffect, useState } from "react";
import { FaTrashAlt, FaUserCircle } from "react-icons/fa";
import { FiPhoneCall } from "react-icons/fi";
import Moment from "react-moment";
import { Link, useLocation, useNavigate, useParams } from "react-router-dom";
import { auth, db, storage } from "../firebaseConfig";

const Ad = () => {
  const { id } = useParams();
  const location = useLocation();
  const navigate = useNavigate();
  const [ad, setAd] = useState();
  const [idx, setIdx] = useState(0);
  const [seller, setSeller] = useState();
  const [showNumber, setShowNumber] = useState(false);

  const getAd = async () => {
    try {
      const docRef = doc(db, "ads", id);
      const docSnap = await getDoc(docRef);
      if (docSnap.exists()) {
        setAd(docSnap.data());

        const sellerRef = doc(db, "users", docSnap.data().postedBy);
        const sellerSnap = await getDoc(sellerRef);

        if (sellerSnap.exists()) {
          setSeller(sellerSnap.data());
        }
      }
    } catch (error) {
      console.error("Error fetching ad:", error);
    }
  };

  useEffect(() => {
    getAd();
  }, [id]);

  const deleteAd = async () => {
    const confirm = window.confirm(`Delete ${ad.title}?`);
    if (confirm) {
      try {
        // Delete images
        for (const image of ad.images) {
          const imgRef = ref(storage, image.path);
          await deleteObject(imgRef);
        }
        // Delete ad doc from Firestore
        await deleteDoc(doc(db, "ads", id));
        // Navigate to seller profile
        navigate(`/profile/${auth.currentUser.uid}`);
      } catch (error) {
        console.error("Error deleting ad:", error);
      }
    }
  };

  const toggleAdStatus = async () => {
    try {
      const confirm = window.confirm(
        `Mark this ad as ${ad.isSold ? "available" : "booked"}?`
      );
      if (confirm) {
        await setDoc(
          doc(db, "ads", id),
          { isSold: !ad.isSold },
          { merge: true }
        );
        setAd((prev) => ({ ...prev, isSold: !prev.isSold }));
      }
    } catch (error) {
      console.error("Error updating ad status:", error);
    }
  };

  const createChatroom = async () => {
    const loggedInUser = auth.currentUser.uid;
    const chatId =
      loggedInUser > ad.postedBy
        ? `${loggedInUser}.${ad.postedBy}.${id}`
        : `${ad.postedBy}.${loggedInUser}.${id}`;

    await setDoc(doc(db, "messages", chatId), {
      ad: id,
      users: [loggedInUser, ad.postedBy],
    });

    navigate("/chat", { state: { ad } });
  };

  return ad ? (
    <div className="mt-5 container">
      <div className="row">
        <div id="carouselExample" className="carousel slide col-md-8 position-relative">
          <div className="carousel-inner">
            {ad.images.map((image, i) => (
              <div
                className={`carousel-item ${idx === i ? "active" : ""}`}
                key={i}
              >
                <img
                  src={image.url}
                  className="d-block w-100"
                  alt={ad.title}
                  style={{ height: "500px" }}
                />

                <button
                  className="carousel-control-prev"
                  type="button"
                  data-bs-target="#carouselExample"
                  data-bs-slide="prev"
                  onClick={() => setIdx(i)}
                >
                  <span
                    className="carousel-control-prev-icon"
                    aria-hidden="true"
                  ></span>
                  <span className="visually-hidden">Previous</span>
                </button>
                <button
                  className="carousel-control-next"
                  type="button"
                  data-bs-target="#carouselExample"
                  data-bs-slide="next"
                  onClick={() => setIdx(i)}
                >
                  <span
                    className="carousel-control-next-icon"
                    aria-hidden="true"
                  ></span>
                  <span className="visually-hidden">Next</span>
                </button>
              </div>
            ))}
          </div>
        </div>
        <div className="col-md-4">
          <div className="card">
            <div className="card-body">
              <div className="d-flex justify-content-between align-items-center">
                <h5 className="card-subtitle mb-2">{ad.title}</h5>
                <h6 className="card-subtitle mb-2">
                TK- {Number(ad.price).toLocaleString()}
                </h6>
              </div>
              <div className="d-flex justify-content-between">
                <p className="card-text">
                  {ad.location} -{" "}
                  <small>
                    <Moment fromNow>{ad.publishedAt.toDate()}</Moment>
                  </small>
                </p>

                {ad.postedBy === auth.currentUser?.uid && (
                  <div className="d-flex align-items-center">
                    <button
                      className={`btn ${ad.isSold ? "btn-warning" : "btn-success"} btn-sm me-2`}
                      onClick={toggleAdStatus}
                    >
                      {ad.isSold ? "Unmark as Booked" : "Mark as Booked"}
                    </button>
                    <FaTrashAlt size={20} className="text-danger" onClick={deleteAd} />
                  </div>
                )}
              </div>
            </div>
          </div>
          <div className="card mt-3">
            <div className="card-body">
              <h5 className="card-title">Owner's Description</h5>
              <Link to={`/profile/${ad.postedBy}`}>
                <div className="d-flex align-items-center">
                  {seller?.photoUrl ? (
                    <img
                      src={seller.photoUrl}
                      alt={seller.name}
                      style={{
                        width: "50px",
                        height: "50px",
                        borderRadius: "50%",
                        marginRight: "10px",
                      }}
                    />
                  ) : (
                    <FaUserCircle size={30} className="me-2" />
                  )}
                  <h6>{seller?.name}</h6>
                </div>
              </Link>
            </div>
            <div>
              {auth.currentUser ? (
                <div className="text-center">
                  {showNumber ? (
                    <p>
                      <FiPhoneCall size={20} /> Contact Number: {ad.contactnum}
                    </p>
                  ) : (
                    <button
                      className="btn btn-secondary btn-sm mb-3"
                      onClick={() => setShowNumber(true)}
                    >
                      Show Contact Info
                    </button>
                  )}
                  <br />
                  {ad.postedBy !== auth.currentUser?.uid && (
                    <button
                      className="btn btn-secondary btn-sm mb-3"
                      onClick={createChatroom}
                    >
                      Chat With Donor
                    </button>
                  )}
                </div>
              ) : (
                <p className="text-center">
                  <Link
                    to="/auth/login"
                    state={{ from: location }}
                    className="text-primary"
                  >
                    Login
                  </Link>{" "}
                  to see contact info
                </p>
              )}
            </div>
          </div>
        </div>
      </div>
      <div className="mt-5">
        <h3>Item Description & Address</h3>
        <p>{ad.description}</p>
      </div>
    </div>
  ) : null;
};

export default Ad;