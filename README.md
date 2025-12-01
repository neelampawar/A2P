# Blinkit-AP2 - Agentic Payments Protocol

This project is a sophisticated, AI-driven e-commerce platform that demonstrates the power of agentic payments. It combines a sleek, modern frontend with a robust Python backend, allowing users to interact with a conversational AI to manage their shopping cart and complete transactions.

## Features

- **Conversational AI Shopping Assistant**: Engage with a Gemini-powered AI to add items to your cart, inquire about products, and initiate checkout.
- **Agentic Payments**: Experience the future of online payments with a seamless, secure, and automated checkout process.
- **Dynamic Product Catalog**: Browse a rich product catalog with dynamically generated images and real-time updates.
- **Interactive UI**: A user-friendly interface built with React and Tailwind CSS provides a smooth and responsive shopping experience.
- **Backend Integration**: The Python backend manages product information, shopping carts, and payment processing, ensuring data consistency and reliability.

## Technologies Used

- **Frontend**: React, TypeScript, Tailwind CSS, Vite
- **Backend**: Python, FastAPI
- **AI**: Gemini 2.5 Pro
- **Payments**: Agentic Payments Protocol (AP2)

## Getting Started

To get the project up and running on your local machine, follow these simple steps.

### Prerequisites

- Node.js
- Python 3.10+
- Pip

### Installation

1.  **Clone the repository**:
    ```bash
    git clone https://github.com/your-username/Blinkit-AP2.git
    cd Blinkit-AP2
    ```

2.  **Install frontend dependencies**:
    ```bash
    npm install
    ```

3.  **Set up the backend**:
    ```bash
    cd backend
    python3 -m venv venv
    source venv/bin/activate
    pip install -r requirements.txt
    ```

4.  **Configure environment variables**:
    Create a `.env` file in the root directory and add your Gemini API key:
    ```
    VITE_GEMINI_API_KEY=your_api_key_here
    ```

### Running the Application

1.  **Start the backend server**:
    ```bash
    cd backend
    source venv/bin/activate
    uvicorn main:app --reload
    ```

2.  **Start the frontend development server**:
    ```bash
    npm run dev
    ```

## Project Structure

The project is organized into two main parts: a frontend application and a backend server.

- **`frontend/`**: Contains the React application, including all components, services, and context providers for managing state.
- **`backend/`**: Includes the FastAPI server, which handles API requests, manages the product catalog, and processes payments.
- **`README.md`**: The file you are currently reading.
