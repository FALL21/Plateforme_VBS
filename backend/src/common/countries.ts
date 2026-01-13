// Configuration des pays avec leurs indicatifs téléphoniques et mots-clés d'adresse
export interface CountryConfig {
  code: string;
  dialCode: string;
  addressKeywords: string[]; // Mots-clés pour détecter le pays dans l'adresse
}

export const countryConfigs: CountryConfig[] = [
  { code: 'SN', dialCode: '+221', addressKeywords: ['Dakar', 'Sénégal', 'Senegal', 'Thiès', 'Saint-Louis', 'Ziguinchor'] },
  { code: 'FR', dialCode: '+33', addressKeywords: ['France', 'Paris', 'Lyon', 'Marseille', 'Toulouse', 'Nice'] },
  { code: 'CI', dialCode: '+225', addressKeywords: ["Côte d'Ivoire", 'Abidjan', 'Yamoussoukro', 'Bouaké'] },
  { code: 'ML', dialCode: '+223', addressKeywords: ['Mali', 'Bamako', 'Ségou', 'Mopti'] },
  { code: 'BF', dialCode: '+226', addressKeywords: ['Burkina Faso', 'Ouagadougou', 'Bobo-Dioulasso'] },
  { code: 'NE', dialCode: '+227', addressKeywords: ['Niger', 'Niamey', 'Zinder'] },
  { code: 'MR', dialCode: '+222', addressKeywords: ['Mauritanie', 'Nouakchott', 'Nouadhibou'] },
  { code: 'GN', dialCode: '+224', addressKeywords: ['Guinée', 'Conakry', 'Kindia'] },
  { code: 'GW', dialCode: '+245', addressKeywords: ['Guinée-Bissau', 'Bissau'] },
  { code: 'GM', dialCode: '+220', addressKeywords: ['Gambie', 'Banjul', 'Serekunda'] },
  { code: 'CM', dialCode: '+237', addressKeywords: ['Cameroun', 'Douala', 'Yaoundé', 'Yaounde'] },
  { code: 'TD', dialCode: '+235', addressKeywords: ['Tchad', "N'Djamena", 'N\'Djamena'] },
  { code: 'GA', dialCode: '+241', addressKeywords: ['Gabon', 'Libreville', 'Port-Gentil'] },
  { code: 'CG', dialCode: '+242', addressKeywords: ['Congo', 'Brazzaville', 'Pointe-Noire'] },
  { code: 'CD', dialCode: '+243', addressKeywords: ['RD Congo', 'Kinshasa', 'Lubumbashi'] },
  { code: 'BJ', dialCode: '+229', addressKeywords: ['Bénin', 'Cotonou', 'Porto-Novo'] },
  { code: 'TG', dialCode: '+228', addressKeywords: ['Togo', 'Lomé', 'Lome'] },
  { code: 'GH', dialCode: '+233', addressKeywords: ['Ghana', 'Accra', 'Kumasi'] },
  { code: 'NG', dialCode: '+234', addressKeywords: ['Nigeria', 'Lagos', 'Abuja', 'Kano'] },
  { code: 'KE', dialCode: '+254', addressKeywords: ['Kenya', 'Nairobi', 'Mombasa'] },
  { code: 'UG', dialCode: '+256', addressKeywords: ['Ouganda', 'Kampala', 'Entebbe'] },
  { code: 'TZ', dialCode: '+255', addressKeywords: ['Tanzanie', 'Dar es Salaam', 'Dodoma'] },
  { code: 'ET', dialCode: '+251', addressKeywords: ['Éthiopie', 'Ethiopie', 'Addis-Abeba', 'Addis Abeba'] },
  { code: 'ZA', dialCode: '+27', addressKeywords: ['Afrique du Sud', 'South Africa', 'Johannesburg', 'Cape Town', 'Le Cap'] },
  { code: 'MA', dialCode: '+212', addressKeywords: ['Maroc', 'Morocco', 'Casablanca', 'Rabat', 'Marrakech'] },
  { code: 'DZ', dialCode: '+213', addressKeywords: ['Algérie', 'Algeria', 'Alger', 'Oran'] },
  { code: 'TN', dialCode: '+216', addressKeywords: ['Tunisie', 'Tunisia', 'Tunis', 'Sfax'] },
  { code: 'EG', dialCode: '+20', addressKeywords: ['Égypte', 'Egypt', 'Le Caire', 'Cairo', 'Alexandrie'] },
  { code: 'US', dialCode: '+1', addressKeywords: ['États-Unis', 'United States', 'USA', 'New York', 'Los Angeles', 'Chicago'] },
  { code: 'CA', dialCode: '+1', addressKeywords: ['Canada', 'Toronto', 'Montreal', 'Vancouver'] },
  { code: 'GB', dialCode: '+44', addressKeywords: ['Royaume-Uni', 'United Kingdom', 'UK', 'London', 'Londres', 'Manchester'] },
  { code: 'DE', dialCode: '+49', addressKeywords: ['Allemagne', 'Germany', 'Berlin', 'Munich', 'Hamburg'] },
  { code: 'ES', dialCode: '+34', addressKeywords: ['Espagne', 'Spain', 'Madrid', 'Barcelone', 'Barcelona'] },
  { code: 'IT', dialCode: '+39', addressKeywords: ['Italie', 'Italy', 'Rome', 'Milan', 'Naples'] },
  { code: 'BE', dialCode: '+32', addressKeywords: ['Belgique', 'Belgium', 'Bruxelles', 'Brussels', 'Anvers'] },
  { code: 'CH', dialCode: '+41', addressKeywords: ['Suisse', 'Switzerland', 'Zurich', 'Genève', 'Geneva'] },
  { code: 'BR', dialCode: '+55', addressKeywords: ['Brésil', 'Brazil', 'São Paulo', 'Rio de Janeiro', 'Brasilia'] },
  { code: 'MX', dialCode: '+52', addressKeywords: ['Mexique', 'Mexico', 'Mexico City', 'Guadalajara'] },
  { code: 'AR', dialCode: '+54', addressKeywords: ['Argentine', 'Argentina', 'Buenos Aires', 'Cordoba'] },
  { code: 'IN', dialCode: '+91', addressKeywords: ['Inde', 'India', 'Mumbai', 'Delhi', 'Bangalore'] },
  { code: 'CN', dialCode: '+86', addressKeywords: ['Chine', 'China', 'Beijing', 'Shanghai', 'Pékin'] },
  { code: 'JP', dialCode: '+81', addressKeywords: ['Japon', 'Japan', 'Tokyo', 'Osaka', 'Kyoto'] },
  { code: 'AU', dialCode: '+61', addressKeywords: ['Australie', 'Australia', 'Sydney', 'Melbourne', 'Brisbane'] },
];

export function getCountryConfigByCode(code: string): CountryConfig | undefined {
  return countryConfigs.find(c => c.code === code);
}

export function getCountryConfigByDialCode(dialCode: string): CountryConfig | undefined {
  return countryConfigs.find(c => c.dialCode === dialCode);
}
