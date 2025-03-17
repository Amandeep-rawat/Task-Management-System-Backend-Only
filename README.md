# Task Management API

A RESTful API for a task management system built with Node.js and Express.

## Features

- User Authentication (JWT-based)
- CRUD Operations for Tasks
- Pagination & Filtering
- Redis Caching for Performance
- Priority Queue Implementation for Task Scheduling
- Unit Tests with Jest

## Requirements

- Node.js (v14+)
- MongoDB
- Redis

## Installation

## Installation

1. **Clone the repository**  
   ```sh
   git clone https://github.com/yourusername/task-management-api.git
   cd task-management-api

2. **Install dependency**
    npm install 

3. **Setup Environment Variables**
    Create a .env file in the root directory and configure it as per .env.example.

4. **Start server**
    npm start or nodemon app.js for live changes.http://localhost:5000.

5.  **Run Tests (Optional - Bonus)**
    npm test / check package.json 


🔗 API Endpoints
Authentication Routes
Method	    Endpoint	     Description   	   Authentication
POST	 /api/auth/register	Register a new user 	❌ No
POST	 /api/auth/login	Login user	                ❌ No
GET	    /api/auth/me	   Get current user profile     	✅ Yes



Task Management Routes
Method	Endpoint	Description	Authentication
POST	/api/tasks	Create a new task	✅ Yes
GET	/api/tasks	Get tasks (with filters/pagination)	✅ Yes
PUT	/api/tasks/:id	Update a task	✅ Yes
DELETE	/api/tasks/:id	Delete a task	✅ Yes

check route folder for another routes....scheduling routes are there too . 


🚀 Deployment
For production, use Docker or deploy on Vercel, Render, or AWS.

