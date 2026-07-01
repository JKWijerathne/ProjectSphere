import nodemailer from 'nodemailer';

// Development mode: Set USE_EMAIL=false in .env to skip email and show OTP in console
const USE_EMAIL = process.env.USE_EMAIL !== 'false' && 
                  process.env.EMAIL_HOST && 
                  process.env.EMAIL_USER && 
                  process.env.EMAIL_PASSWORD;

const createTransporter = () => {
  if (!USE_EMAIL) {
    console.log('📧 Email service: DEVELOPMENT MODE (OTPs shown in console only)');
    return null;
  }

  try {
    const transportOptions = {
      service: 'gmail', // Use Gmail service (handles host/port automatically)
      auth: {
        user: process.env.EMAIL_USER,
        pass: process.env.EMAIL_PASSWORD
      },
      pool: true, // Use connection pooling
      maxConnections: 5,
      maxMessages: 100,
      rateDelta: 1000,
      rateLimit: 5
    };

    console.log('📧 Initializing Gmail SMTP service...');
    const transporter = nodemailer.createTransport(transportOptions);
    
    // Verify connection on startup
    transporter.verify((error, success) => {
      if (error) {
        console.error('❌ Gmail SMTP connection failed:', error.message);
        console.log('⚠️  Please check:');
        console.log('   1. Gmail App Password is correct');
        console.log('   2. 2-Factor Authentication is enabled');
        console.log('   3. Internet connection is active');
        console.log('   4. Firewall is not blocking port 587');
      } else {
        console.log('✅ Gmail SMTP connection verified - ready to send emails');
      }
    });
    
    return transporter;
  } catch (error) {
    console.error('❌ Failed to create email transporter:', error.message);
    return null;
  }
};

