export default {
  async fetch(request, env) {
    const corsHeaders = {
      "Access-Control-Allow-Origin": "https://paikarisell.ghotimarket.com",
      "Access-Control-Allow-Methods": "POST, OPTIONS",
      "Access-Control-Allow-Headers": "Content-Type, Authorization",
      "Content-Type": "application/json"
    };
    if (request.method === "OPTIONS") return new Response(null, { status: 204, headers: corsHeaders });
    
    try {
      const body = await request.json();
      const { uid, name, email, phone, whatsApp, description, nidFront, nidBack } = body;
      
      const banglaTime = new Date().toLocaleString("bn-BD", { timeZone: "Asia/Dhaka", dateStyle: "full", timeStyle: "medium" });
      
      const frontUrl = `https://paikarisell-image.ghotimarket.com/${nidFront}`;
      const backUrl = `https://paikarisell-image.ghotimarket.com/${nidBack}`;

      const message = `🔔 নতুন Supplier Registration\n\n👤 নাম: ${name}\n📧 ইমেইল: ${email}\n📱 মোবাইল: ${phone}\n💬 WhatsApp: ${whatsApp}\n\n📦 পণ্য:\n${description}\n\n🆔 UID: ${uid}\n\n📄 Front: ${frontUrl}\n📄 Back: ${backUrl}\n\n🕒 ${banglaTime}\n\nPAIKARI SELL - Verification Pending`;

      await fetch(`https://api.telegram.org/bot${env.TELEGRAM_BOT_TOKEN}/sendMessage`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ chat_id: env.TELEGRAM_CHAT_ID, text: message })
      });

      return new Response(JSON.stringify({ success: true }), { headers: corsHeaders });
    } catch (e) {
      return new Response(JSON.stringify({ success: false, error: e.message }), { status: 500, headers: corsHeaders });
    }
  }
}
