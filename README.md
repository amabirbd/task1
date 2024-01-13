## Simple forum implementation in nodejs


## Running the project
* Create `.env` file. add `DATABASE_URL`.

run, 
- `npm install`
- `npm run prepare:db`
- `npm run dev`

server should be running at: `http://localhost:3000/`

postman collection for api testing included. 

## Database choice

A forum is a very structured application where data is not very dynamic so i choose a relation database which can offer great speed, security, scalability and reliablity. I could've gone with mysql but i'm more familiar with postgresl, So i choose postgres for the project.