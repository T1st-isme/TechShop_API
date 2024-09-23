# TechShop Server

## Overview

TechShop Server is a backend application for managing an e-commerce platform. It provides APIs for user authentication, product management, order processing, and more.

## Features

- User authentication and authorization
- Product management
- Order processing
- Wishlist management
- API documentation with Bump.sh

## Getting Started

### Prerequisites

- Node.js (v18.18.2 or later)
- MongoDB
- Docker (optional, for containerized deployment)

### Installation

1. Clone the repository:

   ```sh
   git clone https://github.com/yourusername/techshop-server.git
   cd server
   ```

2. Install dependencies:

   ```sh
   npm install
   yarn install
   bun install
   ```

3. Set up environment variables:
   Create a `.env` file in the root directory and add the necessary environment variables. Refer to the [Environment Variables](#environment-variables) section for more details.

### Running the Application

To start the application in development mode:

```sh
npm run dev
yarn dev
bun dev
```

To start the application in production mode:

```sh
npm run start
yarn start
bun start
```

### Environment Variables

The application requires the following environment variables:

**Port**

- `PORT`: The port number for the application.

**MongoDB**

- `MONGO_URL`: The MongoDB connection string.

**Security**

- `JWT_SECRET`: The secret key for JWT authentication.
- `JWT_EXPIRES_TIME`: The expiration time for JWT tokens.
- `COOKIE_EXPIRES_TIME`: The expiration time for JWT cookies.

**Cloudinary**

- `CLOUD_NAME`: The name of the cloud service.
- `API_KEY`: The API key for the cloud service.
- `API_SECRET`: The secret key for the cloud service.

**VNPay**

- `vnp_TmnCode`: The terminal code for VNPay.
- `vnp_HashSecret`: The hash secret for VNPay.
- `vnp_Url`: The URL for VNPay.
- `vnp_ReturnUrl`: The return URL for VNPay.

**PayOS**

- `PAYOS_CLIENT_ID`: The client ID for PayOS payment processing.
- `PAYOS_API_KEY`: The API key for PayOS.
- `PAYOS_CHECKSUM_KEY`: The checksum key for PayOS.

You can find these values in the `.env.example` file.