export const sendOTPEmail = async (to, otp, name) => {
  // Always log OTP for development/debugging
  console.log(`\n${'='.repeat(60)}`);
  console.log(`📧 OTP Email Request`);
  console.log(`   To: ${to}`);
  console.log(`   OTP: ${otp}`);
  console.log(`   Name: ${name}`);
  console.log(`${'='.repeat(60)}\n`);

  const transporter = createTransporter();
  
  // If no transporter (development mode), just return success
  if (!transporter) {
    console.log('✅ Development mode: OTP shown above (no email sent)');
    return { success: true, mode: 'development', otp };
  }

  // Try to send email, but don't fail if it doesn't work
  try {
    const htmlContent = `
<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Verify Your Email</title>
</head>
<body style="margin: 0; padding: 0; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif; background-color: #f8fafc;">
  <table role="presentation" style="width: 100%; border-collapse: collapse; background-color: #f8fafc;">
    <tr>
      <td style="padding: 40px 20px;">
        <table role="presentation" style="max-width: 600px; margin: 0 auto; background-color: #ffffff; border-radius: 16px; box-shadow: 0 4px 6px rgba(0, 0, 0, 0.05); overflow: hidden;">
          
          <!-- Header -->
          <tr>
            <td style="background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); padding: 40px 30px; text-align: center;">
              <h1 style="margin: 0; color: #ffffff; font-size: 28px; font-weight: 700;">
                ProjectSphere
              </h1>
              <p style="margin: 8px 0 0; color: rgba(255, 255, 255, 0.9); font-size: 14px;">
                Email Verification
              </p>
            </td>
          </tr>

          <!-- Content -->
          <tr>
            <td style="padding: 40px 30px;">
              <h2 style="margin: 0 0 16px; color: #1e293b; font-size: 24px; font-weight: 700;">
                Verify Your Email Address
              </h2>
              <p style="margin: 0 0 24px; color: #475569; font-size: 16px;">
                Hi <strong>${name}</strong>,
              </p>
              <p style="margin: 0 0 24px; color: #475569; font-size: 16px;">
                Thank you for registering with ProjectSphere! To complete your registration, please use the verification code below:
              </p>

              <!-- OTP Box -->
              <table role="presentation" style="width: 100%; margin: 32px 0;">
                <tr>
                  <td style="text-align: center;">
                    <div style="background: linear-gradient(135deg, #f1f5f9 0%, #e2e8f0 100%); border: 2px dashed #667eea; border-radius: 12px; padding: 24px; display: inline-block;">
                      <p style="margin: 0 0 8px; color: #64748b; font-size: 13px; font-weight: 600; text-transform: uppercase; letter-spacing: 1px;">
                        Your Verification Code
                      </p>
                      <p style="margin: 0; font-size: 36px; font-weight: 700; letter-spacing: 8px; color: #667eea; font-family: 'Courier New', monospace;">
                        ${otp}
                      </p>
                    </div>
                  </td>
                </tr>
              </table>

              <!-- Warning -->
              <table role="presentation" style="width: 100%; background-color: #fef3c7; border-left: 4px solid #f59e0b; border-radius: 8px; padding: 16px; margin: 24px 0;">
                <tr>
                  <td>
                    <p style="margin: 0; color: #92400e; font-size: 14px;">
                      <strong>⏰ Important:</strong> This code will expire in <strong>2 minutes</strong>. Please enter it promptly to verify your email address.
                    </p>
                  </td>
                </tr>
              </table>

              <p style="margin: 24px 0 0; color: #475569; font-size: 14px;">
                If you didn't request this code, please ignore this email or contact our support team if you have concerns.
              </p>
            </td>
          </tr>

          <!-- Support -->
          <tr>
            <td style="padding: 0 30px 30px; border-top: 1px solid #e2e8f0;">
              <p style="margin: 24px 0 0; color: #64748b; font-size: 14px; text-align: center;">
                Need help? Contact us at 
                <a href="mailto:${process.env.EMAIL_USER}" style="color: #667eea; text-decoration: none; font-weight: 600;">
                  ${process.env.EMAIL_USER}
                </a>
              </p>
            </td>
          </tr>

          <!-- Footer -->
          <tr>
            <td style="background-color: #f8fafc; padding: 24px 30px; text-align: center;">
              <p style="margin: 0 0 8px; color: #64748b; font-size: 13px;">
                © ${new Date().getFullYear()} ProjectSphere. All rights reserved.
              </p>
              <p style="margin: 0; color: #94a3b8; font-size: 12px;">
                University of Kelaniya | Faculty of Computing & Technology
              </p>
            </td>
          </tr>

        </table>
      </td>
    </tr>
  </table>
</body>
</html>
    `;

    const textContent = `
ProjectSphere - Email Verification

Hi ${name},

Thank you for registering with ProjectSphere!

YOUR VERIFICATION CODE
----------------------
${otp}
----------------------

⏰ This code will expire in 2 minutes.

Please enter this code to complete your registration.

If you didn't request this code, please ignore this email.

Need help? Contact us at ${process.env.EMAIL_USER}

© ${new Date().getFullYear()} ProjectSphere. All rights reserved.
University of Kelaniya | Faculty of Computing & Technology
    `;

    const mailOptions = {
      from: `"ProjectSphere Platform" <${process.env.EMAIL_USER}>`,
      to,
      subject: `🔐 Your ProjectSphere Verification Code: ${otp}`,
      html: htmlContent,
      text: textContent
    };

    await transporter.sendMail(mailOptions);
    console.log(`✅ OTP email sent successfully to ${to}`);
    return { success: true, mode: 'production' };
  } catch (error) {
    console.error(`⚠️ Failed to send OTP email to ${to}:`, error.message);
    console.log('📧 Continuing with development mode - OTP shown above');
    // Don't throw error - allow registration to continue
    return { success: true, mode: 'development-fallback', otp, error: error.message };
  }
};

