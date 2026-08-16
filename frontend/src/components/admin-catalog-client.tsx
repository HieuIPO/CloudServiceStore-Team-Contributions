"use client";

import { useEffect, useState } from "react";
import { fetchCategories, fetchPlans } from "@/lib/api";

export default function AdminCatalogClient() {
    const [categories, setCategories] = useState<any[]>([]);
    const [plans, setPlans] = useState<any[]>([]);

    useEffect(() => {
        const load = async () => {
            const cats = await fetchCategories();
            const plns = await fetchPlans();
            setCategories(cats);
            setPlans(plns);
        };
        load();
    }, []);

    return (
        <div className="bg-white p-6 rounded-lg shadow-sm">
            <h2 className="text-xl font-semibold mb-4">Service Categories</h2>
            {categories.length === 0 ? (
                <p className="text-gray-500">No categories found.</p>
            ) : (
                <ul className="space-y-2">
                    {categories.map((c: any) => (
                        <li key={c.id} className="p-3 border rounded">
                            {c.name}
                        </li>
                    ))}
                </ul>
            )}

            <h2 className="text-xl font-semibold mb-4 mt-8">Service Plans</h2>
            {plans.length === 0 ? (
                <p className="text-gray-500">No plans found.</p>
            ) : (
                <ul className="space-y-2">
                    {plans.map((p: any) => (
                        <li key={p.id} className="p-3 border rounded flex justify-between">
                            <span>{p.name} - {p.description}</span>
                            <span className={p.isActive ? "text-green-600" : "text-red-600"}>{p.isActive ? "Active" : "Inactive"}</span>
                        </li>
                    ))}
                </ul>
            )}
        </div>
    );
}
