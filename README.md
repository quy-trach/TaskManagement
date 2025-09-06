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
<img width="1881" height="892" alt="Ảnh chụp màn hình 2025-08-26 205208" src="https://github.com/user-attachments/assets/29d11681-d703-47b3-b9f1-7f13bd9c63a9" />

-----

<img width="1904" height="887" alt="image" src="https://github.com/user-attachments/assets/c77eda50-495c-471f-831a-288529ca8c4d" />

-----

<img width="1920" height="1195" alt="screencapture-localhost-61604-project-list-2025-08-26-20_51_31" src="https://github.com/user-attachments/assets/e737ae2e-bc46-460d-a93e-81ec3f6d42a4" />

-----

<img width="1905" height="891" alt="Ảnh chụp màn hình 2025-08-26 205225" src="https://github.com/user-attachments/assets/ba7a63ae-aa68-4e3c-b6aa-f499a1e5f65b" />

-----


<img width="1893" height="878" alt="Ảnh chụp màn hình 2025-08-26 205239" src="https://github.com/user-attachments/assets/9ec8cd4b-1d6a-4318-916c-2cbbc18e3940" />


