const removedMessages = [
    "🚫 @${participant.split('@')[0]} has been booted out! Don't let the door hit you on the way out! 😂",
    "👢 @${participant.split('@')[0]} was kicked out! Hasta la vista, baby! 😜",
    "😢 @${participant.split('@')[0]} has been shown the exit! Bye Felicia! 👋",
    "👋 @${participant.split('@')[0]} has been removed! Don't forget to write! 📝",
    "🚫 @${participant.split('@')[0]} is no longer with us! Adios, amigo! 🌵"
];

const leftMessages = [
    "Goodbye @${participant.split('@')[0]}, we'll miss your weird jokes! 😂",
    "Farewell @${participant.split('@')[0]}, hope to see you again in another life! 👽",
    "It's sad to see you go, @${participant.split('@')[0]}. Don't forget to send us a postcard! 🏖️",
    "Bye @${participant.split('@')[0]}, wishing you all the best in your future meme endeavors! 🤣",
    "So long, @${participant.split('@')[0]}! Stay in touch and keep being awesome! 🌟",
    "Adios @${participant.split('@')[0]}, until we meet again in the land of emojis! 😜",
    "Goodbye @${participant.split('@')[0]}, thanks for all the laughs! 😂",
    "See you later, @${participant.split('@')[0]}! Don't be a stranger, come back with more jokes! 🤡",
    "Take care, @${participant.split('@')[0]}! We'll miss your hilarious comments! 😂",
    "Bye @${participant.split('@')[0]}, hope you had a great time with us! Don't forget to laugh! 😆"
];

module.exports = { removedMessages, leftMessages };