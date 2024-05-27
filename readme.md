
---

# Student Exam Backend

Welcome to the backend repository for the Student Exam application. This backend handles authentication, exam management, and user data storage.

## Table of Contents

- [Installation](#installation)
- [Usage](#usage)
- [API Endpoints](#api-endpoints)
- [Authentication](#authentication)
- [Database](#database)
- [Contributing](#contributing)
- [License](#license)

## Installation

To set up the backend locally, follow these steps:

1. Clone the repository:

```bash
git clone <repository-url>
```

2. Navigate to the project directory:

```bash
cd <file-name>
```

3. Install dependencies:

```bash
npm install
```

4. Set up environment variables:

Create a `.env` file in the root directory and add the following variables:

PORT=3000
DB_CONNECTION=<database-connection-string>
SECRET_KEY=<secret-key-for-jwt>

````

Replace `<database-connection-string>` with the connection string for your MongoDB database and `<secret-key-for-jwt>` with a secret key for JWT token generation.

5. Start the server:

```bash
npm start
````

The server should now be running on `http://localhost:3000`.

## Usage

This backend provides endpoints for exam management and user authentication. You can use these endpoints to create, retrieve, update, and delete exams, as well as authenticate users.

To interact with the backend, you can use tools like Postman or curl to send HTTP requests to the provided endpoints.

## API Endpoints

### Exams

- `GET /api/exams`: Get all exams
- `GET /api/exams/:id`: Get an exam by ID
- `POST /api/exams`: Create a new exam
- `PUT /api/exams/:id`: Update an existing exam
- `DELETE /api/exams/:id`: Delete an exam

### Authentication

- `POST /api/auth/register`: Register a new user
- `POST /api/auth/login`: Login with existing credentials

## Authentication

This backend uses JWT (JSON Web Tokens) for authentication. When a user logs in, a JWT token is generated and sent back to the client. Subsequent requests to protected routes require this token to be included in the request headers.

## Database

This backend uses MongoDB as its database. Make sure you have MongoDB installed and running locally or provide a remote MongoDB connection string in the `.env` file.

## Contributing

Contributions are welcome! If you have any suggestions, bug fixes, or feature requests, please open an issue or submit a pull request.

## License

This project is licensed under the [MIT License](LICENSE).

---