# Birthday Message Scheduler App

This project is a Birthday Message Scheduler application built using Node.js, Express, MongoDB, and Axios. It sends automatic birthday messages to users at 9 AM their local time, based on the user's location and birthday.

## Features

- REST API to create, update, and delete users.
- Schedules and sends customized birthday messages.
- Uses MongoDB for storing user data.
- Handles time zones using moment-timezone.

## Prerequisites

Before you begin, ensure you have met the following requirements:
- Node.js installed (version 12.x or above)
- MongoDB installed and running locally or accessible via a network connection
- npm or yarn installed

## Installation

To install the project, follow these steps:

1. Clone the repository:
    ```bash
    git clone https://github.com/yourusername/birthday-message-scheduler.git
    cd birthday-message-scheduler
    ```
2. Install the dependencies:
    ```bash
    npm install
    ```

## Configuration

Create a `.env` file in the root directory based on the `.env.example` template. You can start by copying the example file:
```bash
cp .env.example .env
```

Update the `.env` file with the necessary details. Here are the key environment variables you need to set:
* **PORT**: The port on which the server will run (default is 3000).
* **MONGO_URI**: Your MongoDB URI.
* **EMAIL_SERVICE_URL**: URL to the email service to send birthday messages.

Example of `.env` contents:
```plaintext
PORT=3000
MONGO_URI=mongodb://localhost:27017/birthdayApp
EMAIL_SERVICE_URL=https://youremailservice.com
```

## Usage

To run the application, use the following command:
```bash
npm start
```
This will start the server on the port specified in your `.env` file (default is 3000).

## API Endpoints

* `POST /user`: Create a new user
    * Body parameters: `firstName`, `lastName`, `email`, `birthday`, `location`
* `PUT /user/:id`: Update an existing user
    * Body parameters: `firstName`, `lastName`, `email`, `birthday`, `location`
* `DELETE /user/:id`: Delete an existing user

## Testing

To run the tests, use the following command:
```bash
npm test
```
This command will execute all tests written in the `tests/` directory.

## Contributing

Contributions are welcome! For major changes, please open an issue first to discuss what you would like to change.

## License
This project is MIT licensed.

## Contact
If you have any questions, please contact me at [arjunsumarlan@gmail.com].