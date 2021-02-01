import Container from "typedi";
import { Connection, createConnection, useContainer, getConnectionOptions } from "typeorm";

export default async (): Promise<Connection> => {
  // read connection options from ormconfig file (or ENV variables)

  const connectionOptions = await getConnectionOptions();
  // typedi + typeorm
  useContainer(Container);

  // create a connection using modified connection options
  const connection = await createConnection(connectionOptions);

  return connection;
};
