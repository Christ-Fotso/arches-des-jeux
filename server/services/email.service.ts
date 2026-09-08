import { Resend } from 'resend';
import fs from 'fs';
import type { Order, OrderItem, User } from '@shared/schema';

class EmailService {
  private resend: Resend | null = null;
  private fromEmail: string;

  constructor() {
    this.fromEmail = "L'Arche des jeux <contact@larchedesjeux.fr>";
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
   * Envoie un email de confirmation de commande (client)
   */
  async sendOrderConfirmationEmail(
    order: Order,
    email: string,
    name: string,
    items: Array<OrderItem & { productTitle?: string }> = []
  ): Promise<boolean> {
    if (!this.resend) {
      console.warn('Email service not available');
      return false;
    }

    // Tableau des articles commandés
    const itemsRows = items.length > 0
      ? items.map(item => `
        <tr style="border-bottom: 1px solid #eee;">
          <td style="padding: 10px 8px;">${item.productTitle || `Article #${item.productId.substring(0, 8)}`}</td>
          <td style="padding: 10px 8px; text-align: center;">${item.quantity}</td>
          <td style="padding: 10px 8px; text-align: right;">${parseFloat(item.priceAtPurchase).toFixed(2)} €</td>
          <td style="padding: 10px 8px; text-align: right; font-weight: bold;">${(parseFloat(item.priceAtPurchase) * item.quantity).toFixed(2)} €</td>
        </tr>
      `).join('')
      : `<tr><td colspan="4" style="padding: 10px; color: #999; text-align: center;">Détails non disponibles</td></tr>`;

    // Adresse complète
    const addressBlock = [
      order.firstName && order.lastName ? `${order.firstName} ${order.lastName}` : '',
      order.address || '',
      order.addressLine2 || '',
      order.postalCode && order.city ? `${order.postalCode} ${order.city}` : order.city || '',
      order.country || '',
    ].filter(Boolean).join('<br>');

    const htmlContent = `
      <div style="font-family: Arial, sans-serif; max-width: 640px; margin: 0 auto; border: 1px solid #e0e0e0; border-radius: 8px; overflow: hidden;">

        <div style="background-color: #1a1a1a; color: #fff; padding: 28px 24px;">
          <h2 style="margin: 0; font-size: 22px;">✅ Merci pour votre commande !</h2>
          <p style="margin: 8px 0 0; color: #aaa; font-size: 14px;">Commande #${order.id.substring(0, 8)} &mdash; ${this.getStatusLabel(order.status)}</p>
        </div>

        <div style="padding: 24px;">

          <p style="margin: 0 0 20px; font-size: 15px;">Bonjour <strong>${name}</strong>,</p>
          <p style="margin: 0 0 24px; color: #555;">Nous avons bien reçu votre commande. Vous trouverez ci-dessous le récapitulatif de votre achat.</p>

          <h3 style="margin: 0 0 12px; font-size: 15px; color: #333; border-bottom: 2px solid #1a1a1a; padding-bottom: 8px;">🧾 Articles commandés</h3>
          <table style="width: 100%; border-collapse: collapse; font-size: 14px; margin-bottom: 24px;">
            <thead>
              <tr style="background-color: #f5f5f5;">
                <th style="padding: 10px 8px; text-align: left; color: #555;">Produit</th>
                <th style="padding: 10px 8px; text-align: center; color: #555;">Qté</th>
                <th style="padding: 10px 8px; text-align: right; color: #555;">Prix unit.</th>
                <th style="padding: 10px 8px; text-align: right; color: #555;">Total</th>
              </tr>
            </thead>
            <tbody>
              ${itemsRows}
            </tbody>
            <tfoot>
              ${order.discountAmount && parseFloat(order.discountAmount) > 0 ? `
              <tr>
                <td colspan="3" style="padding: 10px 8px; text-align: right; color: #28a745;">Remise :</td>
                <td style="padding: 10px 8px; text-align: right; color: #28a745;">-${parseFloat(order.discountAmount).toFixed(2)} €</td>
              </tr>` : ''}
              ${order.shippingCost ? `
              <tr>
                <td colspan="3" style="padding: 10px 8px; text-align: right; color: #666;">Frais de livraison${order.shippingCarrier ? ` (${order.shippingCarrier})` : ''} :</td>
                <td style="padding: 10px 8px; text-align: right; color: #666;">${parseFloat(order.shippingCost).toFixed(2)} €</td>
              </tr>` : ''}
              <tr style="background-color: #1a1a1a; color: #fff;">
                <td colspan="3" style="padding: 12px 8px; text-align: right; font-weight: bold;">TOTAL :</td>
                <td style="padding: 12px 8px; text-align: right; font-weight: bold; font-size: 16px;">${parseFloat(order.totalAmount).toFixed(2)} €</td>
              </tr>
            </tfoot>
          </table>

          ${addressBlock ? `
          <div style="background-color: #f9f9f9; border-radius: 6px; padding: 16px; margin-bottom: 24px;">
            <h3 style="margin: 0 0 10px; font-size: 15px; color: #333;">📦 Adresse de livraison</h3>
            <p style="margin: 0; line-height: 1.8; color: #555;">${addressBlock}</p>
          </div>` : ''}

          <p style="color: #555; font-size: 14px;">Vous recevrez un email dès que votre colis sera expédié.</p>

          <div style="text-align: center; margin: 30px 0;">
            <a href="${process.env.FRONTEND_URL || 'http://localhost:5000'}/my-orders"
               style="background-color: #1a1a1a; color: #fff; padding: 14px 36px; text-decoration: none; border-radius: 6px; display: inline-block; font-size: 15px;">
              Suivre ma commande
            </a>
          </div>

        </div>

        <div style="background-color: #f5f5f5; padding: 16px; text-align: center; font-size: 12px; color: #999; border-top: 1px solid #e0e0e0;">
          Cordialement &mdash; L'&eacute;quipe L'Arche des jeux
        </div>
      </div>
    `;

    console.log(`[EmailService] Preparing order confirmation email for ${email} (Order #${order.id})`);

    try {
      const { data, error } = await this.resend.emails.send({
        from: this.fromEmail,
        to: email,
        subject: `✅ Confirmation commande #${order.id.substring(0, 8)} — ${parseFloat(order.totalAmount).toFixed(2)} €`,
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
   * Envoie une notification à TOUS les admins avec tous les détails de la commande
   */
  async sendAdminOrderNotification(
    order: Order,
    items: Array<OrderItem & { productTitle?: string }>,
    customerName: string,
    customerEmail: string,
    adminEmails: string[] = ['Larchedesjeux@gmail.com']
  ): Promise<boolean> {
    if (!this.resend) {
      console.warn('Email service not available');
      return false;
    }

    if (adminEmails.length === 0) {
      console.warn('[EmailService] No admin emails to notify');
      return false;
    }

    // Tableau des articles commandés
    const itemsRows = items.map(item => `
      <tr style="border-bottom: 1px solid #eee;">
        <td style="padding: 10px 8px;">${item.productTitle || `Produit #${item.productId.substring(0, 8)}`}</td>
        <td style="padding: 10px 8px; text-align: center;">${item.quantity}</td>
        <td style="padding: 10px 8px; text-align: right;">${parseFloat(item.priceAtPurchase).toFixed(2)} €</td>
        <td style="padding: 10px 8px; text-align: right; font-weight: bold;">${(parseFloat(item.priceAtPurchase) * item.quantity).toFixed(2)} €</td>
      </tr>
    `).join('');

    // Adresse complète
    const addressBlock = [
      order.firstName && order.lastName ? `${order.firstName} ${order.lastName}` : '',
      order.address || '',
      order.addressLine2 || '',
      order.postalCode && order.city ? `${order.postalCode} ${order.city}` : order.city || '',
      order.country || '',
    ].filter(Boolean).join('<br>');

    const htmlContent = `
      <div style="font-family: Arial, sans-serif; max-width: 700px; margin: 0 auto; border: 1px solid #ddd; border-radius: 8px; overflow: hidden;">
        
        <!-- En-tête -->
        <div style="background-color: #1a1a1a; color: #fff; padding: 24px;">
          <h2 style="margin: 0; font-size: 20px;">🛒 Nouvelle commande reçue !</h2>
          <p style="margin: 8px 0 0; color: #aaa; font-size: 14px;">Commande #${order.id.substring(0, 8)}</p>
        </div>

        <div style="padding: 24px;">

          <!-- Infos client -->
          <div style="background-color: #f9f9f9; border-radius: 6px; padding: 16px; margin-bottom: 20px;">
            <h3 style="margin: 0 0 12px; font-size: 15px; color: #555;">👤 Client</h3>
            <p style="margin: 4px 0;"><strong>Nom :</strong> ${customerName}</p>
            <p style="margin: 4px 0;"><strong>Email :</strong> <a href="mailto:${customerEmail}">${customerEmail}</a></p>
          </div>

          <!-- Adresse de livraison -->
          <div style="background-color: #f0f4ff; border-radius: 6px; padding: 16px; margin-bottom: 20px;">
            <h3 style="margin: 0 0 12px; font-size: 15px; color: #555;">📦 Adresse de livraison</h3>
            <p style="margin: 0; line-height: 1.8;">${addressBlock || '<em style="color:#999">Non renseignée</em>'}</p>
            ${order.shippingCarrier ? `<p style="margin: 8px 0 0; font-size: 13px; color: #666;">Transporteur : <strong>${order.shippingCarrier}</strong> — ${order.shippingService || ''}</p>` : ''}
          </div>

          <!-- Articles commandés -->
          <h3 style="margin: 0 0 12px; font-size: 15px; color: #555;">🧾 Articles commandés</h3>
          <table style="width: 100%; border-collapse: collapse; font-size: 14px;">
            <thead>
              <tr style="background-color: #f5f5f5;">
                <th style="padding: 10px 8px; text-align: left;">Produit</th>
                <th style="padding: 10px 8px; text-align: center;">Qté</th>
                <th style="padding: 10px 8px; text-align: right;">Prix unitaire</th>
                <th style="padding: 10px 8px; text-align: right;">Sous-total</th>
              </tr>
            </thead>
            <tbody>
              ${itemsRows}
            </tbody>
            <tfoot>
              ${order.discountAmount && parseFloat(order.discountAmount) > 0 ? `
              <tr>
                <td colspan="3" style="padding: 10px 8px; text-align: right; color: #28a745;">Remise :</td>
                <td style="padding: 10px 8px; text-align: right; color: #28a745;">-${parseFloat(order.discountAmount).toFixed(2)} €</td>
              </tr>` : ''}
              ${order.shippingCost ? `
              <tr>
                <td colspan="3" style="padding: 10px 8px; text-align: right; color: #666;">Frais de livraison :</td>
                <td style="padding: 10px 8px; text-align: right; color: #666;">${parseFloat(order.shippingCost).toFixed(2)} €</td>
              </tr>` : ''}
              <tr style="background-color: #1a1a1a; color: #fff;">
                <td colspan="3" style="padding: 12px 8px; text-align: right; font-weight: bold;">TOTAL :</td>
                <td style="padding: 12px 8px; text-align: right; font-weight: bold; font-size: 16px;">${parseFloat(order.totalAmount).toFixed(2)} €</td>
              </tr>
            </tfoot>
          </table>

          <!-- Lien admin -->
          <div style="text-align: center; margin-top: 30px;">
            <a href="${process.env.FRONTEND_URL || 'http://localhost:5000'}/admin/orders"
               style="background-color: #1a1a1a; color: #fff; padding: 12px 30px; text-decoration: none; border-radius: 5px; display: inline-block;">
              Gérer les commandes
            </a>
          </div>

        </div>

        <div style="background-color: #f5f5f5; padding: 16px; text-align: center; font-size: 12px; color: #999;">
          L'Arche des jeux — Notification automatique
        </div>
      </div>
    `;

    try {
      const { data, error } = await this.resend.emails.send({
        from: this.fromEmail,
        to: adminEmails,
        subject: `🛒 Nouvelle commande #${order.id.substring(0, 8)} — ${parseFloat(order.totalAmount).toFixed(2)} €`,
        html: htmlContent,
      });

      if (error) {
        console.error(`❌ [EmailService] Resend API Error (Admin notification):`, error);
        return false;
      }

      console.log(`✅ [EmailService] Admin order notification sent to ${adminEmails.join(', ')} (ID: ${data?.id})`);
      return true;
    } catch (err) {
      console.error(`❌ [EmailService] Exception sending admin notification:`, err);
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
        from: 'L\'Arche des jeux <support@larchedesjeux.fr>', // Utilisation explicite de support@
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
