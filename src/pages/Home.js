import React, { useState, useEffect } from "react";
import { collection, orderBy, query, getDocs, limit } from "firebase/firestore";
import { db } from "../firebaseConfig";
import { Link } from "react-router-dom";
import AdCard from "../components/AdCard";

const Home = () => {
  const [ads, setAds] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState("");

  const categories = [
    { value: "all", label: "All", image: "/images/all.png" },
    { value: "stationaries", label: "Stationaries", image: "/images/stationaries.png" },
    { value: "books", label: "Books", image: "/images/books.png" },
    { value: "clothes", label: "Clothes", image: "/images/clothes.png" },
    { value: "electronics", label: "Electronics", image: "/images/electronics.jpeg" },
    { value: "furniture", label: "Furniture", image: "/images/furniture.png" },
    { value: "vehicles", label: "Vehicles & Parts", image: "/images/Vehicles.png" },
    { value: "games", label: "Games & Hobbies", image: "/images/Controller.png" },
    { value: "miscellaneous", label: "Miscellaneous", image: "/images/misc.png" },
  ];

  const getAds = async () => {
    try {
      const adsRef = collection(db, "ads");
      const q = query(adsRef, orderBy("publishedAt", "desc"), limit(8));
      const adDocs = await getDocs(q);
      let fetchedAds = [];
      adDocs.forEach((doc) => {
        const adData = doc.data();
        fetchedAds.push({ ...adData, id: doc.id });
      });
      setAds(fetchedAds);
    } catch (error) {
      console.error("Error fetching ads:", error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    getAds();
  }, []);

  return (
    <div className="container my-5">
      <div className="row justify-content-center mb-4">
        <div className="col-md-8 position-relative">
          <div className="input-group">
            <span className="input-group-text bg-white border-end-0">
              <i className="bi bi-search"></i>
            </span>
            <input
              type="search"
              className="form-control border-start-0"
              placeholder="What are you looking for?"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
            />
          </div>
        </div>
      </div>

      {/* Categories */}
      <div className="mb-5">
        <h5 className="text-center mb-3">Explore All Categories</h5>
        <div className="d-flex justify-content-center">
          <div className="d-flex flex-row overflow-auto pb-2" style={{ maxWidth: "100%" }}>
            {categories.map((category) => (
              <div key={category.value} className="text-center mx-3" style={{ minWidth: "60px" }}>
                <Link to={`/category/${category.value}`} className="text-decoration-none">
                  <div className="rounded-circle border d-flex align-items-center justify-content-center mx-auto" style={{ width: "60px", height: "60px" }}>
                    <img
                      src={category.image}
                      alt={category.label}
                      style={{ width: "32px", height: "32px", objectFit: "contain" }}
                      onError={(e) => {
                        console.log(`Failed to load image for ${category.label}`);
                        e.target.src = "/images/placeholder.png";
                      }}
                    />
                  </div>
                  <div className="small mt-1 text-dark">{category.label}</div>
                </Link>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Recent Posts */}
      <div className="mb-5">
        <h5 className="mb-3 text-center">Recent Posts</h5>
        {loading ? (
          <div className="d-flex justify-content-center align-items-center" style={{ height: "200px" }}>
            <div className="spinner-border" role="status">
              <span className="visually-hidden">Loading...</span>
            </div>
          </div>
        ) : ads.length === 0 ? (
          <div className="text-center py-5">
            <p>No ads available at the moment.</p>
          </div>
        ) : (
          <div className="row g-3 justify-content-center">
            {ads.map((ad) => (
              <div key={ad.id} className="col-6 col-md-4 col-lg-3">
                <AdCard ad={ad} />
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};

export default Home;
