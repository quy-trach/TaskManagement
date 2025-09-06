## 📝 Task Management System with Real-time Chat
The Task Management System is a robust web application designed to help organizations efficiently manage tasks and assignments. This system is now enhanced with a real-time internal chat feature to improve collaboration. It is built using ReactJS for the frontend user interface and an ASP.NET MVC (C#) backend, leveraging a RESTful API architecture for flexibility and scalability.

## ✨ Key Features
Detailed User Authorization: The system supports three primary user roles, each with distinct permissions:

Director: Has full administrative control over the entire system. They can create, edit, and delete users, departments, and all tasks.

Manager: Can only manage employees and tasks within their specific department. They have no access to information or management capabilities outside of their assigned department.

Employee: Can only view their personal information and the tasks assigned to them. They are permitted to update the progress of their own tasks but are restricted from editing any other information.

Unified User Interface: Despite the detailed user roles, all users interact with a single, intuitive interface, providing a seamless and consistent user experience.

RESTful API: The backend is designed with a RESTful API, providing clear and secure endpoints for communication between the frontend and the server.

Real-time Internal Chat: This new feature, powered by SignalR, facilitates instant communication between users within the system, enhancing collaboration and task coordination.

## 🛠️ Technologies Used
Frontend
ReactJS: For building the dynamic user interface.

React Router: For client-side routing.

Axios: For making HTTP requests to the backend API.

@microsoft/signalr: For establishing and managing real-time connections with the backend.

Backend
ASP.NET MVC (C#): The core framework for building the server-side application.

Entity Framework Core: For database interactions and object-relational mapping (ORM).

ASP.NET Identity: For handling user authentication and authorization.

ASP.NET Core SignalR: For enabling real-time, two-way communication between the server and clients.

Database
SQL Server

## 🚀 Getting Started
1. Prerequisites
Node.js (and npm)

.NET SDK (version 6.0 or later)

SQL Server

2. Backend Setup
Clone the repository:

Bash

git clone https://github.com/quy-trach/TaskManagement.git
cd TaskManagement/backend
Restore NuGet packages:

Bash

dotnet restore
Apply database migrations:

Bash

dotnet ef database update
Run the backend application:

Bash

dotnet run
3. Frontend Setup
Navigate to the frontend directory:

Bash

cd ../frontend
Install dependencies:

Bash

npm install
Start the frontend application:

Bash

npm start
## 👥 Contributors
Quy Trach - https://github.com/quy-trach

## 🖼️ Image
<img width="1918" height="909" alt="image" src="https://github.com/user-attachments/assets/3511a9e4-ba7e-40a4-a74b-0a1f3d15cd26" />

-----

<img width="1919" height="907" alt="image" src="https://github.com/user-attachments/assets/e09362c6-b406-4f55-a8f6-c78a3149d0a7" />

-----

<img width="1901" height="914" alt="image" src="https://github.com/user-attachments/assets/2c0c5f98-08ce-43bd-9079-c3ae092711c1" />

-----
<img width="1901" height="877" alt="image" src="https://github.com/user-attachments/assets/eab2b5ad-9883-4b09-bc3c-16d4df39496e" />

-----

<img width="1888" height="903" alt="image" src="https://github.com/user-attachments/assets/e292fb81-f8b0-4dbc-b308-1481acfa8302" />

-----

<img width="1894" height="908" alt="image" src="https://github.com/user-attachments/assets/f2b8b0f0-230a-46eb-918e-540b3dbdf1df" />

-----

<img width="1896" height="886" alt="image" src="https://github.com/user-attachments/assets/87801193-1ca6-4759-ba34-419ac1a3180f" />



