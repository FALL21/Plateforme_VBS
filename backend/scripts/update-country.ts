import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function main() {
  console.log('🔄 Mise à jour du champ country pour les prestataires sénégalais...');

  // Mettre à jour les utilisateurs avec un numéro sénégalais (+221) mais sans country
  const updatedByPhone = await prisma.user.updateMany({
    where: {
      country: null,
      phone: {
        startsWith: '+221',
      },
    },
    data: {
      country: 'SN',
    },
  });

  console.log(`✅ ${updatedByPhone.count} utilisateur(s) mis à jour par numéro de téléphone`);

  // Mettre à jour les utilisateurs avec une adresse contenant "Dakar" ou "Sénégal" mais sans country
  const updatedByAddress = await prisma.user.updateMany({
    where: {
      country: null,
      OR: [
        { address: { contains: 'Dakar', mode: 'insensitive' } },
        { address: { contains: 'Sénégal', mode: 'insensitive' } },
        { address: { contains: 'Senegal', mode: 'insensitive' } },
      ],
    },
    data: {
      country: 'SN',
    },
  });

  console.log(`✅ ${updatedByAddress.count} utilisateur(s) mis à jour par adresse`);

  // Statistiques finales
  const totalSenegal = await prisma.user.count({
    where: {
      country: 'SN',
    },
  });

  const prestatairesSenegal = await prisma.user.count({
    where: {
      country: 'SN',
      role: 'PRESTATAIRE',
    },
  });

  console.log(`\n📊 Statistiques:`);
  console.log(`   - Total utilisateurs au Sénégal: ${totalSenegal}`);
  console.log(`   - Prestataires au Sénégal: ${prestatairesSenegal}`);
}

main()
  .catch((e) => {
    console.error('❌ Erreur:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
