import { useUserStore } from "../store/userStore";

export const fetchUserData = async () => {
  const { setUser, setLoading } = useUserStore.getState();

  try {
    const token = localStorage.getItem("token");
    if (!token) return;

    setLoading(true);

    const res = await fetch(`${import.meta.env.VITE_API_BASE_URL}/api/user/me`, {
      headers: {
        Authorization: `Bearer ${token}`,
      },
    });

    const result = await res.json();

    if (result.success) {
      setUser(result.data);
    }

    return result.data;
  } catch (err) {
    console.error("fetchUserData error:", err);
  } finally {
    setLoading(false);
  }
};



// import { fetchUserData } from "../../services/user.service";

// await fetchUserData();