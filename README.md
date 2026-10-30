### Documentation for BME Suborbitals Ground Support Onboarding project

An interactive full-stack web-application built for BME Suborbitals Ground Support team.

## Problems solved

> visualizing telemetry data coming from rockets on diagrams and map.
> saving telemetry data into a database.
> displayment of camera data, and archiving footage.
> displayment and backuping of weather data.
> communication with Electrical Ground Support Equipment
> manipulation of incoming data

## Setup

1. open terminal in backend folder, initialize the project and download packages

npm init -y
npm install express cors socket.io sqlite3

2. install React types (if missing)

npm install -D @types/react @types/react-dom

3. generate the vite react-typescript architecture

npm create vite@latest frontend -- --template react-ts

4. start the server

cd backend
node server.js

5. switch to browser: http://localhost:3000



## How to use it

## Communication

## Guideline for tests