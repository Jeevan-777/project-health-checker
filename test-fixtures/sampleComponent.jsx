import axios from "axios";
import React, { useEffect, useState } from "react";

function UserList() {
  const [users, setUsers] = useState([]);

  useEffect(() => {
    axios.get("/users").then((res) => {
      setUsers(res.data);
    });
  }, []);

  const createUser = () => {
    axios.post("/users", { name: "test" });
  };

  const deleteUser = (id) => {
    axios.delete("/users/123");
  };

  const fetchSomething = () => {
    fetch("/api/products");
  };

  const getUserById = (userId) => {
    axios.get(`/users/${userId}`);
  };

  return <div>User List</div>;
}

export default UserList;
