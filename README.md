# GreenLedger - OpenSource Accounting Software for Small Businesses

## Overview

GreenLedger is an open-source accounting software designed specifically for small businesses. It provides a comprehensive solution for managing finances, tracking expenses, generating reports, and facilitating transactions. The software is built using Node.js for the backend and Next.js for the frontend, ensuring a robust and scalable architecture. With features like user authentication, role-based access control, and detailed reporting, this application aims to simplify financial management for small business owners.

## Features

### Backend Features
- User authentication and role-based access control
- Expense tracking and management
- Sales management
- Reporting and analytics
- File uploads for receipts and invoices
- Email notifications
- CORS support for cross-origin requests
- Rate limiting to prevent abuse

### Frontend Features
- User-friendly interface for managing finances
- Responsive design for mobile and desktop
- Integration with backend APIs for real-time data
- Dashboard for quick insights into financial health

## Technologies Used

### Backend
- Node.js
- Express.js
- MongoDB
- Mongoose
- Joi for validation
- Multer for file uploads

### Frontend
- Next.js
- Axios for API calls
- CSS/SCSS for styling

## Installation

### Prerequisites

Before you begin, ensure you have the following installed on your machine:
- Node.js (v14 or higher)
- MongoDB (local or cloud instance)
- npm (Node package manager)

### Steps to Set Up

1. **Clone the Repository**

   Open your terminal and run the following command to clone the repository:

   ```bash
   git clone https://github.com/ranabhatshree/greenledger.git
   ```

2. **Navigate to the Project Directory**

   ```bash
   cd greenledger
   ```

3. **Install Backend Dependencies**

   Navigate to the backend directory (if applicable) and run:

   ```bash
   cd backend
   npm install
   ```

4. **Install Frontend Dependencies**

   Navigate to the frontend directory and run:

   ```bash
   cd frontend
   npm install
   ```

5. **Set Up Environment Variables**

   Create a `.env` file in the root of the backend project and add the following variables:

   ```plaintext
   MONGO_URI=mongodb://localhost:27017/yourdbname
   JWT_SECRET=your_jwt_secret
   COMPANY_NAME=Your Company Name
   COMPANY_EMAIL=your_email@example.com
   BREVO_API_KEY=your_brevo_api_key
   PORT=5000
   NODE_ENV=development
   ```

   For the frontend, create a `.env.local` file in the frontend directory and add the following variable:

   ```plaintext
   NEXT_PUBLIC_API_BASE_URL=http://localhost:5000
   ```

   Make sure to replace the placeholder values with your actual configuration.

6. **Run the Backend Application**

   Start the server by running:

   ```bash
   npm start
   ```

   The backend application will be running on `http://localhost:5000`.

7. **Run the Frontend Application**

   Navigate back to the frontend directory and start the frontend application:

   ```bash
   cd frontend
   npm run dev
   ```

   The frontend application will typically run on `http://localhost:3000`.

8. **Run Tests (Optional)**

   To run the tests for the backend, use the following command:

   ```bash
   cd backend
   npm test
   ```

   For the frontend, you can run:

   ```bash
   cd frontend
   npm test
   ```

## Usage

- **API Endpoints**: The backend application exposes various API endpoints for managing users, expenses, sales, and more. You can use tools like Postman or curl to interact with the API.
- **Frontend Integration**: The frontend application integrates with the backend APIs to provide a seamless user experience for managing finances.

## Contributing

Contributions are welcome! If you have suggestions for improvements or new features, feel free to open an issue or submit a pull request.

## License

This project is licensed under the MIT License. See the [LICENSE](LICENSE) file for details.

## Acknowledgments

- Thanks to the open-source community for their contributions and support.
- Special thanks to the developers of the libraries and frameworks used in this project.