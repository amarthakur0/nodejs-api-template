'use strict';

// Required modules
const reqlib = require('app-root-path').require,
  logger = reqlib('/helpers/logger'),
  nodemailer = require('nodemailer'),
  config = require('config');

// Send Email
const sendEmail = async (inputData, useGmail = false) => {
  try {
    let options;

    // For Gmail
    if(useGmail) {
      const gmailConfig = config.get('email.gmail');
      options = {
        service: 'gmail',
        auth: {
          user: gmailConfig.user,
          pass: gmailConfig.password
        },
        logger: false,
        debug: false
      };
    }
    // For SMTP
    else {
      const smtpConfig = config.get('email.smtp');
      options = {
        host: smtpConfig.host || 'localhost',
        port: smtpConfig.port || 25,
        secure: smtpConfig.secure || false,
        auth: {
          user: smtpConfig.user,
          pass: smtpConfig.password
        },
        logger: false,
        debug: false
      };
    }

    // Create transporter
    const transporter = nodemailer.createTransport(
      options, {
        // sender info
        from: config.get('email.noReply')
      }
    );

    // Message object
    let message = {
      // Comma separated list of recipients
      to: inputData.to,
      // Subject of the message
      subject: inputData.subject,
      // Plaintext body
      text: inputData.text || '',
      // HTML body
      html: inputData.html || '',
      // An array of attachments
      attachments: inputData.attachments || []
    };

    // send
    const info = await transporter.sendMail(message);

    // only needed when using pooled connections
    transporter.close();

    return info;
  }
  catch(e) {
    logger.error(`helper:email sendEmail() function => Data = ${inputData} Error = `, e);
    throw e;
  }
}

module.exports = {
  sendEmail
};