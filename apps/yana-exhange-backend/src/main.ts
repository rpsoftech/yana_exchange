import { SocketioSocket } from '@yana-exhchange/interface';
import { server } from './app/Database';

const port = process.env['PORT'] || 3101;
server.listen(+port);

server.of('users').use((socket: SocketioSocket, next) => {
    // socket.handshake.auth.type
});
