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
    <div className="min-h-screen p-4 sm:p-6 lg:p-8 bg-gradient-to-br from-gray-50 via-white to-gray-50">
      <div className="max-w-6xl mx-auto">
        <h1 className="text-xl sm:text-2xl lg:text-3xl font-bold mb-4 sm:mb-6 text-gray-900">Tableau de bord Admin</h1>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 sm:gap-4 lg:gap-6">
          <a
            href="/admin/validations/paiements"
            className="p-4 sm:p-5 lg:p-6 border-2 rounded-lg bg-white hover:bg-gray-50 hover:border-primary/20 transition-colors"
          >
            <div className="text-base sm:text-lg lg:text-xl font-semibold text-gray-900">Valider paiements espèces</div>
            <div className="text-gray-600 text-xs sm:text-sm mt-1 sm:mt-2">
              Approuver ou refuser les paiements déclarés
            </div>
          </a>
          <a
            href="/admin/validations/prestataires"
            className="p-4 sm:p-5 lg:p-6 border-2 rounded-lg bg-white hover:bg-gray-50 hover:border-primary/20 transition-colors"
          >
            <div className="text-base sm:text-lg lg:text-xl font-semibold text-gray-900">Valider prestataires</div>
            <div className="text-gray-600 text-xs sm:text-sm mt-1 sm:mt-2">
              Vérifier et activer les profils prestataires
            </div>
          </a>
        </div>
      </div>
    </div>
  );
}


