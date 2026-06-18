const ContactModel = require("../models/contact.model");

const ContactController = {
  getAll(req, res) {
    res.json(ContactModel.getAll());
  },

  create(req, res) {
    const { name, phone, email, relation } = req.body;
    const contact = ContactModel.create({
      id: "contact-" + Date.now(),
      name,
      phone,
      email,
      relation
    });
    res.json(contact);
  },

  remove(req, res) {
    const { id } = req.params;
    ContactModel.remove(id);
    res.json({ success: true, message: "Contact supprimé." });
  }
};

module.exports = ContactController;
