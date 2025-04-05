  var express = require('express');
  const dbConnect = require("./db/dbConnect");
  const User = require("./db/userModel");
  const Trial = require("./db/trialModel");
  const Options = require("./db/optionsModel");
  const Transaction = require('./db/transactionModel');
  const Job = require('./db/jobModel');
  
  const cron = require('node-cron');
  var router = express.Router();
  require('dotenv').config();
  var axios = require('axios')
  const bcrypt = require("bcrypt");
  const nodemailer = require('nodemailer');
  const rates = require('./rates');

  // DB connection
  dbConnect()

  


  // Change password button on login page, send code, when verified, choose new password

  // Mailer
  const transporter = nodemailer.createTransport({
    service: 'Gmail',
    auth: {
      user: process.env.MAILER_USER,
      pass: process.env.MAILER_PASS,
    },
  });


  // Daily Maitenance
  // * Send warning emails
  // * Delete inactive accounts (if they arent subscribed!)

  // Maitenance
  const job = cron.schedule('0 0 * * *', maintainUsers);
  //const job = cron.schedule('*/30 * * * * *', maintainUsers);
  job.start()
  
let latest;
const bypass_confirmations = false
  
const urlToPing = process.env.PING_URL;
 
const pingUrl = () => {
  axios.get(urlToPing)
    .then((res) => {
      latest = res.data
      
    })
    .catch((error) => {
      setTimeout(pingUrl, 2000); // Retry after 2 seconds
    });
};

cron.schedule('*/10 * * * *', pingUrl);
pingUrl();


// Function to send push notifications
const sendPushNotification = async () => {
  try {
    const users = await User.find({ expoPushToken: { $exists: true, $ne: null } });
    const messages = users.map(user => ({
      to: user.expoPushToken,
      sound: 'default',
      title: 'Quarterly Tax Reminder!',
      body: 'Quarterly taxes are due on the 15th. Open the app to see your estimate!',
    }));

    if (messages.length > 0) {
      await axios.post('https://exp.host/--/api/v2/push/send', messages, {
        headers: { 'Content-Type': 'application/json' },
      });
      console.log('Push notifications sent successfully.');
    } else {
      console.log('No push tokens found.');
    }
  } catch (error) {
    console.error('Error sending push notifications:', error);
  }
};

