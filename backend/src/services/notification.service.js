const NotificationService = {
  async sendSMS(to, message) {
    console.log(`[SMS] À ${to}: ${message}`);
    return true;
  },

  async sendEmail(to, subject, body) {
    console.log(`[EMAIL] À ${to} | Sujet: ${subject} | Corps: ${body}`);
    return true;
  },

  async notifyEmergencyContacts(contacts, alert) {
    for (const contact of contacts) {
      const msg = `URGENT - SafeGuardian: Alerte SOS de ${alert.user}. Localisation: ${alert.location}. Veuillez intervenir.`;
      await this.sendSMS(contact.phone, msg);
      if (contact.email) {
        await this.sendEmail(contact.email, "Alerte SOS SafeGuardian", msg);
      }
    }
  }
};

module.exports = NotificationService;
