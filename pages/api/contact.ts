import type { NextApiRequest, NextApiResponse } from 'next';
import * as fs from 'fs';
import * as path from 'path';
import nodemailer from 'nodemailer';

interface ContactRequest {
  name: string;
  email: string;
  organization?: string;
  subject: string;
  message: string;
}

interface ContactResponse {
  success: boolean;
  message: string;
}

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse<ContactResponse>
) {
  if (req.method !== 'POST') {
    return res.status(405).json({ success: false, message: 'Method not allowed' });
  }

  const { name, email, organization, subject, message } = req.body as ContactRequest;

  // Validation
  if (!name || !email || !subject || !message) {
    return res.status(400).json({
      success: false,
      message: 'Missing required fields: name, email, subject, message',
    });
  }

  try {
    // Configure email based on subject
    let recipientEmail = 'support@center.gtixt.com';
    
    if (subject === 'api') {
      recipientEmail = 'first@api.gtixt.com';
    } else if (subject === 'legal') {
      recipientEmail = 'legal@contact.gtixt.com';
    } else if (subject === 'privacy') {
      recipientEmail = 'privacy@contact.gtixt.com';
    } else if (subject === 'support') {
      recipientEmail = 'support@center.gtixt.com';
    }

    const contactData = {
      id: `msg-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
      name,
      email,
      organization: organization || '',
      subject,
      message,
      recipientEmail,
      timestamp: new Date().toISOString(),
      status: 'received',
    };

    // Save to JSON file in public directory (accessible)
    const publicDir = path.join(process.cwd(), 'public', '.data');
    const contactsFile = path.join(publicDir, 'contacts.json');

    if (!fs.existsSync(publicDir)) {
      fs.mkdirSync(publicDir, { recursive: true });
    }

    let allContacts: any[] = [];
    try {
      if (fs.existsSync(contactsFile)) {
        const data = fs.readFileSync(contactsFile, 'utf-8');
        allContacts = JSON.parse(data);
      }
    } catch (parseError) {
      console.error('Error parsing contacts file:', parseError);
      allContacts = [];
    }

    allContacts.push(contactData);
    fs.writeFileSync(contactsFile, JSON.stringify(allContacts, null, 2));

    // Log the message
    console.log('📧 Contact Form Submission:', {
      ...contactData,
    });

    // Send email via Brevo SMTP
    try {
      const transporter = nodemailer.createTransport({
        host: process.env.SMTP_HOST || 'smtp-relay.brevo.com',
        port: parseInt(process.env.SMTP_PORT || '587'),
        secure: false,
        auth: {
          user: process.env.SMTP_USER,
          pass: process.env.SMTP_PASS,
        },
      });

      const subjectLabels: Record<string, string> = {
        api: 'API Access',
        support: 'Support',
        legal: 'Legal',
        privacy: 'Privacy',
      };

      const mailOptions = {
        from: `"GTIXT Contact Form" <${process.env.SMTP_FROM || 'contact@gtixt.com'}>`,
        to: recipientEmail,
        replyTo: email,
        subject: `[GTIXT Contact] ${subjectLabels[subject] || subject} - From: ${name}`,
        html: `
          <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
            <h2 style="color: #3b82f6; border-bottom: 2px solid #3b82f6; padding-bottom: 10px;">
              📧 New Contact Form Submission
            </h2>
            
            <div style="background: #f9fafb; padding: 20px; border-radius: 8px; margin: 20px 0;">
              <p style="margin: 8px 0;"><strong>From:</strong> ${name}</p>
              <p style="margin: 8px 0;"><strong>Email:</strong> <a href="mailto:${email}">${email}</a></p>
              ${organization ? `<p style="margin: 8px 0;"><strong>Organization:</strong> ${organization}</p>` : ''}
              <p style="margin: 8px 0;"><strong>Subject:</strong> ${subjectLabels[subject] || subject}</p>
              <p style="margin: 8px 0;"><strong>Received:</strong> ${new Date(contactData.timestamp).toLocaleString('fr-FR')}</p>
            </div>
            
            <div style="background: #fff; padding: 20px; border: 1px solid #e5e7eb; border-radius: 8px;">
              <h3 style="margin-top: 0; color: #1f2937;">Message:</h3>
              <p style="line-height: 1.6; color: #374151; white-space: pre-wrap;">${message}</p>
            </div>
            
            <div style="margin-top: 20px; padding-top: 20px; border-top: 1px solid #e5e7eb; color: #6b7280; font-size: 12px;">
              <p>Message ID: ${contactData.id}</p>
              <p>This message was sent via the GTIXT contact form.</p>
            </div>
          </div>
        `,
      };

      await transporter.sendMail(mailOptions);
      console.log(`✅ Email sent via Brevo SMTP to ${recipientEmail}`);
    } catch (emailError) {
      console.error('Email sending failed:', emailError);
      // Continue even if email fails - message is saved
    }

    return res.status(200).json({
      success: true,
      message: `Message reçu et sera traité par notre équipe ${recipientEmail}`,
    });
  } catch (error) {
    console.error('Contact form error:', error);
    return res.status(500).json({
      success: false,
      message: 'Erreur lors de l\'envoi du message',
    });
  }
}
