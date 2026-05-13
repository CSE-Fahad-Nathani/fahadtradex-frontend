import { useUserStore } from "../store/userStore";

export const fetchUserData = async () => {
  try {
    const token = localStorage.getItem("token");
    if (!token) return;

    const res = await fetch(`${import.meta.env.VITE_API_BASE_URL}/api/user/me`, {
      headers: {
        Authorization: `Bearer ${token}`,
      },
    });

    const result = await res.json();

    if (result.success) {
      useUserStore.getState().setUser(result.data);
    }

    return result.data;
  } catch (err) {
    console.error("fetchUserData error:", err);
  }
};



// import { fetchUserData } from "../../services/user.service";

// await fetchUserData();