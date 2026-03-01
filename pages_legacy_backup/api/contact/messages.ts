import type { NextApiRequest, NextApiResponse } from 'next';
import * as fs from 'fs';
import * as path from 'path';

interface Message {
  id: string;
  name: string;
  email: string;
  organization?: string;
  subject: string;
  message: string;
  recipientEmail: string;
  timestamp: string;
  status: string;
}

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse
) {
  if (req.method !== 'GET') {
    return res.status(405).json({ success: false, message: 'Method not allowed' });
  }

  try {
    const contactsFile = path.join(process.cwd(), 'public', '.data', 'contacts.json');

    if (!fs.existsSync(contactsFile)) {
      return res.status(200).json({
        success: true,
        count: 0,
        messages: [],
      });
    }

    const data = fs.readFileSync(contactsFile, 'utf-8');
    const messages: Message[] = JSON.parse(data);

    return res.status(200).json({
      success: true,
      count: messages.length,
      messages: messages.sort((a, b) => 
        new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime()
      ),
    });
  } catch (error) {
    console.error('Error reading contacts:', error);
    return res.status(500).json({
      success: false,
      message: 'Error reading messages',
    });
  }
}
