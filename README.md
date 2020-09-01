## NODE JS API TEMPLATE README
Build required API's for your application in quick time using this Node JS Template. This template includes User & Book components. Book component can be used for creating components like Publication, Library, City, Country etc.

### Tech Stack - 
* **Language** - NodeJS / Javascript
* **Database** - MySQL, MongoDB
* **Caching** - Redis

### Checkout Component based NodeJS API Template - 
* Git repo - ([Link](https://github.com/amarthakur0/nodejs-api-component))

### Features - 
* Built on Express frameowrk ([Documentation link](https://expressjs.com/))
* MySQL DB with Sequelize ORM ([Documentation link](https://sequelize.org/))
* Mongo DB with Mongoose ORM ([Documentation link](https://mongoosejs.com/))
* API validations using Hapi Joi ([Documentation link](https://hapi.dev/module/joi/))
* Auth using JWT token ([Documentation link](https://www.npmjs.com/package/jsonwebtoken))
* API Rate limiting ([Documentation link](https://www.npmjs.com/package/rate-limiter-flexible))
* Error logging using Winston logger on daily basis ([Documentation link](https://www.npmjs.com/package/winston))
* File uploading middleware using Multer ([Documentation link](https://www.npmjs.com/package/multer))
* Built on latest NPM modules with 0 vulnerabilities inside modules (check modules vulnerability by running **npm audit**)
* Extra features - 
  - Send email using Nodemailer ([Documentation link](https://nodemailer.com/))
  - Read & write excel files using XLSX ([Documentation link](https://www.npmjs.com/package/xlsx))

### Version - 
* NodeJS - Tested on v10.x & v12.x
* MySQL - Tested on v5.7
* MongoDB - Tested on v4.2
* Redis - Tested on v3.2

### Code Structure - 
* **config** - For storing config files
* **constants** - All required constants files will reside here. Like error codes, messages etc
* **db** - All Database related files will reside here (MySQL, MongoDB & Redis(caching))
* **db_dump** - All database dump files will reside here. 
* **helpers** - All required helpers function will reside here. Which includes auth token generation, logger, common functions(encrypt, decrypt, date format, read/write excel file etc) etc.
* **keys** - All required keys will reside here. Like storing auth token public & private keys.
* **logs** - All info & error logs will reside here. This folder will be automatically created, once application started for the first time.
* **middlewares** - All required middlewares will reside here. Which includes all api validations, auth token validations, file upload, api rate limiting for brute force attack etc.
* **node_modules** - All required third party node modules will reside here. This folder will be automatically created, once **npm install** command is executed.
* **postman** - Postman colections
* **routes** - All api route files will reside here
* **uploads** - All uploaded files will reside here
* **index.js** - This wil be entry point for NodeJS API application
* **package.json** - All required node modules, project info, scripts commands details will be stored here.
* **.gitignore** - All folder & files which will not be pushed to git will be maintained here

### Book Component code files -
* **route** - /routes/v1/book.js ([Open file](/routes/v1/book.js))
* **joi schema wrapper** - /middlewares/validations/book.js ([Open file](/middlewares/validations/book.js))
* **joi schema** - /middlewares/validations/joi/book.js ([Open file](/middlewares/validations/joi/book.js))
* **sequelize schema** - /db/sequelize/schema/book.js ([Open file](/db/sequelize/schema/book.js))
* **sequelize book class** - /db/sequelize/book.js ([Open file](/db/sequelize/book.js))

### Create new RSA(512 bit) Public & Private key pair and place it in "/keys/auth" folder -
* Online RSA Key Generator ([Link](https://travistidwell.com/jsencrypt/demo/))
* Generate using openssl

### Start Application -
1. Install all npm modules -
    ```
    npm install
    ```
2. Start application -
    ```
    npm run dev
    ```

### Checkout core mysql2 package based implementation ([Open branch](../../tree/mysql2-based))