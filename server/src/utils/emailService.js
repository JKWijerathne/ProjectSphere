import nodemailer from 'nodemailer';

const getEmailConfig = () => {
  const host = process.env.EMAIL_HOST?.trim();
  const user = process.env.EMAIL_USER?.trim();
  const password = process.env.EMAIL_PASSWORD?.trim();
  const port = Number(process.env.EMAIL_PORT || 587);
  const secure = process.env.EMAIL_SECURE === 'true' || port === 465;

  if (!host || !user || !password) {
    return null;
  }

  return {
    host,
    port,
    secure,
    user,
    password,
    from: process.env.EMAIL_FROM?.trim() || user
  };
};

const createTransporter = () => {
  const emailConfig = getEmailConfig();

  if (!emailConfig) {
    console.warn('Email credentials are not configured.');
    return null;
  }

  return nodemailer.createTransport({
    host: emailConfig.host,
    port: emailConfig.port,
    secure: emailConfig.secure,
    auth: { user: emailConfig.user, pass: emailConfig.password },
    connectionTimeout: 15000,
    greetingTimeout: 10000,
    socketTimeout: 20000,
    requireTLS: !emailConfig.secure,
    tls: {
      servername: emailConfig.host
    }
  });
};

export const sendOTPEmail = async (to, otp, name) => {
  try {
    const transporter = createTransporter();
    if (!transporter) {
      throw new Error('Email service is not configured. Please set EMAIL_HOST, EMAIL_USER, and EMAIL_PASSWORD.');
    }

    const emailConfig = getEmailConfig();

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
      from: `"ProjectSphere Platform" <${emailConfig.from}>`,
      to,
      subject: 'Your ProjectSphere verification code',
      html: htmlContent,
      text: textContent
    };

    let lastError;
    for (let attempt = 1; attempt <= 2; attempt += 1) {
      try {
        const info = await transporter.sendMail(mailOptions);
        if (info.rejected?.length) {
          throw new Error(`SMTP rejected recipient(s): ${info.rejected.join(', ')}`);
        }

        console.log(`OTP email accepted for ${to} on attempt ${attempt}`, {
          messageId: info.messageId,
          accepted: info.accepted,
          response: info.response
        });
        return { success: true, messageId: info.messageId, accepted: info.accepted, mode: 'production' };
      } catch (error) {
        lastError = error;
        console.warn(`OTP email attempt ${attempt} failed:`, error.message);
        if (attempt === 1) {
          await new Promise((resolve) => setTimeout(resolve, 1500));
        }
      }
    }

    console.error('Email error after retries:', lastError);
    throw new Error('Failed to send verification email. Please try again in a moment.');
  } catch (error) {
    console.error('Email error:', error);
    throw error;
  }
};

export const sendWelcomeEmail = async (to, name, role) => {
  try {
    const transporter = createTransporter();
    if (!transporter) {
      console.log(`Welcome email for: ${to} (${role})`);
      return { success: false, mode: 'not_configured' };
    }

    const emailConfig = getEmailConfig();

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
      from: `"ProjectSphere Platform" <${emailConfig.from}>`,
      to,
      subject: `Welcome to ProjectSphere - Your ${role} Account is Ready! 🎉`,
      html: htmlContent,
      text: textContent
    };

    await transporter.sendMail(mailOptions);
    console.log(`Welcome email sent to ${to} (${role})`);
    return { success: true, mode: 'production' };
  } catch (error) {
    console.error('Welcome email error:', error);
    return { success: false, error: error.message };
  }
};
