import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function main() {
  console.log('🌱 Début du seeding...');

  // Créer des secteurs et sous-secteurs
  const secteurVente = await prisma.secteur.upsert({
    where: { slug: 'vente' },
    update: {},
    create: {
      nom: 'Vente',
      slug: 'vente',
      description: 'Services de vente et commerce',
      actif: true,
      sousSecteurs: {
        create: [
          {
            nom: 'Produits alimentaires',
            slug: 'produits-alimentaires',
            description: 'Vente de produits alimentaires',
            actif: true,
          },
          {
            nom: 'E-commerce local',
            slug: 'e-commerce-local',
            description: 'Boutiques en ligne locales',
            actif: true,
          },
        ],
      },
    },
  });

  const secteurServices = await prisma.secteur.upsert({
    where: { slug: 'services-generaux' },
    update: {},
    create: {
      nom: 'Services Généraux',
      slug: 'services-generaux',
      description: 'Services généraux divers',
      actif: true,
      sousSecteurs: {
        create: [
          {
            nom: 'Plomberie',
            slug: 'plomberie',
            description: 'Services de plomberie',
            actif: true,
          },
          {
            nom: 'Électricité',
            slug: 'electricite',
            description: 'Services électriques',
            actif: true,
          },
          {
            nom: 'Dépannage',
            slug: 'depannage',
            description: 'Services de dépannage',
            actif: true,
          },
        ],
      },
    },
  });

  const secteurImmobilier = await prisma.secteur.upsert({
    where: { slug: 'immobilier' },
    update: {},
    create: {
      nom: 'Immobilier',
      slug: 'immobilier',
      description: 'Services immobiliers',
      actif: true,
      sousSecteurs: {
        create: [
          {
            nom: 'Location',
            slug: 'location',
            description: 'Location de biens immobiliers',
            actif: true,
          },
          {
            nom: 'Vente',
            slug: 'vente-immobilier',
            description: 'Vente de biens immobiliers',
            actif: true,
          },
        ],
      },
    },
  });

  const secteurAlimentaire = await prisma.secteur.upsert({
    where: { slug: 'alimentaire' },
    update: {},
    create: {
      nom: 'Alimentaire',
      slug: 'alimentaire',
      description: 'Services alimentaires',
      actif: true,
      sousSecteurs: {
        create: [
          {
            nom: 'Livraison repas',
            slug: 'livraison-repas',
            description: 'Livraison de repas à domicile',
            actif: true,
          },
          {
            nom: 'Traiteur',
            slug: 'traiteur',
            description: 'Services de traiteur',
            actif: true,
          },
        ],
      },
    },
  });

  const secteurLinge = await prisma.secteur.upsert({
    where: { slug: 'linge-pressing' },
    update: {},
    create: {
      nom: 'Linge / Pressing',
      slug: 'linge-pressing',
      description: 'Services de nettoyage et pressing',
      actif: true,
      sousSecteurs: {
        create: [
          {
            nom: 'Pressing',
            slug: 'pressing',
            description: 'Services de pressing',
            actif: true,
          },
          {
            nom: 'Collecte et livraison',
            slug: 'collecte-livraison',
            description: 'Collecte et livraison de linge',
            actif: true,
          },
        ],
      },
    },
  });

  const secteurMenage = await prisma.secteur.upsert({
    where: { slug: 'menage' },
    update: {},
    create: {
      nom: 'Ménage',
      slug: 'menage',
      description: 'Services de ménage et nettoyage',
      actif: true,
      sousSecteurs: {
        create: [
          {
            nom: 'Ménage à domicile',
            slug: 'menage-domicile',
            description: 'Ménage à domicile',
            actif: true,
          },
          {
            nom: 'Nettoyage bureaux',
            slug: 'nettoyage-bureaux',
            description: 'Nettoyage de bureaux',
            actif: true,
          },
        ],
      },
    },
  });

  // Récupérer les sous-secteurs pour créer des services
  const sousSecteurs = await prisma.sousSecteur.findMany();

  // Créer des services pour chaque sous-secteur
  for (const sousSecteur of sousSecteurs) {
    await prisma.service.upsert({
      where: { slug: `${sousSecteur.slug}-service` },
      update: {},
      create: {
        nom: `Service ${sousSecteur.nom}`,
        slug: `${sousSecteur.slug}-service`,
        description: `Service principal pour ${sousSecteur.nom}`,
        sousSecteurId: sousSecteur.id,
        actif: true,
        attributs: {
          duree: 'Variable',
          type: 'sur_site',
        },
      },
    });
  }

  // Créer des plans d'abonnement
  const planMensuel = await prisma.planAbonnement.upsert({
    where: { id: 'plan-mensuel-default' },
    update: {},
    create: {
      id: 'plan-mensuel-default',
      nom: 'Abonnement Mensuel',
      type: 'MENSUEL',
      prix: 10000, // 10 000 FCFA
      actif: true,
    },
  });

  const planAnnuel = await prisma.planAbonnement.upsert({
    where: { id: 'plan-annuel-default' },
    update: {},
    create: {
      id: 'plan-annuel-default',
      nom: 'Abonnement Annuel',
      type: 'ANNUEL',
      prix: 96000, // 96 000 FCFA (20% de réduction)
      actif: true,
    },
  });

  // Créer des utilisateurs et prestataires de démo (Dakar)
  const demoUsers = await Promise.all([
    prisma.user.upsert({
      where: { phone: '+221770000001' },
      update: {},
      create: {
        phone: '+221770000001',
        role: 'PRESTATAIRE',
        address: 'Plateau, Dakar',
        latitude: 14.6700,
        longitude: -17.4380,
      },
    }),
    prisma.user.upsert({
      where: { phone: '+221770000002' },
      update: {},
      create: {
        phone: '+221770000002',
        role: 'PRESTATAIRE',
        address: 'Parcelles Assainies, Dakar',
        latitude: 14.7700,
        longitude: -17.4500,
      },
    }),
    prisma.user.upsert({
      where: { phone: '+221770000003' },
      update: {},
      create: {
        phone: '+221770000003',
        role: 'PRESTATAIRE',
        address: 'Ouakam, Dakar',
        latitude: 14.7400,
        longitude: -17.4900,
      },
    }),
  ]);

  const [u1, u2, u3] = demoUsers;

  const prestataires = await Promise.all([
    prisma.prestataire.upsert({
      where: { userId: u1.id },
      update: { logoUrl: 'https://images.unsplash.com/photo-1581091014534-7f7955a09f9d?q=80&w=200&auto=format&fit=crop' },
      create: {
        userId: u1.id,
        raisonSociale: 'SEN Électricité Services',
        description: 'Interventions électricité domestique et tertiaire',
        logoUrl: 'https://images.unsplash.com/photo-1581091014534-7f7955a09f9d?q=80&w=200&auto=format&fit=crop',
        kycStatut: 'VALIDE',
        abonnementActif: true,
        disponibilite: true,
        noteMoyenne: 4.5,
      },
    }),
    prisma.prestataire.upsert({
      where: { userId: u2.id },
      update: { logoUrl: 'https://images.unsplash.com/photo-1581574209461-9999a3f2f4fb?q=80&w=200&auto=format&fit=crop' },
      create: {
        userId: u2.id,
        raisonSociale: 'Dakar Plomberie Express',
        description: 'Dépannage plomberie 7j/7',
        logoUrl: 'https://images.unsplash.com/photo-1581574209461-9999a3f2f4fb?q=80&w=200&auto=format&fit=crop',
        kycStatut: 'VALIDE',
        abonnementActif: true,
        disponibilite: true,
        noteMoyenne: 4.2,
      },
    }),
    prisma.prestataire.upsert({
      where: { userId: u3.id },
      update: { logoUrl: 'https://images.unsplash.com/photo-1560518883-ce09059eeffa?q=80&w=200&auto=format&fit=crop' },
      create: {
        userId: u3.id,
        raisonSociale: 'Immo Location Pro',
        description: 'Gestion et location immobilière',
        logoUrl: 'https://images.unsplash.com/photo-1560518883-ce09059eeffa?q=80&w=200&auto=format&fit=crop',
        kycStatut: 'VALIDE',
        abonnementActif: true,
        disponibilite: true,
        noteMoyenne: 4.0,
      },
    }),
  ]);

  // Lier quelques services existants aux prestataires
  const serviceElectricite = await prisma.service.findFirst({ where: { slug: 'electricite-service' } });
  const servicePlomberie = await prisma.service.findFirst({ where: { slug: 'plomberie-service' } });
  const serviceLocation = await prisma.service.findFirst({ where: { slug: 'location-service' } });

  if (serviceElectricite && servicePlomberie && serviceLocation) {
    await prisma.prestataireService.createMany({
      data: [
        { prestataireId: prestataires[0].id, serviceId: serviceElectricite.id, tarifIndicatif: 25000 },
        { prestataireId: prestataires[1].id, serviceId: servicePlomberie.id, tarifIndicatif: 20000 },
        { prestataireId: prestataires[2].id, serviceId: serviceLocation.id, tarifIndicatif: 150000 },
      ],
      skipDuplicates: true,
    });
  }

  // Abonnements + paiements validés pour activer la visibilité
  for (const p of prestataires) {
    const abo = await prisma.abonnement.create({
      data: {
        prestataireId: p.id,
        planId: planMensuel.id,
        type: 'MENSUEL',
        dateDebut: new Date(),
        dateFin: new Date(Date.now() + 30 * 24 * 3600 * 1000),
        statut: 'ACTIF',
        tarif: 10000,
      },
    });
    await prisma.paiement.create({
      data: {
        abonnementId: abo.id,
        prestataireId: p.id,
        methode: 'WAVE',
        montant: 10000,
        statut: 'VALIDE',
        referenceExterne: `WAVE-${Math.random().toString(36).slice(2, 10)}`,
        dateValidation: new Date(),
      },
    });
  }

  // Quelques avis clients
  for (const p of prestataires) {
    for (let i = 0; i < 2; i++) {
      const uniquePhone = `+22178${Date.now().toString().slice(-7)}${i}`;
      const userClient = await prisma.user.upsert({
        where: { phone: uniquePhone },
        update: {},
        create: { phone: uniquePhone, role: 'USER' },
      });
      const dem = await prisma.demande.create({
        data: {
          utilisateurId: userClient.id,
          serviceId: (await prisma.prestataireService.findFirst({ where: { prestataireId: p.id } }))!.serviceId,
          description: 'Demande test',
          statut: 'ACCEPTEE',
        },
      });
      const cmd = await prisma.commande.create({
        data: {
          demandeId: dem.id,
          prestataireId: p.id,
          utilisateurId: userClient.id,
          statut: 'TERMINEE',
          prix: 20000,
        },
      });
      await prisma.avis.create({
        data: {
          commandeId: cmd.id,
          prestataireId: p.id,
          utilisateurId: userClient.id,
          note: 4,
          commentaire: 'Très bon service (démo)',
        },
      });
    }
  }

  console.log('✅ Seeding terminé avec succès!');
  console.log(`📊 Créé: ${await prisma.secteur.count()} secteurs`);
  console.log(`📊 Créé: ${await prisma.sousSecteur.count()} sous-secteurs`);
  console.log(`📊 Créé: ${await prisma.service.count()} services`);
  console.log(`📊 Créé: ${await prisma.planAbonnement.count()} plans d'abonnement`);
}

main()
  .catch((e) => {
    console.error('❌ Erreur lors du seeding:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });

