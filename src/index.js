
export default {
  async fetch(request, env) {

    const origin = request.headers.get("Origin");

    const allowedOrigins = [
      "https://paikarisell.ghotimarket.com"
    ];

    const corsHeaders = {
      "Access-Control-Allow-Origin": allowedOrigins.includes(origin)
        ? origin
        : "https://paikarisell.ghotimarket.com",
      "Access-Control-Allow-Methods": "POST, OPTIONS",
      "Access-Control-Allow-Headers": "Content-Type, Authorization",
      "Content-Type": "application/json"
    };

    const jsonResponse = (data, status = 200) => {
      return new Response(JSON.stringify(data), {
        status,
        headers: corsHeaders
      });
    };

    if (request.method === "OPTIONS") {
      return new Response(null, {
        status: 204,
        headers: corsHeaders
      });
    }

    if (request.method !== "POST") {
      return jsonResponse({
        success: false,
        error: "Method not allowed"
      }, 405);
    }

    try {

      // 1. Authorization Check

      const authHeader = request.headers.get("Authorization");

      if (!authHeader || !authHeader.startsWith("Bearer ")) {
        return jsonResponse({
          success: false,
          error: "Authorization token missing"
        }, 401);
      }

      const idToken = authHeader.substring(7);


      // 2. Firebase Token Verification

      const verifyRes = await fetch(
        "https://identitytoolkit.googleapis.com/v1/accounts:lookup?key=" +
        "YOUR_FIREBASE_API_KEY",
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json"
          },
          body: JSON.stringify({
            idToken: idToken
          })
        }
      );

      if (!verifyRes.ok) {
        return jsonResponse({
          success: false,
          error: "Firebase authentication failed"
        }, 403);
      }

      const userData = await verifyRes.json();

      if (!userData.users || !userData.users[0]) {
        return jsonResponse({
          success: false,
          error: "User not found"
        }, 403);
      }

      const uid = userData.users[0].localId;


      // 3. Firestore Document Fetch

      const firestoreRes = await fetch(
        `https://firestore.googleapis.com/v1/projects/paikarisell-ghotimarket/databases/(default)/documents/supplyers/${uid}`,
        {
          method: "GET",
          headers: {
            "Authorization": `Bearer ${idToken}`
          }
        }
      );

      if (!firestoreRes.ok) {

        const errorText = await firestoreRes.text();

        return jsonResponse({
          success: false,
          error: "Firestore fetch failed",
          details: errorText
        }, 403);

      }

      const docData = await firestoreRes.json();

      const fields = docData.fields || {};


      // 4. Safe Field Extraction

      const getField = (key) => {
        const field = fields[key];

        if (!field) return "Not provided";

        return (
          field.stringValue ??
          field.integerValue ??
          field.doubleValue ??
          field.booleanValue ??
          "Not provided"
        );
      };

      const name = getField("name");
      const email = getField("email");
      const phone = getField("phone");
      const whatsApp = getField("whatsApp");
      const description = getField("description");


      // 5. Bangladesh Time

      const banglaTime = new Date().toLocaleString(
        "bn-BD",
        {
          timeZone: "Asia/Dhaka",
          dateStyle: "full",
          timeStyle: "medium"
        }
      );


      // 6. Telegram Message

      const message =
`🔔 নতুন Supplier Registration

👤 নাম: ${name}
📧 ইমেইল: ${email}
📱 মোবাইল: ${phone}
💬 WhatsApp: ${whatsApp}

📦 পণ্যের বিবরণ:
${description}

🆔 UID:
${uid}

🕒 সময়: ${banglaTime}

⏳ Status: Verification Pending

━━━━━━━━━━━━━━━━━━
PAIKARI SELL
Supplier Registration System`;


      // 7. Telegram Notification

      if (!env.TELEGRAM_BOT_TOKEN || !env.TELEGRAM_CHAT_ID) {
        return jsonResponse({
          success: false,
          error: "Telegram environment variables missing"
        }, 500);
      }

      const telegramRes = await fetch(
        `https://api.telegram.org/bot${env.TELEGRAM_BOT_TOKEN}/sendMessage`,
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json"
          },
          body: JSON.stringify({
            chat_id: env.TELEGRAM_CHAT_ID,
            text: message
          })
        }
      );

      const telegramData = await telegramRes.json();

      if (!telegramRes.ok || !telegramData.ok) {

        return jsonResponse({
          success: false,
          error: "Telegram notification failed",
          details: telegramData.description || "Unknown Telegram error"
        }, 502);

      }


      // 8. Success Response

      return jsonResponse({
        success: true,
        message: "Supplier notification sent successfully",
        uid: uid
      });

    } catch (error) {

      return jsonResponse({
        success: false,
        error: error.message
      }, 500);

    }

  }
};
