import { DataSource } from "typeorm";
import path from "path";
let { PGHOST, PGDATABASE, PGUSER, PGPASSWORD } = process.env;

const AppDataSource = new DataSource({
  type: "postgres",
  host: PGHOST as string,
  port: 5432,
  username: PGUSER,
  password: PGPASSWORD,
  database: PGDATABASE,
  entities: [path.join(__dirname, "../models/*.ts")],
  subscribers: [path.join(__dirname, "../subscriber/*.ts")],
  synchronize: true,
  logging: false,
  ssl: true,
});

export default AppDataSource;
