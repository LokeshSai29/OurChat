const express = require('express');
const { body, validationResult } = require('express-validator');
const Message = require('../models/Message');
const Contact = require('../models/Contact');
const auth = require('../middleware/auth');

const router = express.Router();

// GET /messages/:contactId
router.get('/:contactId', auth, async (req, res) => {
  try {
    const { contactId } = req.params;
    const userId = req.user._id;

    // Verify contact exists
    const contact = await Contact.findOne({
      userId,
      contactId
    });

    if (!contact) {
      return res.status(404).json({ message: 'Contact not found' });
    }

    // Get messages between users
    const messages = await Message.find({
      $or: [
        { senderId: userId, receiverId: contactId },
        { senderId: contactId, receiverId: userId }
      ]
    })
    .sort({ timestamp: 1 })
    .limit(100); // Limit to last 100 messages

    // Mark messages as read when user opens the chat
    await Message.updateMany(
      {
        senderId: contactId,
        receiverId: userId,
        isRead: false
      },
      {
        isRead: true
      }
    );

    res.json({ messages });

  } catch (error) {
    console.error('Get messages error:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

// GET /messages/unread/count - Get unread message counts for all contacts
router.get('/unread/count', auth, async (req, res) => {
  try {
    const userId = req.user._id;

    // Get all contacts
    const contacts = await Contact.find({ userId });

    // Get unread message counts for each contact
    const unreadCounts = await Promise.all(
      contacts.map(async (contact) => {
        const count = await Message.countDocuments({
          senderId: contact.contactId,
          receiverId: userId,
          isRead: false
        });

        return {
          contactId: contact.contactId,
          unreadCount: count
        };
      })
    );

    res.json({ unreadCounts });

  } catch (error) {
    console.error('Get unread counts error:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

// POST /messages/:contactId/mark-read - Mark messages as read for a specific contact
router.post('/:contactId/mark-read', auth, async (req, res) => {
  try {
    const { contactId } = req.params;
    const userId = req.user._id;

    // Verify contact exists
    const contact = await Contact.findOne({
      userId,
      contactId
    });

    if (!contact) {
      return res.status(404).json({ message: 'Contact not found' });
    }

    // Mark messages as read
    await Message.updateMany(
      {
        senderId: contactId,
        receiverId: userId,
        isRead: false
      },
      {
        isRead: true
      }
    );

    res.json({ message: 'Messages marked as read' });

  } catch (error) {
    console.error('Mark messages as read error:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

// POST /messages/:contactId
router.post('/:contactId', [
  body('message').isLength({ min: 1, max: 1000 }).trim()
], auth, async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }

    const { contactId } = req.params;
    const { message } = req.body;
    const userId = req.user._id;

    // Verify contact exists
    const contact = await Contact.findOne({
      userId,
      contactId
    });

    if (!contact) {
      return res.status(404).json({ message: 'Contact not found' });
    }

    // Create new message
    const newMessage = new Message({
      senderId: userId,
      receiverId: contactId,
      message
    });

    await newMessage.save();

    // Emit socket event for real-time messaging
    req.app.get('io').to(contactId.toString()).emit('newMessage', {
      message: newMessage.toJSON(),
      sender: req.user.toPublicJSON()
    });

    res.status(201).json({
      message: 'Message sent successfully',
      data: newMessage.toJSON()
    });

  } catch (error) {
    console.error('Send message error:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

module.exports = router;

