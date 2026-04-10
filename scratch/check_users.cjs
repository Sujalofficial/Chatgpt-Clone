const mongoose = require('mongoose');
require('dotenv').config({ path: './backend/.env' });

const User = require('./backend/models/User');

async function checkUsers() {
    try {
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
