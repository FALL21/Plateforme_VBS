import { Injectable, Logger, OnModuleInit } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import twilio from 'twilio';

@Injectable()
export class SmsService implements OnModuleInit {
  private readonly logger = new Logger(SmsService.name);
  private twilioClient: twilio.Twilio | null = null;
  private isEnabled = false;
  private fromNumber: string | null = null;

  constructor(private configService: ConfigService) {}

  onModuleInit() {
    const accountSid = this.configService.get<string>('TWILIO_ACCOUNT_SID');
    const authToken = this.configService.get<string>('TWILIO_AUTH_TOKEN');
    this.fromNumber = this.configService.get<string>('TWILIO_PHONE_NUMBER');

    if (accountSid && authToken && this.fromNumber) {
      try {
        this.twilioClient = twilio(accountSid, authToken);
        this.isEnabled = true;
        this.logger.log('✅ Service SMS Twilio initialisé avec succès');
      } catch (error) {
        this.logger.warn('⚠️ Erreur lors de l\'initialisation de Twilio:', error);
        this.isEnabled = false;
      }
    } else {
      this.logger.warn(
        '⚠️ Twilio non configuré. Variables manquantes: ' +
          [
            !accountSid && 'TWILIO_ACCOUNT_SID',
            !authToken && 'TWILIO_AUTH_TOKEN',
            !this.fromNumber && 'TWILIO_PHONE_NUMBER',
          ]
            .filter(Boolean)
            .join(', '),
      );
      this.logger.warn('📝 Les codes OTP seront loggés dans la console en mode développement');
    }
  }

  /**
   * Envoie un SMS avec le code OTP
   * @param to Numéro de téléphone destinataire (format E.164, ex: +221771234567)
   * @param code Code OTP à 6 chiffres
   * @returns Promise<boolean> true si l'envoi a réussi, false sinon
   */
  async sendOtp(to: string, code: string): Promise<boolean> {
    // Nettoyer le numéro pour s'assurer qu'il est au format E.164
    const cleanPhone = this.normalizePhoneNumber(to);

    if (!cleanPhone) {
      this.logger.error(`❌ Numéro de téléphone invalide: ${to}`);
      return false;
    }

    const message = `Votre code de vérification VBS est: ${code}. Valide pendant 30 jours. Ne partagez jamais ce code.`;

    // Si Twilio n'est pas configuré, logger le code (mode développement)
    if (!this.isEnabled || !this.twilioClient) {
      this.logger.log(`📱 [DEV] SMS OTP pour ${cleanPhone}: ${code}`);
      this.logger.log(`📝 Message: ${message}`);
      return true; // Retourner true pour ne pas bloquer le flux en développement
    }

    try {
      const result = await this.twilioClient.messages.create({
        body: message,
        from: this.fromNumber!,
        to: cleanPhone,
      });

      if (result.sid) {
        this.logger.log(`✅ SMS OTP envoyé à ${cleanPhone} (SID: ${result.sid})`);
        return true;
      } else {
        this.logger.error(`❌ Échec envoi SMS à ${cleanPhone}: pas de SID retourné`);
        return false;
      }
    } catch (error: any) {
      this.logger.error(`❌ Erreur Twilio pour ${cleanPhone}:`, error.message || error);
      
      // En cas d'erreur, logger quand même le code en développement
      if (process.env.NODE_ENV === 'development') {
        this.logger.warn(`📱 [FALLBACK DEV] Code OTP pour ${cleanPhone}: ${code}`);
      }
      
      return false;
    }
  }

  /**
   * Normalise un numéro de téléphone au format E.164
   * @param phone Numéro de téléphone (peut être dans différents formats)
   * @returns Numéro normalisé au format E.164 ou null si invalide
   */
  private normalizePhoneNumber(phone: string): string | null {
    if (!phone) return null;

    // Nettoyer le numéro (enlever espaces, tirets, parenthèses)
    let cleaned = phone.replace(/[\s\-\(\)]/g, '');

    // Si le numéro commence déjà par +, le retourner tel quel
    if (cleaned.startsWith('+')) {
      return cleaned;
    }

    // Si le numéro commence par 00, remplacer par +
    if (cleaned.startsWith('00')) {
      cleaned = '+' + cleaned.substring(2);
      return cleaned;
    }

    // Pour les numéros sénégalais (commencent par 7 et ont 9 chiffres)
    if (/^7\d{8}$/.test(cleaned)) {
      return '+221' + cleaned;
    }

    // Si le numéro commence par 221 sans +, ajouter le +
    if (/^221\d{9}$/.test(cleaned)) {
      return '+' + cleaned;
    }

    // Si le numéro a déjà un indicatif mais sans +, l'ajouter
    if (/^\d{10,15}$/.test(cleaned)) {
      // Supposer que c'est un numéro international sans +
      return '+' + cleaned;
    }

    // Si le numéro est déjà au format E.164, le retourner
    if (/^\+\d{10,15}$/.test(cleaned)) {
      return cleaned;
    }

    this.logger.warn(`⚠️ Format de numéro non reconnu: ${phone} (nettoyé: ${cleaned})`);
    return null;
  }

  /**
   * Envoie une notification SMS générique
   * @param to Numéro de téléphone destinataire (format E.164, ex: +221771234567)
   * @param message Message à envoyer
   * @returns Promise<boolean> true si l'envoi a réussi, false sinon
   */
  async sendNotification(to: string, message: string): Promise<boolean> {
    const cleanPhone = this.normalizePhoneNumber(to);

    if (!cleanPhone) {
      this.logger.error(`❌ Numéro de téléphone invalide: ${to}`);
      return false;
    }

    // Si Twilio n'est pas configuré, logger le message (mode développement)
    if (!this.isEnabled || !this.twilioClient) {
      this.logger.log(`📱 [DEV] Notification SMS pour ${cleanPhone}:`);
      this.logger.log(`📝 Message: ${message}`);
      return true; // Retourner true pour ne pas bloquer le flux en développement
    }

    try {
      const result = await this.twilioClient.messages.create({
        body: message,
        from: this.fromNumber!,
        to: cleanPhone,
      });

      if (result.sid) {
        this.logger.log(`✅ Notification SMS envoyée à ${cleanPhone} (SID: ${result.sid})`);
        return true;
      } else {
        this.logger.error(`❌ Échec envoi SMS à ${cleanPhone}: pas de SID retourné`);
        return false;
      }
    } catch (error: any) {
      this.logger.error(`❌ Erreur Twilio pour ${cleanPhone}:`, error.message || error);
      
      // En cas d'erreur, logger quand même le message en développement
      if (process.env.NODE_ENV === 'development') {
        this.logger.warn(`📱 [FALLBACK DEV] Notification pour ${cleanPhone}: ${message}`);
      }
      
      return false;
    }
  }

  /**
   * Vérifie si le service SMS est activé et configuré
   */
  isSmsEnabled(): boolean {
    return this.isEnabled;
  }
}
