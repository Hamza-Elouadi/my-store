import nodemailer from "nodemailer";

export async function POST(req) {
  const { name, email } = await req.json();

  const transporter = nodemailer.createTransport({
    service: "gmail",
    auth: {
      user: process.env.EMAIL_USER, // إيميل Gmail ديالك
      pass: process.env.EMAIL_PASS, // App Password
    },
  });

  const mailOptions = {
    from: `"متجرك" <${process.env.EMAIL_USER}>`,
    to: email,
    subject: "تأكيد الطلب",
    text: `مرحباً ${name}،\n\nتم استلام طلبك بنجاح وسنتواصل معك قريباً لتأكيده.\n\nشكراً لتسوقك معنا!`,
  };

  try {
    await transporter.sendMail(mailOptions);
    return Response.json({ success: true });
  } catch (error) {
    console.error("خطأ في الإيميل:", error);
    return Response.json({ error: "فشل في إرسال البريد" }, { status: 500 });
  }
}