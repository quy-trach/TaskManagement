# 📝 Task Management System with Real-time Chat

**Task Management System** is a web application designed to help organizations manage tasks and assignments more efficiently.
This project is **developed by students for learning purposes** and is **not intended for commercial use**.

The current version includes core task management functionalities, and the team is actively **developing a real-time internal chat feature (SignalR)** to enhance collaboration.
⚠️ *Note: The internal chat feature is still under development.*

---

## ✨ Key Features

### 👤 Detailed User Roles

* **Director**

  * Full administrative control of the system
  * Can manage users, departments, and all tasks
* **Manager**

  * Can manage employees and tasks **within their assigned department only**
  * Cannot access or modify other departments
* **Employee**

  * Can view their personal information and assigned tasks only
  * Can update the progress of their own tasks

### 💻 Unified User Interface

* One intuitive interface for all user roles
* Seamless experience regardless of permissions

### 🔗 RESTful API

* Clear and secure API endpoints for frontend-backend communication
* Scalable and easy to integrate with other systems

### 💬 Internal Real-time Chat *(in progress)*

* Instant messaging between users
* Improves collaboration and task coordination

---

## 🛠️ Technologies Used

### Frontend

* **ReactJS** – Dynamic user interface
* **React Router** – Client-side routing
* **Axios** – HTTP requests to backend API
* **@microsoft/signalr** – Real-time connection management

### Backend

* **ASP.NET MVC (C#)** – Server-side application framework
* **Entity Framework Core** – Database ORM and queries
* **ASP.NET Identity** – User authentication and authorization
* **ASP.NET Core SignalR** – Real-time two-way communication

### Database

* **SQL Server**

---

## 🚀 Getting Started

### 1. Prerequisites

* Node.js & npm
* .NET SDK (version 6.0 or later)
* SQL Server

### 2. Backend Setup

```bash
git clone https://github.com/quy-trach/TaskManagement.git
cd TaskManagement/backend

dotnet restore
dotnet ef database update
dotnet run
```

### 3. Frontend Setup

```bash
cd ../frontend
npm install
npm start
```

---

## 👥 Contributors

* Quy Trach – [GitHub](https://github.com/quy-trach)

---


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



