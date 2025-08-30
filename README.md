# 📝 Task Management System

The **Task Management System** is a robust web application designed to help organizations efficiently manage tasks and assignments. This system is built using **ReactJS** for the frontend user interface and an **ASP.NET MVC (C\#)** backend, utilizing a **RESTful API** architecture for flexibility and scalability.

## ✨ Key Features

  - **Detailed User Authorization**: The system supports three primary user roles, each with distinct permissions:
      - **Director**: Has full administrative control over the entire system. They can create, edit, and delete users, departments, and all tasks.
      - **Manager**: Can only manage employees and tasks within their specific department. They have no access to information or management capabilities outside of their assigned department.
      - **Employee**: Can only view their personal information and the tasks assigned to them. They are permitted to update the progress of their own tasks but are restricted from editing any other information.
  - **Unified User Interface**: Despite the detailed user roles, all users interact with a single, intuitive interface, providing a seamless and consistent user experience.
  - **RESTful API**: The backend is designed with a RESTful API, providing clear and secure endpoints for communication between the frontend and the server.

-----

## 🛠️ Technologies Used

### Frontend

  - **ReactJS**: For building the dynamic user interface.
  - **React Router**: For client-side routing.
  - **Axios**: For making HTTP requests to the backend API.
  - [You can add other libraries here, e.g., Redux for state management, Material-UI for components, etc.]

### Backend

  - **ASP.NET MVC (C\#)**: The core framework for building the server-side application.
  - **Entity Framework Core**: For database interactions and object-relational mapping (ORM).
  - **ASP.NET Identity**: For handling user authentication and authorization.
  - [You can add other libraries here, e.g., Swagger for API documentation, etc.]

### Database

  - [Specify the type of database used, e.g., **SQL Server**, **PostgreSQL**, **MySQL**, etc.]

-----

## 🚀 Getting Started

### 1\. Prerequisites

  - **Node.js** (and npm)
  - **.NET SDK** (version 6.0 or later)
  - **SQL Server** (or your specified database)

### 2\. Backend Setup

```bash
# Clone the repository
git clone https://github.com/quy-trach/TaskManagement.git
cd TaskManagement/backend

# Restore NuGet packages
dotnet restore

# Apply database migrations
dotnet ef database update

# Run the backend application
dotnet run
```

### 3\. Frontend Setup

```bash
cd ../frontend

# Install dependencies
npm install

# Start the frontend application
npm start
```

-----

## 👥 Contributors

  - **Quy Trach** - https://github.com/quy-trach)

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


