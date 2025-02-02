const nodemailer = require('nodemailer');
require('dotenv').config();

class EmailService {
    constructor() {
        this.transporter = nodemailer.createTransport({
            service: 'gmail',
            auth: {
                user: process.env.EMAIL_USER,
                pass: process.env.EMAIL_PASS
            }
        });
    }

    /**
     * Send OTP verification email
     * @param {string} email - Recipient email
     * @param {string} firstName - User's first name
     * @param {string} otp - 6-digit OTP code
     */
    async sendOTPEmail(email, firstName, otp) {
        try {
            const mailOptions = {
                from: `"Siyoga Travels" <${process.env.EMAIL_FROM}>`,
                to: email,
                subject: 'Your Verification Code - Siyoga Travels',
                html: `
                    <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px;">
                        <div style="text-align: center; margin-bottom: 30px;">
                            <h1 style="color: #667eea; margin: 0;">🌍 Siyoga Travels</h1>
                            <p style="color: #666; margin: 5px 0;">Your Journey Begins Here</p>
                        </div>
                        
                        <div style="background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); padding: 30px; border-radius: 10px; color: white; text-align: center; margin-bottom: 30px;">
                            <h2 style="margin: 0 0 15px 0;">Your Verification Code</h2>
                            <p style="margin: 0; font-size: 16px;">Please enter this code to verify your account</p>
                        </div>

                        <div style="background: #f8f9fa; padding: 25px; border-radius: 8px; margin-bottom: 30px;">
                            <p style="margin: 0 0 15px 0; font-size: 16px;">Hello <strong>${firstName}</strong>,</p>
                            <p style="margin: 0 0 20px 0; color: #666; line-height: 1.6;">
                                Thank you for registering with Siyoga Travels! Please use the verification code below to complete your registration.
                            </p>

                            <div style="text-align: center; margin: 30px 0;">
                                <div style="background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
                                           color: white;
                                           padding: 20px;
                                           border-radius: 10px;
                                           font-size: 32px;
                                           font-weight: bold;
                                           letter-spacing: 8px;
                                           display: inline-block;
                                           font-family: monospace;">
                                    ${otp}
                                </div>
                            </div>

                            <p style="margin: 20px 0 0 0; color: #666; font-size: 14px; text-align: center;">
                                This code will expire in 10 minutes.
                            </p>
                        </div>
                        
                        <div style="border-top: 2px solid #f0f0f0; padding-top: 20px; color: #666; font-size: 14px;">
                            <p style="margin: 0 0 10px 0;"><strong>Important:</strong></p>
                            <ul style="margin: 0; padding-left: 20px; line-height: 1.6;">
                                <li>This verification code will expire in 10 minutes</li>
                                <li>If you didn't create this account, please ignore this email</li>
                                <li>For support, contact us at support@siyogatravels.com</li>
                            </ul>
                        </div>
                        
                        <div style="text-align: center; margin-top: 30px; padding-top: 20px; border-top: 1px solid #eee; color: #999; font-size: 12px;">
                            <p style="margin: 0;">© 2024 Siyoga Travels. All rights reserved.</p>
                            <p style="margin: 5px 0 0 0;">Making your travel dreams come true! 🌟</p>
                        </div>
                    </div>
                `
            };

            const info = await this.transporter.sendMail(mailOptions);
            console.log(`✅ OTP email sent to ${email}: ${info.messageId}`);
            return { success: true, messageId: info.messageId };
        } catch (error) {
            console.error('❌ OTP email sending failed:', error);
            return { success: false, error: error.message };
        }
    }

