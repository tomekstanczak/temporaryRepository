const mongoose = require("mongoose");

const contactSchema = new mongoose.Schema({
  name: {
    type: String,
    required: [true, "Set name for contact"],
  },
  email: {
    type: String,
  },
  phone: {
    type: String,
  },
  favorite: {
    type: Boolean,
    default: false,
  },
});

contactSchema.statics.getAll = function () {
  return Contact.find();
};

const Contact = mongoose.model("contact", contactSchema, "contacts");

module.exports = Contact;
