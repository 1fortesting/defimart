'use server';

import 'server-only';

interface SendSmsParams {
  phoneNumber: string;
  message: string;
}

export async function sendSms({ phoneNumber, message }: SendSmsParams): Promise<void> {
  const apiKey = process.env.SENDEXA_API_KEY;
  const apiUrl = process.env.SENDEXA_API_URL;
  const senderId = 'DEFIMART';

  if (!apiKey || !apiUrl) {
    console.error('Sendexa API Key or URL is not configured in environment variables.');
    return;
  }
  
  if (!phoneNumber || !message) {
    console.error('SMS requires a phone number and a message.');
    return;
  }

  const payload = {
    sender_id: senderId,
    recipient: phoneNumber,
    message: message,
  };

  try {
    const response = await fetch(apiUrl, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Basic ${Buffer.from(`${apiKey}:`).toString('base64')}`,
      },
      body: JSON.stringify(payload),
    });

    if (!response.ok) {
        const responseData = await response.json();
        console.error(`Failed to send SMS via Sendexa. Status: ${response.status}`, responseData);
    } else {
        const responseData = await response.json();
        console.log('SMS sent successfully via Sendexa:', responseData);
    }
  } catch (error) {
    console.error('An error occurred while sending SMS:', error);
  }
}
