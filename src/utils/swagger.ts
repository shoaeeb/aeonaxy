import {Express,Request,Response} from "express";
import swaggerJsDoc from "swagger-jsdoc"
import swaggerUi from "swagger-ui-express"
import {version} from "../../package.json"
import { appendFile } from "fs";

const options:swaggerJsDoc.Options = {
    definition:{
        openapi:"3.0.0",
        info:{
            title:"API Docs",
            version
        },
        components:{
            securitySchemas:{
                bearerAuth:{
                    type:"http",
                    scheme:"bearer",
                    bearerFormat:"JWT"
                }
            }
        },
        security:[
            {
                bearerAuth:[]
            }
        ]
    },apis:["./src/routes/*.ts"]
}

const swaggerSpec = swaggerJsDoc(options);


function swaggerDocs(app:Express,port:number) {
    

    app.use("/docs",swaggerUi.serve,swaggerUi.setup(swaggerSpec));


    app.use("docs.json",(req:Request,res:Response)=>{
        res.setHeader("Content-Type","application/json");
        res.send(swaggerSpec)
    })

    console.log(`Docs available at http://localhost:${port}/docs`)
}

export default swaggerDocs;