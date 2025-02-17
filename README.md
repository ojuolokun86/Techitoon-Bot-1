# Techitoon Bot

Techitoon Bot is a feature-rich WhatsApp bot designed to enhance user interaction and provide various functionalities through commands. This bot is capable of responding to its own commands, recognizing messages, and managing different types of commands based on user roles.

## Features

- **Command Recognition**: The bot can recognize and respond to its own commands.
- **Admin Commands**: Certain commands are restricted to bot administrators, allowing for group management and user moderation.
- **Bot Commands**: General commands that any user can execute, providing fun and useful interactions.
- **Common Commands**: Accessible commands for all users, offering information and utilities.

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
│   │   └── commoncommand.js
│   └── utils
│       └── utils.js
├── package.json
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

5. **Run the Bot**:
   ```
   node src/index.js
   ```

## Usage Guidelines

- To interact with the bot, simply send a message containing the command you wish to execute.
- Admin commands are restricted to the bot owner (Phone Number: 2348026977793).
- Use the `helpMenu` command to see a list of available commands.

## Contributing

Contributions are welcome! Please feel free to submit a pull request or open an issue for any suggestions or improvements.

## License

This project is licensed under the MIT License. See the LICENSE file for details.