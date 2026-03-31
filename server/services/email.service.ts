import { Resend } from 'resend';
import fs from 'fs';
import type { Order, User } from '@shared/schema';

class EmailService {
  private resend: Resend | null = null;
  private fromEmail: string;

  constructor() {
    this.fromEmail = "L'Arche des jeux <contact@larchedesjeux.com>";
    this.initializeResend();
  }

  private initializeResend() {
    let apiKey = process.env.RESEND_API_KEY;
    const secretPath = "/run/secrets/resend_api_key";
    
    if (fs.existsSync(secretPath)) {
      apiKey = fs.readFileSync(secretPath, "utf8").trim();
    }

    if (!apiKey) {
      console.warn('⚠️  Resend API key not configured. Email features will be disabled.');
      return;
    }

    this.resend = new Resend(apiKey);
    console.log('✅ Email service (Resend) ready');
  }

  /**
   * Envoie un email de réinitialisation de mot de passe
   */
  async sendPasswordResetEmail(email: string, resetToken: string): Promise<boolean> {
    if (!this.resend) {
      console.warn('Email service not available');
      return false;
    }

    const frontendUrl = process.env.FRONTEND_URL || 'http://localhost:5000';
    const resetLink = `${frontendUrl}/reset-password/${resetToken}`;

    const htmlContent = `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
        <h2 style="color: #333;">Réinitialisation de mot de passe</h2>
        <p>Bonjour,</p>
        <p>Vous avez demandé la réinitialisation de votre mot de passe L'Arche des jeux.</p>
        <p>Cliquez sur le bouton ci-dessous pour définir un nouveau mot de passe :</p>
        <div style="text-align: center; margin: 30px 0;">
          <a href="${resetLink}" 
             style="background-color: #000; color: #fff; padding: 12px 30px; text-decoration: none; border-radius: 5px; display: inline-block;">
            Réinitialiser mon mot de passe
          </a>
        </div>
        <p style="color: #666; font-size: 14px;">
          Ce lien expire dans 1 heure.
        </p>
        <p style="color: #666; font-size: 14px;">
          Si vous n'avez pas demandé cette réinitialisation, ignorez cet email.
        </p>
        <hr style="border: none; border-top: 1px solid #eee; margin: 30px 0;">
        <p style="color: #999; font-size: 12px;">
          Cordialement,<br>
          L'équipe L'Arche des jeux
        </p>
      </div>
    `;

    try {
      const { data, error } = await this.resend.emails.send({
        from: this.fromEmail,
        to: email,
        subject: "Réinitialisation de votre mot de passe L'Arche des jeux",
        html: htmlContent,
      });
      
      if (error) {
        console.error('❌ Resend API Error (Password Reset):', error);
        return false;
      }
      
      console.log(`✅ Password reset email sent to ${email} (ID: ${data?.id})`);
      return true;
    } catch (err) {
      console.error('❌ Exception sending password reset email:', err);
      return false;
    }
  }

  /**
   * Envoie un email de confirmation de commande
   */
  async sendOrderConfirmationEmail(order: Order, email: string, name: string): Promise<boolean> {
    if (!this.resend) {
      console.warn('Email service not available');
      return false;
    }

    const htmlContent = `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
        <h2 style="color: #333;">Merci pour votre commande !</h2>
        <p>Bonjour ${name},</p>
        <p>Nous avons bien reçu votre commande et nous vous en remercions.</p>
        
        <div style="background-color: #f5f5f5; padding: 20px; border-radius: 5px; margin: 20px 0;">
          <h3 style="margin-top: 0;">Détails de la commande</h3>
          <p><strong>Numéro de commande :</strong> #${order.id.substring(0, 8)}</p>
          <p><strong>Montant total :</strong> ${order.totalAmount} CHF</p>
          <p><strong>Statut :</strong> ${this.getStatusLabel(order.status)}</p>
        </div>

        ${order.address ? `
        <div style="margin: 20px 0;">
          <h3>Adresse de livraison</h3>
          <p>
            ${order.address}<br>
            ${order.city ? order.city : ''}
          </p>
        </div>
        ` : ''}

        <p>Vous recevrez un email dès l'expédition de votre colis.</p>
        
        <div style="text-align: center; margin: 30px 0;">
          <a href="${process.env.FRONTEND_URL || 'http://localhost:5000'}/my-orders" 
             style="background-color: #000; color: #fff; padding: 12px 30px; text-decoration: none; border-radius: 5px; display: inline-block;">
            Suivre ma commande
          </a>
        </div>

        <hr style="border: none; border-top: 1px solid #eee; margin: 30px 0;">
        <p style="color: #999; font-size: 12px;">
          Cordialement,<br>
          L'équipe L'Arche des jeux
        </p>
      </div>
    `;

    console.log(`[EmailService] Preparing order confirmation email for ${email} (Order #${order.id})`);

    try {
      const { data, error } = await this.resend.emails.send({
        from: this.fromEmail,
        to: email,
        bcc: 'Larchedesjeux@gmail.com', // CC'ing the admin as requested
        subject: `Confirmation de votre commande #${order.id.substring(0, 8)}`,
        html: htmlContent,
      });

      if (error) {
        console.error(`❌ [EmailService] Resend API Error (Order Confirmation for ${email}):`, error);
        return false;
      }

      console.log(`✅ [EmailService] Order confirmation email sent successfully to ${email} (ID: ${data?.id})`);
      return true;
    } catch (err) {
      console.error(`❌ [EmailService] Exception sending order confirmation to ${email}:`, err);
      return false;
    }
  }

