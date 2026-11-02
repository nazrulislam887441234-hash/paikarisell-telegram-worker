export default {
  async fetch(request, env) {
    const origin = request.headers.get("Origin");
    const allowedOrigins = [
      "https://paikarisell.ghotimarket.com"
    ];

    const corsHeaders = {
      "Access-Control-Allow-Origin": allowedOrigins.includes(origin) ? origin : "https://paikarisell.ghotimarket.com",
      "Access-Control-Allow-Methods": "POST, OPTIONS",
      "Access-Control-Allow-Headers": "Content-Type, Authorization",
    };

    if (request.method === "OPTIONS") return new Response(null, { headers: corsHeaders });
    if (request.method !== "POST") return new Response("Method not allowed", { status: 405, headers: corsHeaders });

    try {
      const authHeader = request.headers.get("Authorization");
      if (!authHeader || !authHeader.startsWith("Bearer ")) {
        return new Response(JSON.stringify({ success: false, error: "Unauthorized" }), { status: 401, headers: corsHeaders });
      }

      const idToken = authHeader.split("Bearer ")[1];
      const verifyRes = await fetch(`https://identitytoolkit.googleapis.com/v1/accounts:lookup?key=AIzaSyDCIRWmozT0XcEXuXtQ6RDiDo6vtT1T9mU`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ idToken })
      });

      if (!verifyRes.ok) return new Response(JSON.stringify({ success: false, error: "Invalid token" }), { status: 403, headers: corsHeaders });
      const userData = await verifyRes.json();
      const uid = userData.users[0].localId;

      // Fetch Firestore Document for verification & secure info extraction
      const firestoreRes = await fetch(`https://firestore.googleapis.com/v1/projects/paikarisell-ghotimarket/databases/(default)/documents/supplyers/${uid}`);
      if (!firestoreRes.ok) return new Response(JSON.stringify({ success: false, error: "Supplier doc not found" }), { status: 404, headers: corsHeaders });
      
      const docData = await firestoreRes.json();
      const fields = docData.fields;

      const name = fields.name.stringValue;
      const email = fields.email.stringValue;
      const phone = fields.phone.stringValue;
      const whatsApp = fields.whatsApp.stringValue;
      const description = fields.description.stringValue;
      const banglaTime = new Date().toLocaleString("bn-BD", { timeZone: "Asia/Dhaka" });

      const message = `🔔 নতুন Supplier Registration\n\nনাম: ${name}\nইমেইল: ${email}\nহোয়াটসঅ্যাপ: ${whatsApp}\nমোবাইল: ${phone}\nপণ্যের বিবরণ: ${description}\nUID: ${uid}\nসময়: ${banglaTime}\nStatus: Verification Pending`;

      await fetch(`https://api.telegram.org/bot${env.TELEGRAM_BOT_TOKEN}/sendMessage`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          chat_id: env.TELEGRAM_CHAT_ID,
          text: message
        })
      });

      return new Response(JSON.stringify({ success: true }), { headers: { ...corsHeaders, "Content-Type": "application/json" } });
    } catch (err) {
      return new Response(JSON.stringify({ success: false, error: err.message }), { status: 500, headers: corsHeaders });
    }
  }
};
