const express = require('express');
const { body, validationResult } = require('express-validator');
const Contact = require('../models/Contact');
const User = require('../models/User');
const auth = require('../middleware/auth');

const router = express.Router();

// POST /contacts/add
router.post('/add', [
  body('uniqueId').isLength({ min: 3, max: 10 }).trim()
], auth, async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }

    const { uniqueId } = req.body;
    const userId = req.user._id;

    // Find contact by uniqueId
    const contact = await User.findOne({ uniqueId });
    if (!contact) {
      return res.status(404).json({ message: 'User with this unique ID not found' });
    }

    // Check if trying to add self
    if (contact._id.toString() === userId.toString()) {
      return res.status(400).json({ message: 'Cannot add yourself as a contact' });
    }

    // Check if contact already exists
    const existingContact = await Contact.findOne({
      userId,
      contactId: contact._id
    });

    if (existingContact) {
      return res.status(400).json({ message: 'Contact already exists' });
    }

    // Add contact
    const newContact = new Contact({
      userId,
      contactId: contact._id
    });

    await newContact.save();

    res.status(201).json({
      message: 'Contact added successfully',
      contact: contact.toPublicJSON()
    });

  } catch (error) {
    console.error('Add contact error:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

// GET /contacts
router.get('/', auth, async (req, res) => {
  try {
    const userId = req.user._id;

    // Get all contacts for the user
    const contacts = await Contact.find({ userId })
      .populate('contactId', 'email uniqueId isOnline lastSeen')
      .sort({ createdAt: -1 });

    // Format contacts
    const formattedContacts = contacts.map(contact => ({
      _id: contact.contactId._id,
      email: contact.contactId.email,
      uniqueId: contact.contactId.uniqueId,
      isOnline: contact.contactId.isOnline,
      lastSeen: contact.contactId.lastSeen
    }));

    res.json({ contacts: formattedContacts });

  } catch (error) {
    console.error('Get contacts error:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

module.exports = router;

