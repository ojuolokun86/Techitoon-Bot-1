# Techitoon Bot

Techitoon Bot is a feature-rich WhatsApp bot designed to enhance user interaction and provide various functionalities through commands. This bot is capable of responding to its own commands, recognizing messages, and managing different types of commands based on user roles.

## Features

- **Command Recognition**: The bot can recognize and respond to its own commands.
- **Admin Commands**: Certain commands are restricted to bot administrators, allowing for group management and user moderation.
- **Bot Commands**: General commands that any user can execute, providing fun and useful interactions.
- **Common Commands**: Accessible commands for all users, offering information and utilities.
- **Security Features**: The bot includes security features to maintain admin rights and prevent unauthorized takeovers.

## Project Structure

```
Techitoon-Bot
├── src
│   ├── index.js
│   ├── bot.js
│   ├── service
│   │   └── service.js
│   ├── config
│   │   └── config.js
│   ├── message-controller
│   │   ├── admincommand.js
│   │   ├── botcommand.js
│   │   ├── commoncommand.js
│   │   ├── insertCommands.js
│   │   ├── links.js
│   │   ├── polls.js
│   │   ├── protection.js
│   │   ├── scheduleMessage.js
│   │   └── warning.js
│   └── utils
│       ├── logger.js
│       └── utils.js
├── package.json
├── .env
└── README.md
```

## Setup Instructions

1. **Clone the Repository**: 
   ```
   git clone https://github.com/yourusername/Techitoon-Bot.git
   ```

2. **Navigate to the Project Directory**:
   ```
   cd Techitoon-Bot
   ```

3. **Install Dependencies**:
   ```
   npm install
   ```

4. **Configure the Bot**:
   - Open `src/config/config.js` and set your API keys and bot owner ID.
   - Ensure the `.env` file is correctly set with the necessary environment variables:
     ```properties
     BOT_NUMBER=2348026977793
     ADMIN_NUMBER=2348026977793@s.whatsapp.net
     PREFIX=.
     SUPABASE_URL=https://lrirviucztezerohsxjq.supabase.co
     SUPABASE_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImxyaXJ2aXVjenRlemVyb2hzeGpxIiwicm9sZSI6ImFub24iLCJpYXQiOjE3MzkwMTU4NDIsImV4cCI6MjA1NDU5MTg0Mn0.nuWMFRceGxCU3sxNFl0v2kDX6xRNch-g0_19yTTU-Jk
     WEATHER_API_KEY=b938e5ef1c00e084a38426211a03a5b8
     TRANSLATION_API_KEY=your_translation_api_key
     BOT_OWNER_ID=2348026977793
     ```

5. **Run the Bot**:
   ```
   npm start
   ```

6. **Run the Bot in Development Mode**:
   ```
   npm run start:dev
   ```

## Usage Guidelines

- To interact with the bot, simply send a message containing the command you wish to execute.
- Admin commands are restricted to the bot owner (Phone Number: 2348026977793).
- Use the `helpMenu` command to see a list of available commands.

## Contributing

Contributions are welcome! Please feel free to submit a pull request or open an issue for any suggestions or improvements.

## License

This project is licensed under the MIT License. See the LICENSE file for details.