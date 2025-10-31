import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function main() {
  console.log('🌱 Début du seeding étendu...');

  // Récupérer tous les secteurs existants
  const secteurs = await prisma.secteur.findMany({
    include: { sousSecteurs: { include: { services: true } } },
  });

  console.log(`📊 ${secteurs.length} secteurs trouvés`);

  // Récupérer le plan mensuel
  const planMensuel = await prisma.planAbonnement.findFirst({
    where: { type: 'MENSUEL' },
  });

  if (!planMensuel) {
    throw new Error('Aucun plan mensuel trouvé. Exécutez d\'abord le seed principal.');
  }

  // Coordonnées de différents quartiers de Dakar
  const locations = [
    { address: 'Plateau, Dakar', lat: 14.6700, lng: -17.4380 },
    { address: 'Parcelles Assainies, Dakar', lat: 14.7700, lng: -17.4500 },
    { address: 'Ouakam, Dakar', lat: 14.7400, lng: -17.4900 },
    { address: 'Almadies, Dakar', lat: 14.7450, lng: -17.5100 },
    { address: 'Yoff, Dakar', lat: 14.7500, lng: -17.4700 },
    { address: 'Médina, Dakar', lat: 14.6850, lng: -17.4450 },
    { address: 'Grand Yoff, Dakar', lat: 14.7600, lng: -17.4600 },
    { address: 'Mermoz, Dakar', lat: 14.7100, lng: -17.4600 },
    { address: 'Liberté 6, Dakar', lat: 14.7050, lng: -17.4550 },
    { address: 'Sacré-Cœur, Dakar', lat: 14.7150, lng: -17.4650 },
    { address: 'Fann, Dakar', lat: 14.6900, lng: -17.4500 },
    { address: 'Point E, Dakar', lat: 14.6950, lng: -17.4550 },
  ];

  // Logos divers pour les prestataires
  const logos = [
    'https://images.unsplash.com/photo-1581091014534-7f7955a09f9d?q=80&w=200&auto=format&fit=crop',
    'https://images.unsplash.com/photo-1581574209461-9999a3f2f4fb?q=80&w=200&auto=format&fit=crop',
    'https://images.unsplash.com/photo-1560518883-ce09059eeffa?q=80&w=200&auto=format&fit=crop',
    'https://images.unsplash.com/photo-1560179707-f14e90ef3623?q=80&w=200&auto=format&fit=crop',
    'https://images.unsplash.com/photo-1504917595217-d4dc5ebe6122?q=80&w=200&auto=format&fit=crop',
    'https://images.unsplash.com/photo-1556740738-b6a63e27c4df?q=80&w=200&auto=format&fit=crop',
  ];

  let locationIndex = 0;
  let phoneCounter = 100;

  // Créer 2 prestataires par secteur
  for (const secteur of secteurs) {
    console.log(`🔧 Création de 2 prestataires pour le secteur: ${secteur.nom}`);

    for (let i = 1; i <= 2; i++) {
      const loc = locations[locationIndex % locations.length];
      const logo = logos[(locationIndex + i) % logos.length];
      const phone = `+2217700${phoneCounter.toString().padStart(4, '0')}`;
      phoneCounter++;

      // Créer l'utilisateur prestataire
      const user = await prisma.user.upsert({
        where: { phone },
        update: {},
        create: {
          phone,
          role: 'PRESTATAIRE',
          address: loc.address,
          latitude: loc.lat,
          longitude: loc.lng,
        },
      });

      // Créer le prestataire
      const prestataire = await prisma.prestataire.upsert({
        where: { userId: user.id },
        update: {
          logoUrl: logo,
          kycStatut: 'VALIDE',
          abonnementActif: true,
        },
        create: {
          userId: user.id,
          raisonSociale: `${secteur.nom} Pro ${i} - ${loc.address.split(',')[0]}`,
          description: `Prestataire spécialisé en ${secteur.nom.toLowerCase()} - Service professionnel et rapide`,
          logoUrl: logo,
          kycStatut: 'VALIDE',
          abonnementActif: true,
          disponibilite: true,
          noteMoyenne: 3.5 + Math.random() * 1.5, // Note entre 3.5 et 5
        },
      });

      // Lier aux services du secteur (au moins 1 service par sous-secteur)
      const servicesToLink = [];
      for (const sousSecteur of secteur.sousSecteurs) {
        if (sousSecteur.services.length > 0) {
          const randomService = sousSecteur.services[Math.floor(Math.random() * sousSecteur.services.length)];
          servicesToLink.push({
            prestataireId: prestataire.id,
            serviceId: randomService.id,
            tarifIndicatif: Math.floor(10000 + Math.random() * 40000), // Tarif entre 10k et 50k
          });
        }
      }

      if (servicesToLink.length > 0) {
        await prisma.prestataireService.createMany({
          data: servicesToLink,
          skipDuplicates: true,
        });
      }

      // Créer un abonnement actif
      const abonnement = await prisma.abonnement.create({
        data: {
          prestataireId: prestataire.id,
          planId: planMensuel.id,
          type: 'MENSUEL',
          dateDebut: new Date(),
          dateFin: new Date(Date.now() + 30 * 24 * 3600 * 1000), // 30 jours
          statut: 'ACTIF',
          tarif: planMensuel.prix,
        },
      });

      // Créer un paiement validé
      await prisma.paiement.create({
        data: {
          abonnementId: abonnement.id,
          prestataireId: prestataire.id,
          methode: i === 1 ? 'WAVE' : 'ORANGE_MONEY',
          montant: planMensuel.prix,
          statut: 'VALIDE',
          referenceExterne: `${i === 1 ? 'WAVE' : 'OM'}-${Date.now()}-${phoneCounter}`,
          dateValidation: new Date(),
        },
      });

      console.log(`  ✅ Créé: ${prestataire.raisonSociale}`);
      locationIndex++;
    }
  }

  // Créer un compte CLIENT
  console.log('👤 Création du compte client...');
  const clientUser = await prisma.user.upsert({
    where: { phone: '+221770001000' },
    update: {},
    create: {
      phone: '+221770001000',
      role: 'USER',
      address: 'Ngor, Dakar',
      latitude: 14.7550,
      longitude: -17.5150,
    },
  });
  console.log(`  ✅ Compte client créé: ${clientUser.phone}`);

  // Créer un compte ADMIN
  console.log('👑 Création du compte admin...');
  const adminUser = await prisma.user.upsert({
    where: { phone: '+221770009999' },
    update: {},
    create: {
      phone: '+221770009999',
      role: 'ADMIN',
      address: 'Dakar Centre',
      latitude: 14.6928,
      longitude: -17.4467,
    },
  });
  console.log(`  ✅ Compte admin créé: ${adminUser.phone}`);

  // Créer quelques avis pour les nouveaux prestataires (client uniquement)
  console.log('⭐ Ajout d\'avis pour les prestataires...');
  const prestataires = await prisma.prestataire.findMany({
    take: 5, // Seulement pour les 5 premiers
    include: { prestataireServices: true },
  });

  for (const p of prestataires) {
    if (p.prestataireServices.length > 0) {
      const demande = await prisma.demande.create({
        data: {
          utilisateurId: clientUser.id,
          serviceId: p.prestataireServices[0].serviceId,
          description: 'Service test demandé',
          statut: 'ACCEPTEE',
        },
      });

      const commande = await prisma.commande.create({
        data: {
          demandeId: demande.id,
          prestataireId: p.id,
          utilisateurId: clientUser.id,
          statut: 'TERMINEE',
          prix: 25000,
        },
      });

      await prisma.avis.create({
        data: {
          commandeId: commande.id,
          prestataireId: p.id,
          utilisateurId: clientUser.id,
          note: Math.floor(3 + Math.random() * 2), // Note entre 3 et 5
          commentaire: 'Service professionnel et de qualité. Je recommande vivement!',
        },
      });
    }
  }

  console.log('✅ Seeding étendu terminé avec succès!');
  console.log(`📊 Total prestataires: ${await prisma.prestataire.count()}`);
  console.log(`📊 Total utilisateurs: ${await prisma.user.count()}`);
  console.log(`📊 Total abonnements actifs: ${await prisma.abonnement.count({ where: { statut: 'ACTIF' } })}`);
  console.log('\n🔑 Comptes de test:');
  console.log('   👤 Client: +221770001000');
  console.log('   👑 Admin: +221770009999');
  console.log('   🏢 Prestataires: +221770000100 à +221770000XXX');
}

main()
  .catch((e) => {
    console.error('❌ Erreur lors du seeding étendu:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });

