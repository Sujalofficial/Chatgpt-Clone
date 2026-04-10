const mongoose = require('mongoose');
const path = require('path');
require('dotenv').config({ path: path.join(__dirname, '../.env') });
const User = require('../models/User');

async function setPassword() {
    try {
        await mongoose.connect(process.env.MONGO_URI);
        const email = 'agrawalsujal2003@gmail.com';
        const user = await User.findOne({ email });
        
        if (!user) {
            console.log('User not found');
            process.exit(1);
        }

        user.password = 'Sujal@123'; // Temporary password
        user.resetPasswordToken = undefined;
        user.resetPasswordExpire = undefined;
        await user.save();

        console.log(`✅ Password for ${email} has been manually set to: Sujal@123`);
        process.exit(0);
    } catch (err) {
        console.error(err);
        process.exit(1);
    }
}

setPassword();
