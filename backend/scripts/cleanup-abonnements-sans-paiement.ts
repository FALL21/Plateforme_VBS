import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function cleanupAbonnementsSansPaiement() {
  console.log('🔍 Recherche des abonnements sans paiement associé...');

  // Trouver tous les abonnements qui n'ont aucun paiement associé
  const abonnementsSansPaiement = await prisma.abonnement.findMany({
    where: {
      paiements: {
        none: {},
      },
    },
    include: {
      prestataire: {
        select: {
          id: true,
          raisonSociale: true,
        },
      },
    },
  });

  console.log(`📊 Trouvé ${abonnementsSansPaiement.length} abonnement(s) sans paiement`);

  if (abonnementsSansPaiement.length === 0) {
    console.log('✅ Aucun abonnement à supprimer');
    await prisma.$disconnect();
    return;
  }

  // Afficher les détails
  console.log('\n📋 Détails des abonnements à supprimer:');
  abonnementsSansPaiement.forEach((abonnement, index) => {
    console.log(
      `${index + 1}. ID: ${abonnement.id} | Prestataire: ${abonnement.prestataire?.raisonSociale || 'N/A'} | Type: ${abonnement.type} | Statut: ${abonnement.statut} | Créé le: ${abonnement.createdAt.toLocaleDateString('fr-FR')}`,
    );
  });

  // Supprimer ces abonnements
  const result = await prisma.abonnement.deleteMany({
    where: {
      paiements: {
        none: {},
      },
    },
  });

  console.log(`\n✅ ${result.count} abonnement(s) supprimé(s) avec succès`);
  await prisma.$disconnect();
}

cleanupAbonnementsSansPaiement()
  .catch((error) => {
    console.error('❌ Erreur lors du nettoyage:', error);
    process.exit(1);
  });
