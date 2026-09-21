# Scaalable CRM - Execution Guide

This guide explains how to start the Scaalable CRM application, especially after restarting your computer.

## Prerequisites

Make sure you have the following installed on your machine:
- **Docker Desktop**: [Download here](https://www.docker.com/products/docker-desktop)
- **Ngrok**: [Download here](https://ngrok.com/download)

---

## 🚀 How to Start the Application

Whenever you turn on your laptop or want to run the CRM, follow these 3 simple steps:

### 1. Start Docker Desktop
Open **Docker Desktop** from your Windows Start menu. 
Wait until it fully loads and the whale icon in your system tray turns green (indicating the Docker Engine is running).

### 2. Start the Docker Containers
Open a terminal (Command Prompt or PowerShell) inside the `Scaalable` project folder and run:
```powershell
docker-compose up -d
```
*This command starts your Database, Backend (on port 8081), and Frontend (on port 3001) in the background.*

### 3. Start the Ngrok Tunnel
To allow Plivo to communicate with your local backend for the dialer to work, you must start your Ngrok tunnel. 

Open a **second** terminal window and run:
```powershell
ngrok http 3001 --domain=camisole-delusion-smile.ngrok-free.dev
```
*Because your frontend Nginx container automatically routes `/api/` requests to your backend, pointing Ngrok to port 3001 perfectly exposes both your React frontend (so your CEO can test it) AND your backend webhooks (so Plivo can dial) at the exact same time!*

---

## 🌐 Accessing the Application

Once everything is running, you can access the application in your browser:
- **Frontend UI:** [http://localhost:3001](http://localhost:3001)

## 🛑 How to Stop the Application

When you are done working, you can safely shut down the containers.
In your terminal inside the `Scaalable` folder, run:
```powershell
docker-compose down
```
You can also press `Ctrl + C` in the terminal where Ngrok is running to close the tunnel.
