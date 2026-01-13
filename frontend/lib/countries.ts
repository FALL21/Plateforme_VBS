// Liste des pays avec leurs codes indicatifs téléphoniques
export interface Country {
  code: string; // Code ISO (ex: SN, FR, CI)
  name: string; // Nom du pays
  dialCode: string; // Indicatif téléphonique (ex: +221, +33)
  flag: string; // Emoji drapeau
}

export const countries: Country[] = [
  { code: 'SN', name: 'Sénégal', dialCode: '+221', flag: '🇸🇳' },
  { code: 'FR', name: 'France', dialCode: '+33', flag: '🇫🇷' },
  { code: 'CI', name: "Côte d'Ivoire", dialCode: '+225', flag: '🇨🇮' },
  { code: 'ML', name: 'Mali', dialCode: '+223', flag: '🇲🇱' },
  { code: 'BF', name: 'Burkina Faso', dialCode: '+226', flag: '🇧🇫' },
  { code: 'NE', name: 'Niger', dialCode: '+227', flag: '🇳🇪' },
  { code: 'MR', name: 'Mauritanie', dialCode: '+222', flag: '🇲🇷' },
  { code: 'GN', name: 'Guinée', dialCode: '+224', flag: '🇬🇳' },
  { code: 'GW', name: 'Guinée-Bissau', dialCode: '+245', flag: '🇬🇼' },
  { code: 'GM', name: 'Gambie', dialCode: '+220', flag: '🇬🇲' },
  { code: 'CM', name: 'Cameroun', dialCode: '+237', flag: '🇨🇲' },
  { code: 'TD', name: 'Tchad', dialCode: '+235', flag: '🇹🇩' },
  { code: 'GA', name: 'Gabon', dialCode: '+241', flag: '🇬🇦' },
  { code: 'CG', name: 'Congo', dialCode: '+242', flag: '🇨🇬' },
  { code: 'CD', name: 'RD Congo', dialCode: '+243', flag: '🇨🇩' },
  { code: 'BJ', name: 'Bénin', dialCode: '+229', flag: '🇧🇯' },
  { code: 'TG', name: 'Togo', dialCode: '+228', flag: '🇹🇬' },
  { code: 'GH', name: 'Ghana', dialCode: '+233', flag: '🇬🇭' },
  { code: 'NG', name: 'Nigeria', dialCode: '+234', flag: '🇳🇬' },
  { code: 'KE', name: 'Kenya', dialCode: '+254', flag: '🇰🇪' },
  { code: 'UG', name: 'Ouganda', dialCode: '+256', flag: '🇺🇬' },
  { code: 'TZ', name: 'Tanzanie', dialCode: '+255', flag: '🇹🇿' },
  { code: 'ET', name: 'Éthiopie', dialCode: '+251', flag: '🇪🇹' },
  { code: 'ZA', name: 'Afrique du Sud', dialCode: '+27', flag: '🇿🇦' },
  { code: 'MA', name: 'Maroc', dialCode: '+212', flag: '🇲🇦' },
  { code: 'DZ', name: 'Algérie', dialCode: '+213', flag: '🇩🇿' },
  { code: 'TN', name: 'Tunisie', dialCode: '+216', flag: '🇹🇳' },
  { code: 'EG', name: 'Égypte', dialCode: '+20', flag: '🇪🇬' },
  { code: 'US', name: 'États-Unis', dialCode: '+1', flag: '🇺🇸' },
  { code: 'CA', name: 'Canada', dialCode: '+1', flag: '🇨🇦' },
  { code: 'GB', name: 'Royaume-Uni', dialCode: '+44', flag: '🇬🇧' },
  { code: 'DE', name: 'Allemagne', dialCode: '+49', flag: '🇩🇪' },
  { code: 'ES', name: 'Espagne', dialCode: '+34', flag: '🇪🇸' },
  { code: 'IT', name: 'Italie', dialCode: '+39', flag: '🇮🇹' },
  { code: 'BE', name: 'Belgique', dialCode: '+32', flag: '🇧🇪' },
  { code: 'CH', name: 'Suisse', dialCode: '+41', flag: '🇨🇭' },
  { code: 'BR', name: 'Brésil', dialCode: '+55', flag: '🇧🇷' },
  { code: 'MX', name: 'Mexique', dialCode: '+52', flag: '🇲🇽' },
  { code: 'AR', name: 'Argentine', dialCode: '+54', flag: '🇦🇷' },
  { code: 'IN', name: 'Inde', dialCode: '+91', flag: '🇮🇳' },
  { code: 'CN', name: 'Chine', dialCode: '+86', flag: '🇨🇳' },
  { code: 'JP', name: 'Japon', dialCode: '+81', flag: '🇯🇵' },
  { code: 'AU', name: 'Australie', dialCode: '+61', flag: '🇦🇺' },
];

// Fonction pour obtenir le pays par défaut (Sénégal)
export const getDefaultCountry = (): Country => {
  return countries.find(c => c.code === 'SN') || countries[0];
};

// Fonction pour obtenir un pays par son code
export const getCountryByCode = (code: string): Country | undefined => {
  return countries.find(c => c.code === code);
};

// Fonction pour normaliser un numéro de téléphone selon le pays
export const normalizePhoneByCountry = (phone: string, country: Country): string => {
  if (!phone) return '';
  
  // Enlever tous les caractères non numériques sauf le +
  let digits = phone.replace(/[^\d+]/g, '');
  
  // Si le numéro commence déjà par l'indicatif du pays, le retourner tel quel
  if (digits.startsWith(country.dialCode.replace('+', ''))) {
    return country.dialCode + digits.slice(country.dialCode.length - 1);
  }
  
  // Si le numéro commence par 00, remplacer par +
  if (digits.startsWith('00')) {
    digits = '+' + digits.slice(2);
  }
  
  // Si le numéro commence par +, le garder
  if (digits.startsWith('+')) {
    return digits;
  }
  
  // Si le numéro commence par 0, l'enlever et ajouter l'indicatif
  if (digits.startsWith('0')) {
    digits = digits.slice(1);
  }
  
  // Ajouter l'indicatif du pays
  return country.dialCode + digits;
};

