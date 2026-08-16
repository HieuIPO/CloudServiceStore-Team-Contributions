import AdminCatalogClient from "@/components/admin-catalog-client";

export default function AdminCatalogPage() {
    return (
        <div className="p-8">
            <h1 className="text-3xl font-bold mb-6">Catalog Management</h1>
            <AdminCatalogClient />
        </div>
    );
}
