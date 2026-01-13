const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function main() {
  console.log('🔍 Vérification des prestataires...\n');

  // Récupérer tous les prestataires
  const allPrestataires = await prisma.user.findMany({
    where: { role: 'PRESTATAIRE' },
    select: { id: true, phone: true, country: true, address: true }
  });

  console.log(`Total prestataires: ${allPrestataires.length}`);
  console.log(`Prestataires avec country=SN: ${allPrestataires.filter(p => p.country === 'SN').length}`);
  console.log(`Prestataires avec country=null: ${allPrestataires.filter(p => p.country === null).length}`);
  console.log(`Prestataires avec +221: ${allPrestataires.filter(p => p.phone && p.phone.startsWith('+221')).length}\n`);

  console.log('Détails des prestataires:');
  allPrestataires.forEach(p => {
    console.log(`  - ${p.phone} | country: ${p.country} | address: ${p.address}`);
  });

  console.log('\n🔄 Mise à jour du champ country...\n');

  // Mettre à jour par numéro de téléphone
  const updatedByPhone = await prisma.user.updateMany({
    where: {
      country: null,
      phone: { startsWith: '+221' },
      role: 'PRESTATAIRE'
    },
    data: { country: 'SN' }
  });
  console.log(`✅ ${updatedByPhone.count} prestataire(s) mis à jour par numéro de téléphone`);

  // Mettre à jour par adresse
  const updatedByAddress = await prisma.user.updateMany({
    where: {
      country: null,
      role: 'PRESTATAIRE',
      OR: [
        { address: { contains: 'Dakar', mode: 'insensitive' } },
        { address: { contains: 'Sénégal', mode: 'insensitive' } },
        { address: { contains: 'Senegal', mode: 'insensitive' } }
      ]
    },
    data: { country: 'SN' }
  });
  console.log(`✅ ${updatedByAddress.count} prestataire(s) mis à jour par adresse`);

  // Statistiques finales
  const totalSenegal = await prisma.user.count({
    where: { country: 'SN', role: 'PRESTATAIRE' }
  });

  console.log(`\n📊 Résultat final:`);
  console.log(`   - Prestataires au Sénégal: ${totalSenegal}`);
}

main()
  .catch((e) => {
    console.error('❌ Erreur:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
