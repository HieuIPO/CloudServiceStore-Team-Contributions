const BASE_URL = "https://localhost:7225/api/v1";

export const fetchCategories = async () => {
    try {
        const res = await fetch(`${BASE_URL}/ServiceCategories/all`);
        if (!res.ok) return [];
        return await res.json();
    } catch (err) {
        console.error("Fetch categories error:", err);
        return [];
    }
};

export const fetchPlans = async () => {
    try {
        const res = await fetch(`${BASE_URL}/ServicePlans?pageSize=100`);
        if (!res.ok) return [];
        const data = await res.json();
        return data.items || [];
    } catch (err) {
        console.error("Fetch plans error:", err);
        return [];
    }
};

export const fetchPromotions = async () => {
    try {
        const res = await fetch(`${BASE_URL}/Promotions?pageSize=100`);
        if (!res.ok) return [];
        const data = await res.json();
        return data.items || [];
    } catch (err) {
        console.error("Fetch promotions error:", err);
        return [];
    }
};
