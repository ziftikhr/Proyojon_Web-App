import React, { useState, useEffect } from "react";
import { collection, query, getDocs, getCountFromServer } from "firebase/firestore";
import { db } from "../../firebaseConfig";
import { Link } from "react-router-dom";

const AdminDashboard = () => {
  const [stats, setStats] = useState({
    totalUsers: 0,
    totalAds: 0,
    totalAdmins: 0,
    pendingAds: 0,
    loading: true
  });

  useEffect(() => {
    const fetchStats = async () => {
      try {
        const usersRef = collection(db, "users");
        const usersSnapshot = await getCountFromServer(usersRef);
        const totalUsers = usersSnapshot.data().count;
        
        const adminsQuery = query(collection(db, "users"));
        const adminsSnapshot = await getDocs(adminsQuery);
        const admins = adminsSnapshot.docs.filter(doc => doc.data().role === "admin");
        const totalAdmins = admins.length;
        
        const adsRef = collection(db, "ads");
        const adsSnapshot = await getCountFromServer(adsRef);
        const totalAds = adsSnapshot.data().count;
        
        const pendingAdsRef = collection(db, "pendingAds");
        const pendingAdsSnapshot = await getCountFromServer(pendingAdsRef);
        const pendingAds = pendingAdsSnapshot.data().count;
        
        setStats({
          totalUsers: totalUsers - totalAdmins, 
          totalAds,
          totalAdmins,
          pendingAds,
          loading: false
        });
      } catch (error) {
        console.error("Error fetching stats:", error);
        setStats(prev => ({ ...prev, loading: false }));
      }
    };

    fetchStats();
  }, []);

  if (stats.loading) {
    return (
      <div className="container mt-5">
        <h3>Loading dashboard data...</h3>
      </div>
    );
  }

  return (
    <div className="container mt-5">
      <h2 className="mb-4">Admin Dashboard</h2>
      
      <div className="row">
        <div className="col-md-3 mb-3">
          <div className="card text-center">
            <div className="card-body">
              <h5 className="card-title" style={{textAlign: "center"}}>Total Users</h5>
              <h2 className="card-text" style={{fontSize: "30px"}}>{stats.totalUsers}</h2>
            </div>
          </div>
        </div>
        
        <div className="col-md-3 mb-3">
          <div className="card text-center">
            <div className="card-body">
              <h5 className="card-title" style={{textAlign: "center"}}>Total Admins</h5>
              <h2 className="card-text" style={{fontSize: "30px"}}>{stats.totalAdmins}</h2>
            </div>
          </div>
        </div>
        
        <div className="col-md-3 mb-3">
          <div className="card text-center">
            <div className="card-body">
              <h5 className="card-title" style={{textAlign: "center"}}>Active Listings</h5>
              <h2 className="card-text" style={{fontSize: "30px"}}>{stats.totalAds}</h2>
            </div>
          </div>
        </div>
        
        <div className="col-md-3 mb-3">
          <div className="card text-center">
            <div className="card-body">
              <h5 className="card-title" style={{textAlign: "center"}}>Pending Listings</h5>
              <h2 className="card-text" style={{fontSize: "30px"}}>{stats.pendingAds}</h2>
            </div>
          </div>
        </div>
      </div>
      
      <div className="row mt-4">
        <div className="col-12">
          <div className="card">
            <div className="card-body">
              <h5 className="card-title">Quick Actions</h5>
              <div className="d-flex flex-wrap gap-2">
                <Link to="/admin/pending" className="btn btn-outline-primary">
                  Review Pending Listings ({stats.pendingAds})
                </Link>
                <Link to="/admin/users" className="btn btn-outline-secondary">
                  Manage Users
                </Link>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default AdminDashboard;