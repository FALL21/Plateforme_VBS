"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { useAuthStore } from "@/stores/auth-store";

export default function AdminPage() {
  const router = useRouter();
  const { isAuthenticated, user } = useAuthStore();

  useEffect(() => {
    if (!isAuthenticated()) {
      router.push("/login");
      return;
    }
    if (user?.role !== "ADMIN") {
      router.push("/");
    }
  }, [isAuthenticated, user, router]);

  return (
    <div className="min-h-screen p-8 bg-gray-50">
      <div className="max-w-6xl mx-auto">
        <h1 className="text-3xl font-bold mb-6">Tableau de bord Admin</h1>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <a
            href="/admin/validations/paiements"
            className="p-6 border rounded-lg bg-white hover:bg-gray-50"
          >
            <div className="text-xl font-semibold">Valider paiements espèces</div>
            <div className="text-gray-600 text-sm mt-1">
              Approuver ou refuser les paiements déclarés
            </div>
          </a>
          <a
            href="/admin/validations/prestataires"
            className="p-6 border rounded-lg bg-white hover:bg-gray-50"
          >
            <div className="text-xl font-semibold">Valider prestataires</div>
            <div className="text-gray-600 text-sm mt-1">
              Vérifier et activer les profils prestataires
            </div>
          </a>
        </div>
      </div>
    </div>
  );
}


