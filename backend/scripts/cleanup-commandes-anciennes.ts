import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function cleanupCommandesAnciennes() {
  console.log('🔍 Recherche des commandes à supprimer (hors mois en cours)...');

  // Calculer le début du mois en cours
  const maintenant = new Date();
  const debutMois = new Date(maintenant.getFullYear(), maintenant.getMonth(), 1);
  debutMois.setHours(0, 0, 0, 0);

  console.log(`📅 Conserver les commandes à partir du: ${debutMois.toLocaleDateString('fr-FR')}`);

  // Trouver toutes les commandes créées avant le début du mois en cours
  const commandesAnciennes = await prisma.commande.findMany({
    where: {
      createdAt: {
        lt: debutMois,
      },
    },
    include: {
      demande: {
        include: {
          utilisateur: {
            select: {
              id: true,
              phone: true,
            },
          },
        },
      },
      prestataire: {
        select: {
          id: true,
          raisonSociale: true,
        },
      },
    },
    orderBy: {
      createdAt: 'desc',
    },
  });

  console.log(`📊 Trouvé ${commandesAnciennes.length} commande(s) à supprimer`);

  if (commandesAnciennes.length === 0) {
    console.log('✅ Aucune commande à supprimer');
    await prisma.$disconnect();
    return;
  }

  // Afficher les détails
  console.log('\n📋 Détails des commandes à supprimer:');
  commandesAnciennes.slice(0, 20).forEach((commande, index) => {
    console.log(
      `${index + 1}. ID: ${commande.id} | Client: ${commande.demande?.utilisateur?.phone || 'N/A'} | Prestataire: ${commande.prestataire?.raisonSociale || 'N/A'} | Statut: ${commande.statut} | Créé le: ${commande.createdAt.toLocaleDateString('fr-FR')}`,
    );
  });
  if (commandesAnciennes.length > 20) {
    console.log(`... et ${commandesAnciennes.length - 20} autre(s) commande(s)`);
  }

  // Compter les commandes par statut
  const parStatut = commandesAnciennes.reduce((acc, cmd) => {
    acc[cmd.statut] = (acc[cmd.statut] || 0) + 1;
    return acc;
  }, {} as Record<string, number>);

  console.log('\n📊 Répartition par statut:');
  Object.entries(parStatut).forEach(([statut, count]) => {
    console.log(`  - ${statut}: ${count}`);
  });

  // Demander confirmation (dans un script automatique, on supprime directement)
  console.log('\n🗑️  Suppression en cours...');

  // Supprimer ces commandes
  const result = await prisma.commande.deleteMany({
    where: {
      createdAt: {
        lt: debutMois,
      },
    },
  });

  console.log(`\n✅ ${result.count} commande(s) supprimée(s) avec succès`);

  // Afficher le nombre de commandes restantes
  const commandesRestantes = await prisma.commande.count({
    where: {
      createdAt: {
        gte: debutMois,
      },
    },
  });

  console.log(`📊 ${commandesRestantes} commande(s) conservée(s) (mois en cours)`);

  await prisma.$disconnect();
}

cleanupCommandesAnciennes()
  .catch((error) => {
    console.error('❌ Erreur lors du nettoyage:', error);
    process.exit(1);
  });