// Schedule to run at 9 AM on April 1st, June 1st, September 1st, and January 1st
cron.schedule('0 9 1 4,6,9,1 *', () => {
  console.log('Running scheduled push notification task...');
  sendPushNotification();
});

  async function maintainUsers()
  {
    const currentDate = new Date();

    // Email me a confirmation that the server is running
    const mailOptions = {
      from: process.env.MAILER_USER,
      to: process.env.ADMIN_EMAIL,
      subject: `Successful Template Maitenance`,
      text: `Hi Peter, just a confirmation that maitenance has ran for all Template users successfully.`,
    };
  
    // Send the email
    transporter.sendMail(mailOptions, (error, info) => {
      if (error) {
        console.log('Error sending warning email:', error);
      } else {
      }
    });

    // Calculate the date 10 days from now
    const futureDate = new Date(currentDate);
    futureDate.setDate(currentDate.getDate() + 10);

    // Format the date as "Month Day, Year"
    const options = { year: 'numeric', month: 'long', day: 'numeric' };
    const formattedDate = futureDate.toLocaleDateString('en-US', options);


    try {

      // SUBSCRIPTIONS

      // Find all users that renew today and check/update entitlements
      let users = await User.find({renewal_date: currentDate.getDate()})
        
      // Iterate through each user and update tokens if they have an active entitlement
      for (const user of users) {
        let subscribed = await isSubscribed(user._id)
        if (subscribed)
        {
          await User.updateOne({ _id: user._id }, { $set: { tokens: process.env.TOKEN_COUNT } });
        }
        else
        {
          // It looks like they expired today. Remove tokens.
          // Update: They did pay for month long access.. so dont remove the tokens. 
          await User.updateOne({ _id: user._id }, { $set: { renewal_date: 0 } });
          // Be sure to stop renewing them.
        }
        
      }


    
      // Increment 'dormant' field by 1 for all users
      await User.updateMany({}, { $inc: { dormant: 1 } });

      // Find and remove users with 'marked_for_deletion' and 'email_confirmed' both set to false
      await User.deleteMany({ marked_for_deletion: true });

      // Email a warning to all inactive users
      const dormantUsers = await User.find({
        $and: [
          { dormant: { $gte: 365 } }
        ]
      });

      // Send each email to dormant users who are not subscribed
      dormantUsers.forEach((user) => {
        
        // Dont delete paying users
        if (!isSubscribed(user._id))
        {
          const mailOptions = {
            from: process.env.MAILER_USER,
            to: user.email,
            subject: `${process.env.APP_NAME} account scheduled for deletion`,
            text: `Your ${process.env.APP_NAME} account hasn't been accessed in ${user.dormant} days, 
            and data is scheduled to be purged from our system on ${formattedDate}. 
            To keep your data, simply log in to your account. We hope to see you soon!`,
          };
        
          // Send the email
          transporter.sendMail(mailOptions, (error, info) => {
            if (error) {
              console.log('Error sending warning email:', error);
            } else {
            }
          });
  

        }
        
      });


      // MARK UNCONFIRMED USERS FOR DELETION
      try {
        // Find users where 'email_confirmed' is false
        const unconfirmedUsers = await User.find({ email_confirmed: false });
    
        // For all unconfirmed users prepare to mark for deletion
        // If they are not subscribed
        const updatePromises = unconfirmedUsers
        .filter(user => !isSubscribed(user._id))
        .map((user) => {
          user.marked_for_deletion = true;
          return user.save();
        });

    
        // Execute all the update operations
        await Promise.all(updatePromises);
    
      } catch (error) {
        console.error('Error marking users for deletion:', error);
      }


    } catch (error) {
      console.error('Error updating users:', error);
    }
  }





  // Endpoints


  router.get('/', (req,res) => {
      res.send(process.env.APP_NAME)
  })
  
  // Register Expo Push Token
  router.post('/notifications/register', async (req, res) => {
      const { userId, token } = req.body;
      try {
          await User.findByIdAndUpdate(userId, { expoPushToken: token });
          res.sendStatus(200);
      } catch (error) {
          console.error('Failed to register push token:', error);
          res.status(500).json({ error: 'Failed to register push token' });
      }
  });
  
  // Generate Auth Link for TrueLayer
  router.get('/create_link', async (req, res) => {
      const authUrl = `${process.env.TRUELAYER_AUTH_URL}?response_type=code&client_id=${process.env.TRUELAYER_CLIENT_ID}&scope=info accounts transactions&redirect_uri=${process.env.TRUELAYER_REDIRECT_URI}`;
      res.json({ authUrl });
  });
  
  // Handle TrueLayer Callback
  router.get('/callback', async (req, res) => {
      const { code, userId } = req.query;
      try {
          const tokenResponse = await fetch('https://auth.truelayer.com/connect/token', {
              method: 'POST',
              headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
              body: new URLSearchParams({
                  grant_type: 'authorization_code',
                  code,
                  client_id: process.env.TRUELAYER_CLIENT_ID,
                  client_secret: process.env.TRUELAYER_CLIENT_SECRET,
                  redirect_uri: process.env.TRUELAYER_REDIRECT_URI,
              }),
          });
  
          const { access_token } = await tokenResponse.json();
          const accountsResponse = await fetch('https://api.truelayer.com/data/v1/accounts', {
              headers: { Authorization: `Bearer ${access_token}` },
          });
  
          const accounts = (await accountsResponse.json()).results;
  
          for (const account of accounts) {
              const transactionsResponse = await fetch(
                  `https://api.truelayer.com/data/v1/accounts/${account.account_id}/transactions`,
                  { headers: { Authorization: `Bearer ${access_token}` } }
              );
  
              const transactions = (await transactionsResponse.json()).results;
  
              const transactionDocs = transactions.map(tx => ({
                  merchant: tx.description,
                  date: tx.timestamp.split('T')[0],
                  amount: tx.amount,
                  userId,
              }));
  
              await Transaction.insertMany(transactionDocs);
          }
  
          res.redirect('/');
      } catch (error) {
          console.error('Failed to handle callback:', error);
          res.status(500).json({ error: 'Failed to handle callback' });
      }
  });

  // update user's state value
  router.post('/updateState', async (req, res) => {
    const { userId, state } = req.body;
    
    // Check if required fields are provided
    if (!userId || !state) {
      return res.status(400).json({ error: 'Missing required fields' });
    }
    
    try {
      const updatedUser = await User.findByIdAndUpdate(
        userId, 
        { state: state },
        { new: true, runValidators: true }
      );
      
      if (!updatedUser) {
        return res.status(404).json({ error: 'User not found' });
      }
      
      res.status(200).json({ message: 'State updated successfully' });
    } catch (error) {
      console.error('Failed to update state:', error);
      res.status(500).json({ error: 'Failed to update state' });
    }
  });


  // Tax calculator

  router.post('/calculate-tax', (req, res) => {
    const { income, expenses, stateCode } = req.body;

    if (typeof income !== 'number' || typeof expenses !== 'number' || !stateCode) {
        return res.status(400).json({ error: 'Invalid input' });
    }

    try {
        const result = calculateQuarterlyTaxes(income, expenses, stateCode);
        res.json(result);
    } catch (error) {
        res.status(500).json({ error: 'Failed to calculate taxes' });
    }
});