export const sendWelcomeEmail = async (to, name, role) => {
  const transporter = createTransporter();
  
  // If no transporter, skip welcome email
  if (!transporter) {
    console.log(`📧 Development mode: Skipping welcome email for ${to}`);
    return { success: true, mode: 'development' };
  }

  // Role-specific content
  const roleContent = {
    Student: {
      greeting: 'Welcome to Your Academic Journey!',
      benefits: [
        'Showcase your projects to recruiters and industry professionals',
        'Build a professional portfolio that stands out',
        'Connect with peers and collaborate on innovative ideas',
        'Receive feedback from lecturers and industry experts',
        'Get discovered by top companies looking for talent'
      ],
      nextSteps: [
        'Complete your profile with a professional photo',
        'Upload your first project and make it shine',
        'Explore projects from fellow students',
        'Connect with recruiters and expand your network'
      ],
      cta: 'Upload Your First Project',
      ctaLink: `${process.env.CLIENT_URL}/student/projects/create`
    },
    Lecturer: {
      greeting: 'Welcome to the Academic Excellence Platform!',
      benefits: [
        'Review and approve student project submissions',
        'Provide valuable feedback to guide student development',
        'Monitor student progress and innovation trends',
        'Foster academic excellence through project evaluation',
        'Connect students with industry opportunities'
      ],
      nextSteps: [
        'Review pending project submissions',
        'Set up your lecturer profile',
        'Explore student projects and innovations',
        'Provide constructive feedback to students'
      ],
      cta: 'View Pending Projects',
      ctaLink: `${process.env.CLIENT_URL}/lecturer/projects/pending`
    },
    Recruiter: {
      greeting: 'Welcome to Your Talent Discovery Platform!',
      benefits: [
        'Discover talented students with real-world projects',
        'Access a curated portfolio of innovative student work',
        'Connect directly with potential candidates',
        'Filter projects by technology, category, and skills',
        'Save time with verified academic credentials'
      ],
      nextSteps: [
        'Complete your company profile',
        'Browse student projects and portfolios',
        'Use advanced filters to find the right talent',
        'Connect with students for opportunities'
      ],
      cta: 'Explore Student Projects',
      ctaLink: `${process.env.CLIENT_URL}/projects`
    }
  };

  const content = roleContent[role] || roleContent.Student;
  
  // Try to send welcome email, but don't fail if it doesn't work
  try {
    const htmlContent = `
<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Welcome to ProjectSphere</title>
</head>
<body style="margin: 0; padding: 0; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif; background-color: #f8fafc; line-height: 1.6;">
  <table role="presentation" style="width: 100%; border-collapse: collapse; background-color: #f8fafc;">
    <tr>
      <td style="padding: 40px 20px;">
        <table role="presentation" style="max-width: 600px; margin: 0 auto; background-color: #ffffff; border-radius: 16px; box-shadow: 0 4px 6px rgba(0, 0, 0, 0.05); overflow: hidden;">
          
          <!-- Header -->
          <tr>
            <td style="background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); padding: 40px 30px; text-align: center;">
              <h1 style="margin: 0; color: #ffffff; font-size: 28px; font-weight: 700; letter-spacing: -0.5px;">
                ProjectSphere
              </h1>
              <p style="margin: 8px 0 0; color: rgba(255, 255, 255, 0.9); font-size: 14px; font-weight: 500;">
                Connecting Students, Academia & Industry
              </p>
            </td>
          </tr>

          <!-- Welcome Message -->
          <tr>
            <td style="padding: 40px 30px 30px;">
              <h2 style="margin: 0 0 16px; color: #1e293b; font-size: 24px; font-weight: 700;">
                ${content.greeting}
              </h2>
              <p style="margin: 0 0 24px; color: #475569; font-size: 16px;">
                Hi <strong>${name}</strong>,
              </p>
              <p style="margin: 0 0 24px; color: #475569; font-size: 16px;">
                Welcome to <strong>ProjectSphere</strong>! Your account has been successfully created as a <strong style="color: #667eea;">${role}</strong>.
              </p>
            </td>
          </tr>

          <!-- Account Details -->
          <tr>
            <td style="padding: 0 30px 30px;">
              <table role="presentation" style="width: 100%; border-collapse: collapse; background-color: #f1f5f9; border-radius: 8px; padding: 20px;">
                <tr>
                  <td>
                    <p style="margin: 0 0 12px; color: #64748b; font-size: 13px; font-weight: 600; text-transform: uppercase; letter-spacing: 0.5px;">
                      Account Details
                    </p>
                    <table role="presentation" style="width: 100%;">
                      <tr>
                        <td style="padding: 8px 0; color: #475569; font-size: 14px;">
                          <strong style="color: #1e293b;">Name:</strong>
                        </td>
                        <td style="padding: 8px 0; color: #475569; font-size: 14px; text-align: right;">
                          ${name}
                        </td>
                      </tr>
                      <tr>
                        <td style="padding: 8px 0; color: #475569; font-size: 14px;">
                          <strong style="color: #1e293b;">Email:</strong>
                        </td>
                        <td style="padding: 8px 0; color: #475569; font-size: 14px; text-align: right;">
                          ${to}
                        </td>
                      </tr>
                      <tr>
                        <td style="padding: 8px 0; color: #475569; font-size: 14px;">
                          <strong style="color: #1e293b;">Account Type:</strong>
                        </td>
                        <td style="padding: 8px 0; text-align: right;">
                          <span style="background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); color: #ffffff; padding: 4px 12px; border-radius: 12px; font-size: 13px; font-weight: 600;">
                            ${role}
                          </span>
                        </td>
                      </tr>
                    </table>
                  </td>
                </tr>
              </table>
            </td>
          </tr>

          <!-- Benefits -->
          <tr>
            <td style="padding: 0 30px 30px;">
              <h3 style="margin: 0 0 16px; color: #1e293b; font-size: 18px; font-weight: 700;">
                What You Can Do
              </h3>
              <table role="presentation" style="width: 100%;">
                ${content.benefits.map((benefit, index) => `
                  <tr>
                    <td style="padding: 8px 0; vertical-align: top;">
                      <table role="presentation">
                        <tr>
                          <td style="vertical-align: top; padding-right: 12px;">
                            <span style="display: inline-block; width: 24px; height: 24px; background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); color: #ffffff; border-radius: 50%; text-align: center; line-height: 24px; font-size: 12px; font-weight: 700;">
                              ${index + 1}
                            </span>
                          </td>
                          <td style="color: #475569; font-size: 15px; line-height: 1.6;">
                            ${benefit}
                          </td>
                        </tr>
                      </table>
                    </td>
                  </tr>
                `).join('')}
              </table>
            </td>
          </tr>

          <!-- Next Steps -->
          <tr>
            <td style="padding: 0 30px 30px;">
              <h3 style="margin: 0 0 16px; color: #1e293b; font-size: 18px; font-weight: 700;">
                Get Started
              </h3>
              <table role="presentation" style="width: 100%;">
                ${content.nextSteps.map((step, index) => `
                  <tr>
                    <td style="padding: 8px 0;">
                      <span style="display: inline-block; color: #667eea; font-weight: 700; margin-right: 8px;">
                        ✓
                      </span>
                      <span style="color: #475569; font-size: 15px;">
                        ${step}
                      </span>
                    </td>
                  </tr>
                `).join('')}
              </table>
            </td>
          </tr>

          <!-- CTA Button -->
          <tr>
            <td style="padding: 0 30px 40px; text-align: center;">
              <a href="${content.ctaLink}" style="display: inline-block; background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); color: #ffffff; text-decoration: none; padding: 14px 32px; border-radius: 8px; font-weight: 600; font-size: 16px; box-shadow: 0 4px 12px rgba(102, 126, 234, 0.4);">
                ${content.cta} →
              </a>
            </td>
          </tr>

          <!-- Support -->
          <tr>
            <td style="padding: 0 30px 30px; border-top: 1px solid #e2e8f0;">
              <p style="margin: 24px 0 0; color: #64748b; font-size: 14px; text-align: center;">
                Need help? Contact us at 
                <a href="mailto:${process.env.EMAIL_USER}" style="color: #667eea; text-decoration: none; font-weight: 600;">
                  ${process.env.EMAIL_USER}
                </a>
              </p>
            </td>
          </tr>

          <!-- Footer -->
          <tr>
            <td style="background-color: #f8fafc; padding: 24px 30px; text-align: center;">
              <p style="margin: 0 0 8px; color: #64748b; font-size: 13px;">
                © ${new Date().getFullYear()} ProjectSphere. All rights reserved.
              </p>
              <p style="margin: 0; color: #94a3b8; font-size: 12px;">
                University of Kelaniya | Faculty of Computing & Technology
              </p>
            </td>
          </tr>

        </table>
      </td>
    </tr>
  </table>
</body>
</html>
    `;

    const textContent = `
Welcome to ProjectSphere, ${name}!

${content.greeting}

Your account has been successfully created as a ${role}.

ACCOUNT DETAILS
----------------
Name: ${name}
Email: ${to}
Account Type: ${role}

WHAT YOU CAN DO
----------------
${content.benefits.map((b, i) => `${i + 1}. ${b}`).join('\n')}

GET STARTED
-----------
${content.nextSteps.map(s => `✓ ${s}`).join('\n')}

${content.cta}: ${content.ctaLink}

Need help? Contact us at ${process.env.EMAIL_USER}

© ${new Date().getFullYear()} ProjectSphere. All rights reserved.
University of Kelaniya | Faculty of Computing & Technology
    `;

    const mailOptions = {
      from: `"ProjectSphere Platform" <${process.env.EMAIL_USER}>`,
      to,
      subject: `🎉 Welcome to ProjectSphere - Your ${role} Account is Ready!`,
      html: htmlContent,
      text: textContent
    };

    await transporter.sendMail(mailOptions);
    console.log(`✅ Welcome email sent to ${to} (${role})`);
    return { success: true, mode: 'production' };
  } catch (error) {
    console.error(`⚠️ Failed to send welcome email to ${to}:`, error.message);
    // Don't throw - welcome email is non-critical
    return { success: false, mode: 'error', error: error.message };
  }
};
