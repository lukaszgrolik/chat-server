// import * as path from 'path';
// import * as fs from 'fs';
// import * as yargs from 'yargs';
// import * as fastGlob from 'fast-glob';
import * as express from 'express';
import * as cors from 'cors';
// import * as mongodb from 'mongodb';
import * as WebSocket from 'ws';

import {ApiData} from './shared/interfaces';
// import { DbData, DbCollections, ApiData } from './interfaces';
// import projectsEndpoint from './projects';
// import chartsEndpoint from './charts';
// import { formatResponse } from './utils';

const app = express();
const port = 3030;
// const mongo = mongodb.MongoClient;

interface DB {
    channels: {id: number; name: string}[];
    messages: {id: number; channelId: number; createdAt: string; body: string}[];
}

const db: DB = {
    channels: [
        {
            id: 1,
            name: 'channel 1'
        },
        {
            id: 2,
            name: 'channel 2',
        },
    ],
    messages: [
        {
            id: 1,
            channelId: 1,
            createdAt: '2020-11-14T00:15:27.542Z',
            body: 'how its going'
        },
    ],
};

interface ServerState {
    sockets: WebSocket[];
}
const serverState: ServerState = {
    sockets: [],
}

const wss = new WebSocket.Server({ port: 3031 });

interface MessageAction {
    action: string;
    data: {[key: string]: any};
}

namespace WsActions {
    export namespace Message {
        export interface Create {
            action: 'messages/create';
            data: ApiData.Payload.Create.Message;
        }
    }
}

function wsMessageIsAction(msg: any): msg is MessageAction {
    return msg && typeof msg === 'object' && typeof msg.action === 'string' && typeof msg.data === 'object';
}

function isCreateMessageAction(obj: MessageAction): obj is WsActions.Message.Create {
    return obj.action === 'messages/create' && typeof obj.data.channelId === 'number' && typeof obj.data.body === 'string';
}

wss.on('connection', function connection(ws) {
    // state.activeUsers += 1;
    serverState.sockets.push(ws);
    // @todo send message total active users

    ws.send(JSON.stringify({data: db}));

    ws.onclose = () => {
        // state.activeUsers -= 1;
        const index = serverState.sockets.indexOf(ws);
        if (index === -1)
            console.warn('socket not found');
        else
            serverState.sockets.splice(index, 1);

        // @todo send message total active users
    };

    ws.on('message', (message) => {
        console.log('received:', message);

        if (typeof message === 'string') {
            let data: unknown;
            try {
                data = JSON.parse(message);
            }
            catch (err) {
                // non-json sent
            }

            if (wsMessageIsAction(data)) {
                if (isCreateMessageAction(data)) {
                    const {data: payload} = data;
                    const message = {
                        id: db.messages.length + 1,
                        createdAt: new Date().toISOString(),
                        // @todo check auth
                        channelId: payload.channelId,
                        // @todo validate length etc
                        body: payload.body,
                    };
                    db.messages.push(message);

                    const wsMessage = {
                        data: {messages: [message]},
                    };
                    // ws.send(JSON.stringify(wsMessage));

                    serverState.sockets.forEach(socket => {
                        socket.send(JSON.stringify(wsMessage));
                    });
                }
            }
        }
    });
});

(async () => {
    // const client = await mongo.connect('mongodb://localhost:27017', {
    //     useUnifiedTopology: true,
    // });
    // const db = client.db('vizPlayground');
    // // split collections by operation type to allow separate typings
    // const collections: DbCollections = {
    //     find: {
    //         projects: db.collection('projects'),
    //         charts: db.collection('charts'),
    //     },
    //     insert: {
    //         projects: db.collection('projects'),
    //         charts: db.collection('charts'),
    //     },
    //     update: {
    //         projects: db.collection('projects'),
    //         charts: db.collection('charts'),
    //     },
    // };

    app.use(cors({ origin: '*' }));
    app.use(express.json());

    app.get('/', (req, res) => {
        res.send('Hello World!');
    });

    const api = express.Router();

    // api.get<null, ApiData.Response.Data, null>('/data', async (req, res) => {
    //     const projects = await collections.find.projects.find({}).toArray();
    //     const charts = await collections.find.charts.find({}).toArray();

    //     res.json({
    //         projects: projects.map(formatResponse),
    //         charts: charts.map(formatResponse),
    //     });
    // });

    // api.use('/projects', projectsEndpoint(collections));
    // api.use('/charts', chartsEndpoint(collections));

    // app.use('/api', api);

    app.listen(port, () => {
        console.log(`Example app listening at http://localhost:${port}`);
    });
})();