// Instead we do this locally now, and provide the user with rates object
const calculateFederalTax = (taxableIncome) => {
    let federalTax = 0;
    let remainingIncome = taxableIncome;

    for (let i = rates.federalTaxBrackets.length - 1; i >= 0; i--) {
        const { rate, income } = rates.federalTaxBrackets[i];
        if (remainingIncome > income) {
            federalTax += (remainingIncome - income) * rate;
            remainingIncome = income;
        }
    }

    return federalTax;
};

const calculateQuarterlyTaxes = (income, expenses, stateCode) => {
    const netIncome = income - expenses;

    // Self-employment tax (15.3%) and 50% deductible (federal only)
    const selfEmploymentTax = netIncome * rates.selfEmploymentTaxRate;
    const deductibleSelfEmploymentTax = selfEmploymentTax * rates.selfEmploymentTaxDeductionRate;

    // QBI deduction (20% of qualified business income)
    const qbiDeduction = Math.max(0, netIncome * rates.qbiDeductionRate);

    // Calculate federal taxable income with standard and QBI deductions
    const federalTaxableIncome = Math.max(0, netIncome - rates.standardDeduction - qbiDeduction - deductibleSelfEmploymentTax);

    // Federal taxes include income tax and self-employment tax
    const federalIncomeTax = calculateFederalTax(federalTaxableIncome);
    const totalFederalTax = federalIncomeTax + selfEmploymentTax;

    // State taxes (self-employment tax does not apply to state)
    const stateTaxRate = rates.stateTaxRates[stateCode.toUpperCase()] || 0;
    const stateTaxableIncome = Math.max(0, netIncome - rates.standardDeduction - qbiDeduction);
    const stateTax = stateTaxableIncome * stateTaxRate;

    return {
        federal: totalFederalTax,
        state: stateTax
    };
};


  
  // Jobs
  // Get all jobs for a user
router.get('/jobs', async (req, res) => {
  try {
      const jobs = await Job.find({ userId: req.query.userId });
      res.json(jobs);
  } catch (err) {
      res.status(500).json({ message: err.message });
  }
});
  
  // Create a new job
router.post('/jobs', async (req, res) => {
  const job = new Job({
      name: req.body.name,
      client: req.body.client,
      userId: req.body.userId,
      transactions: []
  });


  try {
      const newJob = await job.save();
      res.status(201).json(newJob);
  } catch (err) {
      res.status(400).json({ message: err.message });
  }
});


// Add a transaction to a job
router.post('/jobs/transaction', async (req, res) => {
  try {
      const { jobId, transaction } = req.body;
      
      // Validate transaction amount
      if (!transaction.amount || isNaN(transaction.amount)) {
          return res.status(400).json({ message: 'Invalid transaction amount' });
      }

      const job = await Job.findById(jobId);
      if (!job) {
          return res.status(404).json({ message: 'Job not found' });
      }

      // Add the new transaction
      job.transactions.push({
          type: transaction.type,
          amount: transaction.amount,
          note: transaction.note || '',
          date: transaction.date || new Date()
      });

      const updatedJob = await job.save();
      res.json(updatedJob);
  } catch (err) {
      res.status(400).json({ message: err.message });
  }
});

  
//   router.post('/jobs/add_income', async (req, res) => {
//     const { jobId, amount, note, negative } = req.body;
//     const transaction = {
//         amount: negative ? -amount : amount,
//         note,
//         date: new Date(),
//     };
//     await Job.findByIdAndUpdate(jobId, { $push: { income: transaction } });
//     res.sendStatus(200);
// });

// router.post('/jobs/add_expense', async (req, res) => {
//     const { jobId, amount, note, negative } = req.body;
//     const transaction = {
//         amount: negative ? -amount : amount,
//         note,
//         date: new Date(),
//     };
//     await Job.findByIdAndUpdate(jobId, { $push: { expenses: transaction } });
//     res.sendStatus(200);
// });

  
  // Transactions
  router.get('/transactions', async (req, res) => {
      const { userId } = req.query;
      const transactions = await Transaction.find({ userId, jobId: null });
      res.json(transactions);
  });
  
  router.post('/transactions/associate', async (req, res) => {
      const { transactionId, jobId } = req.body;
      await Transaction.findByIdAndUpdate(transactionId, { jobId });
      await Job.findByIdAndUpdate(jobId, { $push: { expenses: transactionId } });
      res.sendStatus(200);
  });
  
  router.post('/transactions/unassociate', async (req, res) => {
      const { transactionId, jobId } = req.body;
      await Transaction.findByIdAndUpdate(transactionId, { jobId: null });
      await Job.findByIdAndUpdate(jobId, { $pull: { expenses: transactionId } });
      res.sendStatus(200);
  });

  // get a job
