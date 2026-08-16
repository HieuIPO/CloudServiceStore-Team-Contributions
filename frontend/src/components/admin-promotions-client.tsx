"use client";

import { useEffect, useState } from "react";
import { fetchPromotions } from "@/lib/api";

export default function AdminPromotionsClient() {
    const [promotions, setPromotions] = useState<any[]>([]);
    const [qrCodeData, setQrCodeData] = useState<string | null>(null);
    const [selectedPromo, setSelectedPromo] = useState<string | null>(null);

    useEffect(() => {
        const load = async () => {
            const data = await fetchPromotions();
            setPromotions(data);
        };
        load();
    }, []);

    const handleViewQr = async (id: string, code: string) => {
        try {
            const res = await fetch(`https://localhost:7225/api/v1/Promotions/${id}/qr-code`);
            if (res.ok) {
                const data = await res.json();
                setQrCodeData(data.qrCodeBase64);
                setSelectedPromo(code);
            }
        } catch (err) {
            console.error("Error fetching QR code", err);
        }
    };

    return (
        <div className="bg-white p-6 rounded-lg shadow-sm">
            <h2 className="text-xl font-semibold mb-4">Promotions List</h2>
            {promotions.length === 0 ? (
                <p className="text-gray-500">No promotions found.</p>
            ) : (
                <div className="overflow-x-auto">
                    <table className="w-full text-left border-collapse">
                        <thead>
                            <tr className="border-b">
                                <th className="p-3">Code</th>
                                <th className="p-3">Name</th>
                                <th className="p-3">Discount</th>
                                <th className="p-3">Status</th>
                                <th className="p-3">Action</th>
                            </tr>
                        </thead>
                        <tbody>
                            {promotions.map((p) => (
                                <tr key={p.id} className="border-b hover:bg-gray-50">
                                    <td className="p-3 font-medium">{p.code}</td>
                                    <td className="p-3">{p.name}</td>
                                    <td className="p-3">
                                        {p.discountType === 1 ? `${p.discountValue}%` : `$${p.discountValue}`}
                                    </td>
                                    <td className="p-3">
                                        <span className={`px-2 py-1 rounded-full text-xs ${p.isActive ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'}`}>
                                            {p.isActive ? 'Active' : 'Inactive'}
                                        </span>
                                    </td>
                                    <td className="p-3">
                                        <button 
                                            onClick={() => handleViewQr(p.id, p.code)}
                                            className="text-blue-600 hover:underline"
                                        >
                                            View QR Code
                                        </button>
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>
            )}
            
            {qrCodeData && (
                <div className="mt-6 p-6 border rounded bg-gray-50 flex flex-col items-center">
                    <h3 className="font-semibold mb-2">QR Code for {selectedPromo}</h3>
                    <img src={`data:image/png;base64,${qrCodeData}`} alt="QR Code" className="w-48 h-48" />
                    <button 
                        onClick={() => setQrCodeData(null)}
                        className="mt-4 px-4 py-2 bg-gray-200 rounded hover:bg-gray-300"
                    >
                        Close
                    </button>
                </div>
            )}
        </div>
    );
}
