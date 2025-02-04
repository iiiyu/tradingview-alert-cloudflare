interface Env {
  TELEGRAM_BOT_TOKEN: string;
  TELEGRAM_CHAT_ID: string;
}

interface JsonAlert {
  text: string;
  [key: string]: any;
}

export default {
  async fetch(request: Request, env: Env, ctx: ExecutionContext): Promise<Response> {
    // Only allow POST requests
    if (request.method !== 'POST') {
      return new Response('Method not allowed', { status: 405 });
    }

    try {
      let message: string;
      const contentType = request.headers.get('content-type')?.toLowerCase() || '';

      // Handle different content types
      if (contentType.includes('application/json')) {
        const jsonData: JsonAlert = await request.json();
        if (!jsonData.text) {
          return new Response('Missing text field in JSON payload', { status: 400 });
        }
        message = jsonData.text;
      } else {
        // Treat as plain text
        message = await request.text();
        if (!message) {
          return new Response('Missing message in request body', { status: 400 });
        }
      }

      // Format the message for Telegram
      const telegramMessage = encodeURIComponent(message);
      
      // Send to Telegram
      const telegramUrl = `https://api.telegram.org/bot${env.TELEGRAM_BOT_TOKEN}/sendMessage?chat_id=${env.TELEGRAM_CHAT_ID}&text=${telegramMessage}`;
      
      const telegramResponse = await fetch(telegramUrl, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
      });

      if (!telegramResponse.ok) {
        throw new Error(`Telegram API error: ${telegramResponse.statusText}`);
      }

      return new Response('Alert sent successfully', { status: 200 });
    } catch (error: unknown) {
      console.error('Error processing webhook:', error);
      const errorMessage = error instanceof Error ? error.message : 'An unknown error occurred';
      return new Response(`Error processing webhook: ${errorMessage}`, { status: 500 });
    }
  },
}