router.get('/jobs/:id', async (req, res) => {
  try {
    const job = await Job.findById(req.params.id);
    if (!job) {
      return res.status(404).json({ message: 'Job not found' });
    }
    res.json(job);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

  // Delete a job
router.delete('/jobs/:id', async (req, res) => {
  const { id } = req.params;
  try {
      await Job.findByIdAndDelete(id);
      res.send('Job deleted successfully');
  } catch (err) {
      res.status(500).send('Failed to delete job');
  }
});

// Update a job
router.put('/jobs/:id', async (req, res) => {
  const { id } = req.params;
  const { name, client } = req.body;
  try {
      await Job.findByIdAndUpdate(id, { name, client });
      res.send('Job updated successfully');
  } catch (err) {
      res.status(500).send('Failed to update job');
  }
});


router.patch('/jobs/:id', async (req, res) => {
  try {
      const { id } = req.params;
      const updatedData = req.body;

      const updatedJob = await Job.findByIdAndUpdate(id, updatedData, { new: true });
      
      if (!updatedJob) {
          return res.status(404).json({ message: 'Job not found' });
      }

      res.json(updatedJob);
  } catch (err) {
      console.error('Failed to update job', err);
      res.status(500).json({ message: 'Failed to update job' });
  }
});
  

  async function isSubscribed(user_id) {
    const maxRetries = 3; // Maximum number of retry attempts
    let retries = 0;
  
    while (retries < maxRetries) {
      try {
        const options = {
          method: 'GET',
          url: `https://api.revenuecat.com/v1/subscribers/${user_id}`,
          headers: { accept: 'application/json', Authorization: `Bearer ${REVENUECAT_API_KEY}` },
        };
  
        const response = await axios.request(options);
  
        // The user
        const subscriber = response.data.subscriber;
        const entitlements = subscriber.entitlements;
  
        // Look at the user's entitlements to check for cards
        for (const value of Object.values(entitlements)) {
          if (value['product_identifier'] === 'cards') {
            // Check if it is active
            const expirationTime = new Date(value.expires_date);
            const currentTime = new Date();
            return expirationTime > currentTime;
          }
        }
  
        // If no relevant entitlement was found, assume not subscribed
        return false;
      } catch (error) {
        if (error.response && error.response.status === 429) {
          const retryAfterHeader = error.response.headers['Retry-After'];
          if (retryAfterHeader) {
            const retryAfterMs = parseInt(retryAfterHeader)
            console.log(`Too Many Requests. Retrying after ${retryAfterMs} milliseconds...`);
            await wait(retryAfterMs);
          } else {
            console.log('Too Many Requests. No Retry-After header found.');
          }
          retries++;
        } else {
          // Handle other types of errors or non-retryable errors
          console.error('Error fetching isSubscribed: ', error.response.status);
          return false;
        }
      }
    }
  
    throw new Error(`Request to get isSubscribed failed after ${maxRetries} retries`);
  }
  
  function wait(ms) {
    return new Promise(resolve => setTimeout(resolve, ms));
  }



  // Ensure alive
  router.get('/ping', async(req, res) => {
    res.json(Date.now())
  })

   // A user just subscribed
  // Verify their reciept => grant tokens
  router.post('/newSubscriber', async(req, res) => {
    let user_id = req.body.user_id
    // Anyone can call this endpoint
    // Implement security by checking subscription status
    const subscribed = await isSubscribed(user_id);

    if (subscribed)
    {
      let currentDate = new Date();
      let dayofmonth = currentDate.getDate()
      // User is verified! Grant the tokens
      User.findByIdAndUpdate(
        req.body.user_id,
        {
          // Sets the tokens to TOKEN_COUNT and stores the date on which to renew.
          $set: { tokens: process.env.TOKEN_COUNT, renewal_date: dayofmonth} // Set tokens
        }, {new: true}).then((user) => {
    
          if (user)
          {
            // Send me a notice email
            const mailOptions = {
              from: process.env.MAILER_USER,
              to: process.env.ADMIN_EMAIL,
              subject: `🎉 Template NEW SUBSCRIBER! `,
              text: `Woohoo! 🥳 ${user.email} just subscribed!`,
            };
          
            // Send the email
            transporter.sendMail(mailOptions, (error, info) => {
              if (error) {
                console.log('Error sending warning email:', error);
              } else {
              }
            });

            res.status(200).send({
              message: "Success!",
              tokens: user.tokens
            });
          }
          else
          {
            res.status(404).send({
              message: "User not found!",
            });
          }
        })
        .catch((e) => {
          res.status(500).send({
            message: e,
          });
        })


    }
    else
    {
      // User is not subscribed return 401 unauthorized.
      res.status(401).send({status: "Unauthorized"})
    }

  })
  
  // Mark user as active when app is opened
  router.post('/appOpened', (req, res) => {
    User.findByIdAndUpdate(
      
      req.body.user_id,
      {
        $set: { dormant: 0 }
      }, {new: true}).then((user) => {
        console.log(user.email, "opened the app")
      })
  })
  
  // Update special requests
  // Used to update the database value for a user given id
  router.post('/updateRequests', (req,res) => {
    User.findByIdAndUpdate(
      
      req.body.user_id,
      {
        $set: { requests: req.body.requests }
      }, {new: true}).then((user) => {
        console.log(user.email, "updated preferences")
        res.send('Success')
      })
      .catch((e) => {
        console.log(e)
        res.status(500).send(e)
      })
    
  })

  // Load the user when they log in
  // Can we move this to the return of /login? this is unclear!
  // the reason we don't, is because we only need to /login once which gets the id (and will also return the user object), 
  // and /user is used once we have the id to get the user object from id (where /login gets it from email / pass)

  router.post('/user', (req, response) => {
    // Define fields to exclude from the user object (for security)
    const excludedFields = ['password'];

    // Utility function to remove specified fields from user obj
    const excludeFields = (obj) => {
      const newObj = { ...obj };
      excludedFields.forEach(field => delete newObj[field]);
      return newObj;
    };

    // Get the user
    User.findByIdAndUpdate(
      req.body.user_id,
      {
        // Do we need this AND /appOpened?
        // added appOpened because ... we may store the user on the device, no need to retrieve from db (faster)
        // faster if we have cached data. But, we we only try to login if cached anyway.
        // because , we hit this endpoint when logging in, which will occur when the app mounts for the first time
        // so, ...
        $set: { dormant: 0 } // Set dormant days to 0: Handled now by /appOpened endpoint

      }, {new: true}).then(async (user) => {
        

        if (user)
        {

          response.status(200).send({
            user: excludeFields(user.toObject()),
            rates: rates
          });
        }
        else
        {
          response.status(404).send({
            message: "User not found!",
          });
        }
      })
      .catch((e) => {
        
        response.status(500).send({
          message: "Error finding user",
        });
      })
      
      
  })

  // Change the password
  router.post('/setNewPassword', async(req,res) => {
    let code = req.body.resetCode
    let pass = req.body.pass
    let email = req.body.email

    // Find the user 
    let user = await User.findOne({email: email})


        // Validate request
        if (user && user.code == code) {
          // user is authorized to change the password
          // hash the password
          bcrypt
          .hash(pass, 5)
          .then((hashedPassword) => {
            // create a new user instance and collect the data
            user.password = hashedPassword

            // save the user
            user.save()
              // return success if the new user is added to the database successfully
              .then((updatedUser) => {
                res.status(200).send({
                  message: "Password changed successfully",
                  token: user._id,
                });
              })
              // catch error if the new user wasn't added successfully to the database
              .catch((errorResponse) => {

                  res.status(500).send({
                    message: "Error changing password!",
                    errorResponse,
                  });
                
              });
          })
          // catch error if the password hash isn't successful
          .catch((e) => {
            res.status(500).send({
              message: "Password was not hashed successfully",
              e,
            });
          });

        }

        else{
          //unauthorized request
          res.status(401)
          res.json('Unauthorized')
        }


    
  })

  // Send reset code to email
  router.post('/resetPassword', (req, res) => {
    const randomDecimal = Math.random();
      const code = Math.floor(randomDecimal * 90000) + 10000;

      const updateOperation = {
          $set: {
            code: code
          },
        };
        
        // Use findOneAndUpdate to update the user's properties
        User.findOneAndUpdate(
          { email: req.body.email }, // Find the user by email
          updateOperation).then(() => {

            const mailOptions = {
              from: process.env.MAILER_USER,
              to: req.body.email,
              subject: `${code} is your ${process.env.APP_NAME} confirmaition code`,
              text: `A new password was requested for your account. If this was you, enter code ${code} in the app. If not, somebody tried to log in using your email.`,
            };
          
            // Send the email
            transporter.sendMail(mailOptions, (error, info) => {
              if (error) {
                console.log('Error sending email:', error);
                res.status(500)
                res.json({error: "error sending email"})
              } else {
                console.log('successfully sent code')
                res.status(200)
                res.json('successfully sent password reset email')
                
              }
            });
          }) 

  })

  // Function to send a verification code
  // New device is recognized during login. User account exists.
  // Must take user id and email, and device_id
  // store device_id in pending_device in user db
  // generate and store a device_code in user db
  // send email with the code and message
  async function sendCode(user, device) {

    return new Promise((resolve, reject) => {
      // Generate code
      const randomDecimal = Math.random();
      const code = Math.floor(randomDecimal * 90000) + 10000;

      const updateOperation = {
          $set: {
            code: code,
            pending_device: device,
            code_attempts: 0, // Reset failure count
          },
        };
        
        // Use findOneAndUpdate to update the user's properties
        User.findOneAndUpdate(
          { _id: user._id }, // Find the user by object ID
          updateOperation, // Apply the update operation
          { new: true }).then(() => {

            const mailOptions = {
              from: process.env.MAILER_USER,
              to: user.email,
              subject: `${code} is your ${process.env.APP_NAME} confirmaition code`,
              text: `Your ${process.env.APP_NAME} account was accessed from a new location. If this was you, enter code ${code} in the app. If not, you can change your password in the app. Feel free to reply to this email for any assistance!`,
            };
          
            // Send the email
            transporter.sendMail(mailOptions, (error, info) => {
              if (error) {
                console.log('Error sending email:', error);
                reject('Could not send mail!')
              } else {
                console.log('successfully sent code')
                resolve('Sent code!')
                
              }
            });
          }) 
        
    }) // Promise end
    }

  // Check the code the user provided
  router.post("/confirmDevice", async (req, response) => {
    // fetch the pending code and device id 
    let user = await User.findOne({email: req.body.email})

    //let user = null
        if (user) {
            
            // Check if the codes match, if so add the device
            if (user.code == req.body.code)
            {
              // Before adding this device, check if we can activate trial tokens
              Trial.findOne({}).then((trial_doc) => {

                const emailExists = trial_doc.emails.includes(user.email);
                const deviceExists = trial_doc.devices.includes(user.pending_device);
                let new_user = true

                if (emailExists)
                {
                  new_user = false
                }
                else
                {
                  trial_doc.emails.push(user.email)
                }

                if (deviceExists)
                {
                  new_user = false
                }
                else
                {
                  trial_doc.devices.push(user.pending_device)
                }

                

                trial_doc.save()


                // Confirm email / grant trial if applicable
                User.findByIdAndUpdate(
                  user._id,
                  {
                    // Grant trial if applicable
                    // $inc: { tokens: new_user? process.env.TRIAL_TOKENS: 0 },
                    $set: { email_confirmed: true }, // Confirmed the email
                    $push: { devices: user.pending_device}
                  },
                  { new: true }).then((updatedUser) => {

                    if (updatedUser) {
                      response.status(200).send({
                        message: "Success!",
                        new_user: new_user,
                        new_account: !user.account_complete,
                        token: user._id
                      });


                    } else {
                      response.status(404).send({
                          message: "Could not locate user",
                      });
                    }

                  })
              })

                
                  

            }
            else{

              // If this is their third failed code
              if (user.code_attempts >= 2)
              {
                // Return exhausted status
                response.status(429).send({
                  message: "Too many requests!",
                  });

                return
              }

              // First or second failure: Increase count and send wrong code 401
              User.findByIdAndUpdate( user._id, { $inc: { code_attempts: 1 } },
                { new: true }).then((updatedUser) => {

                  if (updatedUser) {
                    


                  } else {
                    console.log('Failed updating user document api/confirmDevice')
                    response.status(404).send({
                        message: "Could not locate user",
        
                    });
                  }

                })

                // Moved to here instead of if statement so the UI response does not wait on a DB operation
                response.status(401).send({
                  message: "Wrong code!",
                  });
              
            }
    
        //console.log('Code:', user.code);
        //console.log('Pending Device:', user.pending_device);
        } else {
            response.status(404).send({
                message: "Could not find user",
              });
        }
})

  // Send help email
  router.post("/contact", (request, response) => {
    const mailOptions = {
      from: process.env.MAILER_USER,
      to: process.env.MAILER_USER,
      bcc: process.env.ADMIN_EMAIL,
      subject: `${process.env.APP_NAME} Support`,
      text: `${request.body.msg}\n\nfrom ${request.body.email} (${request.body.uid})`,
    };
  
    // Send the email
    transporter.sendMail(mailOptions, (error, info) => {
      if (error) {
        console.log('Error sending support email from user:', error);
        response.status(500).send("Error")
      } else {
        response.status(200).send("Success")

      }
    });
  })

  // register endpoint
  // makes an account
  router.post("/register", (request, response) => {
    // hash the password
    bcrypt
      .hash(request.body.password, 5)
      .then((hashedPassword) => {
        // create a new user instance and collect the data

        const user = new User({
          email: request.body.email,
          password: hashedPassword,
          filters: {
            sports: userSports // Initialize filters.sports with sports data
          }
        });
  
        // save the new user
        user.save()
          // return success if the new user is added to the database successfully
          .then((result) => {
            // Email me of the new user, if option is enabled
            Options.findOne({}).then((option_doc) => {
              if (option_doc.registerAlerts)
              {
                // Send the email
                const mailOptions = {
                  from: process.env.MAILER_USER,
                  to: process.env.MAILER_USER,
                  bcc: process.env.ADMIN_EMAIL,
                  subject: `${process.env.APP_NAME} new user! 😁`,
                  text: `${request.body.email} has signed up!`,
                };
              
                // Send the email
                transporter.sendMail(mailOptions, (error, info) => {
                  if (error) {
                    console.log('Error sending new user email (to myself):', error);
                  } else {
                  }
                });
                
              }

            })

            response.status(201).send({
              message: "User Created Successfully",
              result,
            });
          })
          // catch error if the new user wasn't added successfully to the database
          .catch((errorResponse) => {
            let errorMessage = null;

            for (const key in errorResponse['errors']) {
              if (errorResponse['errors'][key].properties && errorResponse['errors'][key].properties.message) {
                errorMessage = errorResponse['errors'][key].properties.message;
                break; // Stop iterating once found
              }
            }

            if (errorMessage)
            {
              console.log(errorMessage)
              response.status(403).send({
                message: errorMessage,
                errorResponse,
              });
            }
            else{
              response.status(500).send({
                message: "User already exists!",
                errorResponse,
              });
            }
            
            
          });
      })
      // catch error if the password hash isn't successful
      .catch((e) => {
        response.status(500).send({
          message: "Password was not hashed successfully",
          e,
        });
      });
  });

/**
 * Verifies a user's identity by checking their password.
 * @param {string} uid - The user ID.
 * @param {string} password - The password to check.
 * @returns {Promise<Object>} - Resolves with the user object if successful, or rejects with an error message.
 */
function verifyUser(uid, password) {
  return User.findById(uid)
    .then((user) => {
      if (!user) {
        return Promise.reject({ status: 404, message: "User not found" });
      }

      return bcrypt.compare(password, user.password).then((passwordCheck) => {
        if (!passwordCheck) {
          return Promise.reject({ status: 401, message: "Wrong password" });
        }

        return user; // Return the user if password is correct
      });
    })
    .catch((error) => {
      // Handle unexpected errors
      if (!error.status) {
        console.error("Error during user verification:", error);
        error = { status: 500, message: "Internal server error" };
      }
      throw error;
    });
}

router.post('/update-account', (req, res) => {
  const { uid, password, newpass, newcompanyname } = req.body;

  verifyUser(uid, password)
    .then((user) => {

      // Cancel if nothing will change
      if (!newpass && newcompanyname === user.company) {
        return res.status(400).send({ message: "No changes provided" });
      }

      // Prepare the fields to update
      const updateFields = {};
      if (newcompanyname) updateFields.company = newcompanyname;

      // Hash the new password if provided
      if (newpass) {
        return bcrypt
          .hash(newpass, 10)
          .then((hashedPassword) => {
            updateFields.password = hashedPassword;
            return User.findOneAndUpdate({ _id: uid }, updateFields, { new: true });
          });
      }

      // If only company is updated
      return User.findOneAndUpdate({ _id: uid }, updateFields, { new: true });
    })
    .then((updatedUser) => {
      if (!updatedUser) {
        return res.status(400).send({ message: "Bad request" });
      }

      res.json({ id: updatedUser._id });
    })
    .catch((error) => {
      console.error(error); // Log the error for debugging
      const status = error.status || 500;
      const message = error.message || "Internal server error";
      res.status(status).send({ message });
    });
});

  

// login / register merged endpoint

router.post("/log-or-reg", (request, response) => {
    // check if email exists
    
    User.findOne({ email: request.body.email })
    
      // if email exists
      .then((user) => {
        
        // compare the password entered and the hashed password found
        bcrypt
          .compare(request.body.password, user.password)

          // if the passwords match
          .then(async (passwordCheck) => {

            
  
            // check if password matches
            if(!passwordCheck) {
                return response.status(400).send({
                message: "Passwords does not match",
              });
            }

            console.log('Logging in..')

            //Now check if device is permitted
            if (bypass_confirmations || user.devices.includes(request.body.device) || user.email == "demo@demo.demo")
            {

                response.status(200).send({
                    message: "Login Successful",
                    token: user._id,
                    new_account: !user.account_complete,
                    new_user: false
                });
            }
            else 
            {
                // Device not recognized. Send email code to recognize device!
                // When code is entered, allow the login and add the device to DB.

                sendCode(user, request.body.device).then((res) =>
                {
                  console.log("code sent!")
                    // Code was sent successfully 
                    response.status(422).send({
                        message: res
                    });

                })
                .catch((error) => {
                  console.log(error)
                  response.status(500).send({
                    message: error,
                });
                })
                
            }

            
  
            
          })
          // catch error if password does not match
          .catch((error) => {
            console.log(error)
            response.status(400).send({
              message: "Passwords do not match",
              error,
            });
          });
      })
      // catch error if email does not exist
      .catch((e) => {
        
        // @REGISTER : EMAIL NOT FOUND
        // hash the password
        bcrypt
        .hash(request.body.password, 5)
        .then((hashedPassword) => {
          // create a new user instance and collect the data
          const user = new User({
            email: request.body.email,
            password: hashedPassword,
            email_confirmed: bypass_confirmations
          });

    
          // save the new user
          user.save()
            // return success if the new user is added to the database successfully
            .then((result) => {
              const userId = result._id;
              // Make a new job for this user called "General Expenses" with no client
              const job = new Job({
                name: "General Expenses",
                client: "General",
                userId: userId,
                transactions: []
              });
              job.save();
              

              // Email me of the new user, if option is enabled
              Options.findOne({}).then((option_doc) => {
                if (option_doc.registerAlerts)
                {
                  // Send the email
                  const mailOptions = {
                    from: process.env.MAILER_USER,
                    to: process.env.MAILER_USER,
                    bcc: process.env.ADMIN_EMAIL,
                    subject: `${process.env.APP_NAME} new user! 😁`,
                    text: `${request.body.email} has signed up!`,
                  };
                
                  // Send the email
                  transporter.sendMail(mailOptions, (error, info) => {
                    if (error) {
                      console.log('Error sending new user email (to myself):', error);
                    } else {
                    }
                  });
                  
                }

              })

              if (bypass_confirmations)
              {
                response.status(200).send({
                  message: "Registration Successful",
                  token: user._id,
                  new_account: true,
                  new_user: false
                });
              }
              else
              {
                // Now, send the code to verify the email
                sendCode(user, request.body.device)
                .then((res) =>
                  {
                    console.log("code sent!")
                      // Code was sent successfully 
                      response.status(422).send({
                          message: res
                      });
    
                  })
                  .catch((error) => {
                    console.log(error)
                    response.status(500).send({
                      message: error,
                    });
                  })
              }

            })
            // catch error if the new user wasn't added successfully to the database
            .catch((errorResponse) => {
              
                response.status(500).send({
                  message: "Internal error!",
                  errorResponse,
                });
              
              
            });
        })
        // catch error if the password hash isn't successful
        .catch((e) => {
          response.status(500).send({
            message: "Password was not hashed successfully",
            e,
          });
        });

      });
  });

  //login
router.post("/login", (request, response) => {
// check if email exists

User.findOne({ email: request.body.email })

  // if email exists
  .then((user) => {
    
    
    // compare the password entered and the hashed password found
    bcrypt
      .compare(request.body.password, user.password)

      // if the passwords match
      .then(async (passwordCheck) => {

        

        // check if password matches
        if(!passwordCheck) {
            return response.status(400).send({
            message: "Passwords does not match",
          });
        }

        console.log('Logging in..')

        //Now check if device is permitted
        if (user.devices.includes(request.body.device) || user.email == "demo@demo.demo")
        {

            response.status(200).send({
                message: "Login Successful",
                token: user._id,
                new_account: !user.account_complete,
                new_user: false
            });
        }
        else 
        {
            // Device not recognized. Send email code to recognize device!
            // When code is entered, allow the login and add the device to DB.

            sendCode(user, request.body.device)
            .then((res) =>
            {
              console.log("code sent!")
                // Code was sent successfully 
                response.status(422).send({
                    message: res
                });

            })
            .catch((error) => {
              console.log(error)
              response.status(500).send({
                message: error,
            });
            })
            
        }

        

        
      })
      // catch error if password does not match
      .catch((error) => {
        console.log(error)
        response.status(400).send({
          message: "Passwords do not match",
          error,
        });
      });
  })
  // catch error if email does not exist
  .catch((e) => {
    
    response.status(404).send({
      message: "Email not found",
      e,
    });
  });
});

 

  // Delete account
  router.post('/deleteAccount', async(req, response) => {
    let pwd = req.body.password
    let id = req.body.id

    User.findById({_id: id })
      
        // if email exists
        .then((user) => {
          
          
          // compare the password entered and the hashed password found
          bcrypt
            .compare(pwd, user.password)

            // if the passwords match
            .then(async (passwordCheck) => {
    
              // check if password matches
              if(!passwordCheck) {
                  return response.status(400).send({
                  message: "Passwords does not match",
                });
              }

              User.findByIdAndDelete(id)
              .then((res)=> {
                response.status(200).send({
                  message: "Delete Successful"
              });

              })
              .catch((e) => {
                response.status(500).send({
                  message: e
              });

              })

                  
              
            })
            // catch error if password does not match
            .catch((error) => {
              console.log(error)
              response.status(400).send({
                message: "Passwords does not match",
                error,
              });
            });
        })
        // catch error if email does not exist
        .catch((e) => {
          
          response.status(404).send({
            message: "User not found",
            e,
          });
        });
  })


  module.exports = router;