import nodemailer from 'nodemailer';
import dotenv from 'dotenv';

dotenv.config();

// Create email transporter
const transporter = nodemailer.createTransport({
    host: process.env.EMAIL_HOST || 'smtp.gmail.com',
    port: parseInt(process.env.EMAIL_PORT) || 587,
    secure: false,
    auth: {
        user: process.env.EMAIL_USER,
        pass: process.env.EMAIL_PASSWORD,
    },
});

// Send email with report attachment
export async function sendReportEmail(to, subject, sessionName, fileBuffer, format = 'pdf') {
    try {
        const extension = format.toLowerCase();
        const mimeType = extension === 'csv' ? 'text/csv' : 'application/pdf';

        const mailOptions = {
            from: `Sparkus <${process.env.EMAIL_USER}>`,
            to,
            subject,
            html: `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
          <h2 style="color: #4F46E5;">Sparkus Session Report</h2>
          <p>Please find attached the ${extension.toUpperCase()} report for <strong>${sessionName}</strong>.</p>
          <p>This report includes:</p>
          <ul>
            <li>Attendance summary</li>
            <li>Participant details with focus scores</li>
            <li>Status updates</li>
          </ul>
          <p style="color: #666; font-size: 12px; margin-top: 30px;">
            This is an automated email from Sparkus. Please do not reply to this email.
          </p>
        </div>
      `,
            attachments: [
                {
                    filename: `sparkus-report-${sessionName.replace(/\s+/g, '-')}.${extension}`,
                    content: fileBuffer,
                    contentType: mimeType,
                },
            ],
        };

        const info = await transporter.sendMail(mailOptions);
        console.log('✅ Email sent:', info.messageId);

        return {
            success: true,
            messageId: info.messageId,
        };
    } catch (error) {
        console.error('Email sending error:', error);
        throw error;
    }
}

// Verify email configuration
export async function verifyEmailConfig() {
    try {
        await transporter.verify();
        console.log('✅ Email server is ready');
        return true;
    } catch (error) {
        console.error('❌ Email server verification failed:', error);
        return false;
    }
}
