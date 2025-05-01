import React, { useState, useEffect } from "react";
import { collection, query, getDocs, doc, updateDoc } from "firebase/firestore";
import { db } from "../../firebaseConfig";
import { Link } from "react-router-dom";
import moment from "moment";

const UserManagement = () => {
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");

  useEffect(() => {
    const fetchUsers = async () => {
      try {
        const q = query(collection(db, "users"));
        const querySnapshot = await getDocs(q);
        
        const usersList = [];
        querySnapshot.forEach((doc) => {
          const userData = doc.data();
          if (userData.role !== "admin") {
            usersList.push({
              id: doc.id,
              ...userData
            });
          }
        });
        
        setUsers(usersList);
        setLoading(false);
      } catch (error) {
        console.error("Error fetching users:", error);
        setLoading(false);
      }
    };

    fetchUsers();
  }, []);

  const handleAdminStatusChange = async (userId, makeAdmin) => {
    try {
      await updateDoc(doc(db, "users", userId), {
        role: makeAdmin ? "admin" : "user"
      });
      
      setUsers(users.map(user => 
        user.id === userId ? { ...user, role: makeAdmin ? "admin" : "user" } : user
      ));
      
      if (makeAdmin) {
        setUsers(users.filter(user => user.id !== userId));
      }
    } catch (error) {
      console.error("Error updating user role:", error);
    }
  };

  const filteredUsers = searchTerm.trim() === "" 
    ? users 
    : users.filter(user => 
        user.name?.toLowerCase().includes(searchTerm.toLowerCase()) || 
        user.email?.toLowerCase().includes(searchTerm.toLowerCase())
      );

  if (loading) {
    return (
      <div className="container mt-5">
        <h3>Loading users...</h3>
      </div>
    );
  }

  return (
    <div className="container mt-5">
      <h2 className="mb-4">User Management</h2>
      
      <div className="mb-3">
        <input
          type="text"
          className="form-control"
          placeholder="Search users by name or email"
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
        />
      </div>
      
      <div className="table-responsive">
        <table className="table table-striped">
          <thead>
            <tr>
              <th>Name</th>
              <th>Email</th>
              <th>Joined</th>
              <th>Status</th>
              <th>Actions</th>
            </tr>
          </thead>
          <tbody>
            {filteredUsers.length > 0 ? (
              filteredUsers.map((user) => (
                <tr key={user.id}>
                  <td>{user.name}</td>
                  <td>{user.email}</td>
                  <td>
                    {user.createdAt && moment(user.createdAt.toDate()).format("MMM DD, YYYY")}
                  </td>
                  <td>
                    <span className={`badge ${user.isOnline ? "bg-success" : "bg-secondary"}`}>
                      {user.isOnline ? "Online" : "Offline"}
                    </span>
                  </td>
                  <td>
                    <div className="btn-group" role="group">
                      <Link to={`/admin/users/${user.id}/ads`} className="btn btn-info btn-sm">
                        View Ads
                      </Link>
                      <button
                        className="btn btn-warning btn-sm"
                        onClick={() => handleAdminStatusChange(user.id, true)}
                      >
                        Make Admin
                      </button>
                    </div>
                  </td>
                </tr>
              ))
            ) : (
              <tr>
                <td colSpan="5" className="text-center">
                  No users found
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
};

export default UserManagement;