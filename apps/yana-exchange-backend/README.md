# Yana Exchange Server
Communication to YANA using WebSocket.

## Getting Started.

Things to do before starting your development

Step 1:
```
npm install
```
Step 2:
Create .env File at apps/yana-exchange-backend/.env to Store and env Variables.

Step 3: Add Env Variable As Mentioned Below
```
DATABASE="Your Database Name"
DBHOST="Database Conenction Url"
DBUSER="Database User Name"
DBPORT="Database Port Number" (Optional)
DBPASSWORD="Database User Password"
USEDBJSONPARSER="true"(USE this when end point database is Mariadb or MYSQL version lessthan v8.x)
REDISURL="Redis Database URL" (Optional If Want to use Redis For Auto Scaling)
``` 
Step 4:(Optional If want to enable `SSL capability`)

Add File `"ssl.json"` to `apps/yana-exchange-backend/src/assets` containg data as Below

```
{
  "key":"Private Key", // Private Key From SSL
  "crt":"Main certificate", // Certifivate From SSL
  "ca":["string array of "] // CA certificates as Array
}
```

Step 5: To Run Locally 

```
npx nx serve yana-exchange-backend
```

## Deployment

To deploy this project run

Step 1: To Build the Project run 
```bash
 npx nx build yana-exchange-backend:production 
```
Above Command will generate output at 'dist/apps/yana-exchange-backend'

Copy this Folder to Your Server Then To Run:

```bash
 node path/to/your/folder/main.js
```

Note: TO RUN SERVER ON DIFFERENT port USE `PORT` Env Variable