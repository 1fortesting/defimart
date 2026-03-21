'use server';

import 'server-only';

interface SendSmsParams {
  phoneNumber: string;
  message: string;
}

export async function sendSms({ phoneNumber, message }: SendSmsParams): Promise<void> {
  const apiKey = process.env.SENDEXA_API_KEY;
  const apiSecret = process.env.SENDEXA_SECRET_KEY;
  const apiUrl = process.env.SENDEXA_BASE_URL;
  const senderId = 'Defimart';

  if (!apiKey || !apiSecret || !apiUrl) {
    console.error('Sendexa API Key, Secret or URL is not configured in environment variables.');
    return;
  }
  
  if (!phoneNumber || !message) {
    console.error('SMS requires a phone number and a message.');
    return;
  }
  
  const base64token = Buffer.from(`${apiKey}:${apiSecret}`).toString('base64');

  const payload = {
    to: phoneNumber,
    from: senderId,
    message: message,
  };

  try {
    const response = await fetch(apiUrl, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Basic ${base64token}`,
      },
      body: JSON.stringify(payload),
    });

    const responseData = await response.json();
    if (!response.ok) {
        console.error(`Failed to send SMS via Sendexa. Status: ${response.status}`, responseData);
    } else {
        console.log('SMS sent successfully via Sendexa:', responseData);
    }
  } catch (error) {
    console.error('An error occurred while sending SMS:', error);
  }
}