  /**
   * Envoie un email de changement de statut de commande
   */
  async sendOrderStatusEmail(order: Order, user: User, newStatus: string, trackingNumber?: string): Promise<boolean> {
    if (!this.resend) {
      console.warn('Email service not available');
      return false;
    }

    const statusLabel = this.getStatusLabel(newStatus);
    const statusMessage = this.getStatusMessage(newStatus);

    const htmlContent = `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
        <h2 style="color: #333;">Mise à jour de votre commande</h2>
        <p>Bonjour ${user.firstName || user.name},</p>
        <p>Votre commande #${order.id.substring(0, 8)} a été mise à jour.</p>
        
        <div style="background-color: #f5f5f5; padding: 20px; border-radius: 5px; margin: 20px 0;">
          <h3 style="margin-top: 0;">Nouveau statut</h3>
          <p style="font-size: 18px; color: #000;"><strong>${statusLabel}</strong></p>
          <p>${statusMessage}</p>
          ${trackingNumber ? `
            <p style="margin-top: 15px;">
              <strong>Numéro de suivi :</strong> ${trackingNumber}
            </p>
          ` : ''}
        </div>

        <div style="text-align: center; margin: 30px 0;">
          <a href="${process.env.FRONTEND_URL || 'http://localhost:5173'}/my-orders" 
             style="background-color: #000; color: #fff; padding: 12px 30px; text-decoration: none; border-radius: 5px; display: inline-block;">
            Voir ma commande
          </a>
        </div>

        <hr style="border: none; border-top: 1px solid #eee; margin: 30px 0;">
        <p style="color: #999; font-size: 12px;">
          Cordialement,<br>
          L'équipe L'Arche des jeux
        </p>
      </div>
    `;

    console.log(`[EmailService] Preparing order status update email for ${user.email} (Order #${order.id}, New Status: ${newStatus})`);

    try {
      const { data, error } = await this.resend.emails.send({
        from: this.fromEmail,
        to: user.email,
        subject: `Mise à jour de votre commande #${order.id.substring(0, 8)}`,
        html: htmlContent,
      });

      if (error) {
        console.error(`❌ [EmailService] Resend API Error (Order Status for ${user.email}):`, error);
        return false;
      }

      console.log(`✅ [EmailService] Order status email sent successfully to ${user.email} (ID: ${data?.id})`);
      return true;
    } catch (err) {
      console.error(`❌ [EmailService] Exception sending order status to ${user.email}:`, err);
      return false;
    }
  }

  private getStatusLabel(status: string): string {
    const labels: Record<string, string> = {
      'PENDING': 'En attente',
      'CONFIRMED': 'Confirmée',
      'PROCESSING': 'En traitement',
      'SHIPPED': 'Expédiée',
      'DELIVERED': 'Livrée',
      'CANCELLED': 'Annulée',
    };
    return labels[status] || status;
  }

  private getStatusMessage(status: string): string {
    const messages: Record<string, string> = {
      'PENDING': 'Votre commande est en attente de confirmation.',
      'CONFIRMED': 'Votre commande a été confirmée et sera bientôt traitée.',
      'PROCESSING': 'Votre commande est en cours de préparation.',
      'SHIPPED': 'Votre colis a été expédié et est en route vers vous !',
      'DELIVERED': 'Votre colis a été livré. Nous espérons que vous apprécierez vos produits !',
      'CANCELLED': 'Votre commande a été annulée.',
    };
    return messages[status] || 'Erreur inconnue';
  }

  /**
   * Envoie une notification à l'admin pour un nouveau message de support
   */
  async sendSupportNotificationToAdmin(name: string, email: string, message: string): Promise<boolean> {
    if (!this.resend) return false;

    const htmlContent = `
      <h2>Nouveau message de support</h2>
      <p><strong>De :</strong> ${name} (${email})</p>
      <p><strong>Message :</strong></p>
      <blockquote style="background: #f9f9f9; padding: 15px; border-left: 5px solid #ccc;">
        ${message.replace(/\n/g, '<br/>')}
      </blockquote>
      <p>Connectez-vous au panneau d'administration pour y répondre.</p>
    `;

    try {
      const { error } = await this.resend.emails.send({
        from: this.fromEmail,
        to: 'Larchedesjeux@gmail.com',
        subject: `Nouveau Message de Support: ${name}`,
        html: htmlContent,
      });
      if (error) console.error('Erreur resend:', error);
      return !error;
    } catch (err) {
      console.error('Exception support notification:', err);
      return false;
    }
  }

  /**
   * Envoie la réponse de l'admin au client
   */
  async sendSupportReplyToCustomer(name: string, toEmail: string, replyContent: string, originalMessage: string): Promise<boolean> {
    if (!this.resend) return false;

    const htmlContent = `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
        <h2>Bonjour ${name},</h2>
        <p>Suite à votre demande :</p>
        <blockquote style="background: #f9f9f9; padding: 10px; font-style: italic; color: #555; border-left: 3px solid #ccc;">
          ${originalMessage.substring(0, 150)}${originalMessage.length > 150 ? '...' : ''}
        </blockquote>
        <br/>
        <p><strong>Voici notre réponse :</strong></p>
        <p style="white-space: pre-wrap;">${replyContent}</p>
        <br/>
        <br/>
        <p>L'équipe L'Arche des jeux</p>
      </div>
    `;

    try {
      const { error } = await this.resend.emails.send({
        from: 'L\'Arche des jeux <support@larchedesjeux.com>', // Utilisation explicite de support@
        to: toEmail,
        bcc: 'Larchedesjeux@gmail.com', // Copie à l'admin
        subject: `Re: Votre demande de support chez L'Arche des jeux`,
        html: htmlContent,
      });
      if (error) console.error('Erreur resend (réponse client):', error);
      return !error;
    } catch (err) {
      console.error('Exception envoyer réponse:', err);
      return false;
    }
  }
}

export const emailService = new EmailService();
