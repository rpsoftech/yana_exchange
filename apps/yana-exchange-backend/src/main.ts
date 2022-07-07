import { server } from './app/Database';
import { AddUserNameSpace } from './app/users.namespace';

const port = process.env['PORT'] || 3101;
server.listen(+port);
console.log(`Configured PORT ${port}`);

AddUserNameSpace(server);
