import { countries, getCountryByCode, getDefaultCountry, type Country } from './countries';

/**
 * Détecte le pays à partir des coordonnées GPS
 * Utilise l'API de reverse geocoding d'OpenStreetMap (Nominatim)
 */
export async function detectCountryFromCoordinates(
  latitude: number,
  longitude: number
): Promise<Country | null> {
  try {
    const params = new URLSearchParams({
      format: 'json',
      lat: latitude.toString(),
      lon: longitude.toString(),
      addressdetails: '1',
      zoom: '3', // Niveau de zoom pour obtenir le pays
    });

    const response = await fetch(`https://nominatim.openstreetmap.org/reverse?${params.toString()}`, {
      headers: {
        'Accept-Language': 'fr',
        'User-Agent': 'VBS-Platform/1.0 (support@vosbesoinsservices.com)',
      },
    });

    if (!response.ok) {
      return null;
    }

    const data = await response.json();
    const countryCode = data?.address?.country_code?.toUpperCase();

    if (countryCode) {
      const country = getCountryByCode(countryCode);
      if (country) {
        return country;
      }
    }

    return null;
  } catch (error) {
    console.error('Erreur détection pays depuis coordonnées:', error);
    return null;
  }
}

/**
 * Détecte le pays à partir de l'adresse IP
 * Utilise l'API ipapi.co (gratuite, sans clé API requise)
 */
export async function detectCountryFromIP(): Promise<Country | null> {
  try {
    const response = await fetch('https://ipapi.co/json/', {
      headers: {
        'Accept': 'application/json',
      },
    });

    if (!response.ok) {
      return null;
    }

    const data = await response.json();
    const countryCode = data?.country_code;

    if (countryCode) {
      const country = getCountryByCode(countryCode);
      if (country) {
        return country;
      }
    }

    return null;
  } catch (error) {
    console.error('Erreur détection pays depuis IP:', error);
    return null;
  }
}

/**
 * Détecte automatiquement le pays de l'utilisateur
 * Essaie d'abord la géolocalisation GPS, puis l'IP en fallback
 */
export async function detectUserCountry(): Promise<Country> {
  // Essayer d'abord la géolocalisation GPS (plus précise)
  if ('geolocation' in navigator) {
    try {
      const position = await new Promise<GeolocationPosition>((resolve, reject) => {
        navigator.geolocation.getCurrentPosition(
          resolve,
          reject,
          {
            enableHighAccuracy: false, // Pas besoin de haute précision pour le pays
            timeout: 5000,
            maximumAge: 300000, // 5 minutes de cache
          }
        );
      });

      const country = await detectCountryFromCoordinates(
        position.coords.latitude,
        position.coords.longitude
      );

      if (country) {
        console.log('✅ Pays détecté via GPS:', country.name);
        return country;
      }
    } catch (error) {
      console.log('⚠️ Géolocalisation GPS non disponible, tentative IP...', error);
    }
  }

  // Fallback: détection par IP
  try {
    const country = await detectCountryFromIP();
    if (country) {
      console.log('✅ Pays détecté via IP:', country.name);
      return country;
    }
  } catch (error) {
    console.log('⚠️ Détection par IP échouée', error);
  }

  // Dernier recours: pays par défaut (Sénégal)
  console.log('ℹ️ Utilisation du pays par défaut: Sénégal');
  return getDefaultCountry();
}

