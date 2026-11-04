export default {
  async fetch(request, env) {
    const corsHeaders = {
      "Access-Control-Allow-Origin": "https://paikarisell.ghotimarket.com",
      "Access-Control-Allow-Methods": "POST, OPTIONS",
      "Access-Control-Allow-Headers": "Content-Type, Authorization",
    };
    if (request.method === "OPTIONS") {
      return new Response(null, { status: 204, headers: corsHeaders });
    }

    try {
      const body = await request.json();
      console.log("BODY RECEIVED:", JSON.stringify(body));

      // fallback সহ
      const uid = body.uid || body.userId || "N/A";
      const name = body.name || "N/A";
      const email = body.email || "N/A";
      const phone = body.phone || body.mobile || "N/A";
      const whatsApp = body.whatsApp || body.whatsapp || body.whatsAppNumber || "N/A";
      const description = body.description || body.product || "N/A";
      const nidFront = body.nidFront || body.front || "";
      const nidBack = body.nidBack || body.back || "";

      const frontUrl = nidFront ? `https://paikarisell-image.ghotimarket.com/${nidFront}` : "N/A";
      const backUrl = nidBack ? `https://paikarisell-image.ghotimarket.com/${nidBack}` : "N/A";
      
      const banglaTime = new Date().toLocaleString("bn-BD", { timeZone: "Asia/Dhaka", dateStyle: "full", timeStyle: "medium" });
      
      const message = `🔔 নতুন Supplier Registration\n\n👤 নাম: ${name}\n📧 ইমেইল: ${email}\n📱 মোবাইল: ${phone}\n💬 WhatsApp: ${whatsApp}\n\n📦 পণ্য:\n${description}\n\n🆔 UID: ${uid}\n\n📄 Front: ${frontUrl}\n📄 Back: ${backUrl}\n\n🕒 ${banglaTime}\n\nPAIKARI SELL - Verification Pending`;

      const tgRes = await fetch(`https://api.telegram.org/bot${env.TELEGRAM_BOT_TOKEN}/sendMessage`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ chat_id: env.TELEGRAM_CHAT_ID, text: message })
      });

      const tgData = await tgRes.json();

      return new Response(JSON.stringify({ success: true, received: body, telegram: tgData }), { headers: { ...corsHeaders, "Content-Type": "application/json" } });
    } catch (e) {
      return new Response(JSON.stringify({ success: false, error: e.message }), { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } });
    }
  }
}