    /**
     * Send welcome email after verification
     * @param {string} email - Recipient email
     * @param {string} firstName - User's first name
     * @param {string} role - User's role (tourist/driver)
     */
    async sendWelcomeEmail(email, firstName, role) {
        try {
            const dashboardUrl = `${process.env.FRONTEND_URL}/dashboard`;
            
            const roleSpecificContent = role === 'tourist' 
                ? {
                    title: 'Start Your Adventure!',
                    features: [
                        '🗺️ Browse amazing travel destinations',
                        '🚗 Book reliable drivers and vehicles',
                        '💰 Secure payment processing',
                        '⭐ Rate and review your experiences'
                    ]
                }
                : {
                    title: 'Start Earning with Us!',
                    features: [
                        '🚗 Manage your vehicle information',
                        '📱 Receive trip requests instantly',
                        '💰 Track your earnings',
                        '⭐ Build your driver reputation'
                    ]
                };

            const mailOptions = {
                from: `"Siyoga Travels" <${process.env.EMAIL_FROM}>`,
                to: email,
                subject: 'Welcome to Siyoga Travels - Let\'s Get Started!',
                html: `
                    <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px;">
                        <div style="text-align: center; margin-bottom: 30px;">
                            <h1 style="color: #667eea; margin: 0;">🌍 Siyoga Travels</h1>
                            <p style="color: #666; margin: 5px 0;">Your Journey Begins Here</p>
                        </div>
                        
                        <div style="background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); padding: 30px; border-radius: 10px; color: white; text-align: center; margin-bottom: 30px;">
                            <h2 style="margin: 0 0 15px 0;">🎉 Welcome ${firstName}!</h2>
                            <p style="margin: 0; font-size: 16px;">${roleSpecificContent.title}</p>
                        </div>
                        
                        <div style="background: #f8f9fa; padding: 25px; border-radius: 8px; margin-bottom: 30px;">
                            <p style="margin: 0 0 20px 0; font-size: 16px; color: #333;">
                                Your email has been verified successfully! You're now ready to explore everything Siyoga Travels has to offer.
                            </p>
                            
                            <h3 style="color: #667eea; margin: 20px 0 15px 0;">What you can do now:</h3>
                            <ul style="margin: 0; padding-left: 20px; color: #666; line-height: 1.8;">
                                ${roleSpecificContent.features.map(feature => `<li>${feature}</li>`).join('')}
                            </ul>
                            
                            <div style="text-align: center; margin: 30px 0;">
                                <a href="${dashboardUrl}" 
                                   style="background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); 
                                          color: white; 
                                          padding: 15px 30px; 
                                          text-decoration: none; 
                                          border-radius: 25px; 
                                          font-weight: bold; 
                                          font-size: 16px;
                                          display: inline-block;">
                                    🚀 Go to Dashboard
                                </a>
                            </div>
                        </div>
                        
                        <div style="text-align: center; margin-top: 30px; padding-top: 20px; border-top: 1px solid #eee; color: #999; font-size: 12px;">
                            <p style="margin: 0;">© 2024 Siyoga Travels. All rights reserved.</p>
                            <p style="margin: 5px 0 0 0;">Happy travels! 🌟</p>
                        </div>
                    </div>
                `
            };

            const info = await this.transporter.sendMail(mailOptions);
            console.log(`✅ Welcome email sent to ${email}: ${info.messageId}`);
            return { success: true, messageId: info.messageId };
        } catch (error) {
            console.error('❌ Welcome email sending failed:', error);
            return { success: false, error: error.message };
        }
    }

    /**
     * Test email functionality
     * @param {string} testEmail - Email to send test to
     */
    async sendTestEmail(testEmail) {
        try {
            const mailOptions = {
                from: `"Siyoga Travels" <${process.env.EMAIL_FROM}>`,
                to: testEmail,
                subject: 'Test Email - Siyoga Travels System',
                html: `
                    <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px;">
                        <div style="text-align: center; margin-bottom: 30px;">
                            <h1 style="color: #667eea; margin: 0;">🌍 Siyoga Travels</h1>
                            <p style="color: #666; margin: 5px 0;">Email System Test</p>
                        </div>
                        
                        <div style="background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); padding: 30px; border-radius: 10px; color: white; text-align: center; margin-bottom: 30px;">
                            <h2 style="margin: 0 0 15px 0;">✅ Email System Working!</h2>
                            <p style="margin: 0; font-size: 16px;">This is a test email to verify the email functionality</p>
                        </div>
                        
                        <div style="background: #f8f9fa; padding: 25px; border-radius: 8px; margin-bottom: 30px;">
                            <p style="margin: 0 0 15px 0; font-size: 16px;">Hello!</p>
                            <p style="margin: 0 0 20px 0; color: #666; line-height: 1.6;">
                                This test email confirms that the Siyoga Travels email system is working correctly. 
                                The system is now ready to send verification emails, welcome messages, and other notifications.
                            </p>
                            
                            <div style="background: #e8f5e8; padding: 15px; border-radius: 5px; border-left: 4px solid #28a745;">
                                <p style="margin: 0; color: #155724; font-weight: bold;">✅ Email Configuration Status:</p>
                                <ul style="margin: 10px 0 0 0; color: #155724;">
                                    <li>SMTP Connection: Active</li>
                                    <li>Authentication: Successful</li>
                                    <li>Email Templates: Loaded</li>
                                    <li>System: Ready for Production</li>
                                </ul>
                            </div>
                        </div>
                        
                        <div style="text-align: center; margin-top: 30px; padding-top: 20px; border-top: 1px solid #eee; color: #999; font-size: 12px;">
                            <p style="margin: 0;">© 2024 Siyoga Travels. All rights reserved.</p>
                            <p style="margin: 5px 0 0 0;">Email system test completed successfully! 🎉</p>
                        </div>
                    </div>
                `
            };

            const info = await this.transporter.sendMail(mailOptions);
            console.log(`✅ Test email sent to ${testEmail}: ${info.messageId}`);
            return { success: true, messageId: info.messageId };
        } catch (error) {
            console.error('❌ Test email sending failed:', error);
            return { success: false, error: error.message };
        }
    }
}

module.exports = new EmailService();
