import React, { useState, useEffect } from "react";
import { collection, query, getDocs, getCountFromServer } from "firebase/firestore";
import { db } from "../../firebaseConfig";
import { Link } from "react-router-dom";

const AdminDashboard = () => {
  const [stats, setStats] = useState({
    totalUsers: 0,
    totalAds: 0,
    totalAdmins: 0,
    loading: true
  });

  useEffect(() => {
    const fetchStats = async () => {
      try {
        // Get users count
        const usersRef = collection(db, "users");
        const usersSnapshot = await getCountFromServer(usersRef);
        const totalUsers = usersSnapshot.data().count;
        
        // Get admins count
        const adminsQuery = query(collection(db, "users"));
        const adminsSnapshot = await getDocs(adminsQuery);
        const admins = adminsSnapshot.docs.filter(doc => doc.data().role === "admin");
        const totalAdmins = admins.length;
        
        // Get ads count
        const adsRef = collection(db, "ads");
        const adsSnapshot = await getCountFromServer(adsRef);
        const totalAds = adsSnapshot.data().count;
        
        setStats({
          totalUsers: totalUsers - totalAdmins, // Regular users (excluding admins)
          totalAds,
          totalAdmins,
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
        <div className="col-md-4 mb-3">
          <div className="card text-center">
            <div className="card-body">
              <h5 className="card-title">Total Users</h5>
              <h2 className="card-text">{stats.totalUsers}</h2>
              <Link to="/admin/users" className="btn btn-primary">
                Manage Users
              </Link>
            </div>
          </div>
        </div>
        
        <div className="col-md-4 mb-3">
          <div className="card text-center">
            <div className="card-body">
              <h5 className="card-title">Total Admins</h5>
              <h2 className="card-text">{stats.totalAdmins}</h2>
            </div>
          </div>
        </div>
        
        <div className="col-md-4 mb-3">
          <div className="card text-center">
            <div className="card-body">
              <h5 className="card-title">Total Listings</h5>
              <h2 className="card-text">{stats.totalAds}</h2>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default AdminDashboard;