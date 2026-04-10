const mongoose = require('mongoose');
const path = require('path');
require('dotenv').config({ path: path.join(__dirname, '../.env') });

const User = require('../models/User');

async function checkUsers() {
    try {
        console.log('Connecting to:', process.env.MONGO_URI);
        await mongoose.connect(process.env.MONGO_URI);
        console.log('Connected to DB');
        
        const users = await User.find({}, 'email name password googleId').select('+password');
        console.log('Total Users:', users.length);
        users.forEach(u => {
            console.log(`- ${u.email} | Name: ${u.name} | Has Password: ${!!u.password} | GoogleId: ${u.googleId || 'None'}`);
        });
        
        process.exit(0);
    } catch (err) {
        console.error(err);
        process.exit(1);
    }
}

checkUsers();
