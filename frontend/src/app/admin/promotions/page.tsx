import AdminPromotionsClient from "@/components/admin-promotions-client";

export default function AdminPromotionsPage() {
    return (
        <div className="p-8">
            <h1 className="text-3xl font-bold mb-6">Promotions & QR Codes</h1>
            <AdminPromotionsClient />
        </div>
    );
}
